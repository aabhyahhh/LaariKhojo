import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import HomeScreen from "./components/HomeScreen";
import Register from "./components/Register";
import UpdateProfile from "./components/UpdateProfile";
import Login from "./components/Login";
import laari from "./assets/logo_cropped.png";
import logo from "./assets/logo.png";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import usePageTracking from './usePageTracking';
import api, { normalizeVendor } from './api/client';


import ReactGA from 'react-ga4';

ReactGA.initialize('G-ZC8J75N781'); // Your GA4 Measurement ID

interface OperatingHours {
  openTime: string; // Format: "HH:mm" in 24-hour format
  closeTime: string; // Format: "HH:mm" in 24-hour format
  days: number[]; // 0-6 representing Sunday-Saturday
}

interface Vendor {
  _id: string;
  name?: string;
  businessName?: string;
  vendorName?: string;
  contactNumber: string;
  email?: string;
  mapsLink?: string;
  operatingHours?: any;
  updatedAt?: string;
  foodType?: 'veg' | 'non-veg' | 'swaminarayan' | 'jain' | 'none';
  profilePicture?: string;
  bestDishes?: Array<{ name: string; price?: number; menuLink?: string }>;
  latitude?: number;
  longitude?: number;
}

function MapDisplay() {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isLocationLoading, setIsLocationLoading] = useState<boolean>(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorCardVisible, setIsVendorCardVisible] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Vendor[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showError, setShowError] = useState(true);

  const navigate = useNavigate();

  // Helper function to convert time string to minutes from midnight (supports 24-hour and 12-hour AM/PM)
  const convertToMinutes = (timeStr: string): number => {
    // Try 24-hour format first
    let match = timeStr.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return hours * 60 + minutes;
    }
    // Try 12-hour format with AM/PM
    match = timeStr.match(/^\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return hours * 60 + minutes;
    }
    return 0; // fallback
  };

  const getOperatingStatus = (operatingHours?: OperatingHours) => {
    if (!operatingHours || !operatingHours.openTime || !operatingHours.closeTime || !operatingHours.days || operatingHours.days.length === 0) {
      return { status: 'Hours Not Specified', color: '#888' };
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const yesterdayDay = (currentDay - 1 + 7) % 7; // The day before today
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const openTimeInMinutes = convertToMinutes(operatingHours.openTime);
    const closeTimeInMinutes = convertToMinutes(operatingHours.closeTime);

    let isOpen = false;
    // Case 1: Overnight schedule (e.g., 22:00 - 02:00)
    if (closeTimeInMinutes < openTimeInMinutes) {
      // Overnight: openTime (e.g., 19:00) to 23:59 today, and 00:00 to closeTime tomorrow
      if (
        (currentMinutes >= openTimeInMinutes && operatingHours.days.includes(currentDay)) ||
        (currentMinutes <= closeTimeInMinutes && operatingHours.days.includes(yesterdayDay))
      ) {
        isOpen = true;
      }
    }
    // Case 2: Same-day schedule
    else {
      if (currentMinutes >= openTimeInMinutes && currentMinutes <= closeTimeInMinutes && operatingHours.days.includes(currentDay)) {
        isOpen = true;
      }
    }

    if (!isOpen) {
      return { status: 'Closed', color: '#d9534f' };
    }

    // If open, check if it's closing soon
    const closesSoonThreshold = 30; // minutes
    let timeUntilClose;
    if (closeTimeInMinutes < openTimeInMinutes) {
      // Overnight: calculate time until close correctly
      if (currentMinutes >= openTimeInMinutes) {
        // Before midnight
        timeUntilClose = (closeTimeInMinutes + 1440) - currentMinutes;
      } else {
        // After midnight
        timeUntilClose = closeTimeInMinutes - currentMinutes;
      }
    } else {
      timeUntilClose = closeTimeInMinutes - currentMinutes;
    }
    if (timeUntilClose > 0 && timeUntilClose <= closesSoonThreshold) {
      return { status: 'Closes Soon', color: '#f0ad4e' };
    }

    return { status: 'Open Now', color: '#28a745' };
  };

  // Alternative: IP-based location fallback
  const getLocationFromIP = async () => {
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude
        };
      }
    } catch (error) {
      console.error('IP location failed:', error);
    }
    return null;
  };

  // Simplified getUserLocation with better error handling
  const getUserLocation = async () => {
    setIsLocationLoading(true);
    
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by this browser");
      setError("Geolocation is not supported by your browser. Using default view.");
      setIsLocationLoading(false);
      return;
    }

    try {
      // Try browser geolocation first
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false, // Set to false to avoid 429 errors
            timeout: 10000,
            maximumAge: 600000 // 10 minutes cache
          }
        );
      });

      const userCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      console.log("User location obtained:", userCoords);
      setUserLocation(userCoords);
      setError(null);
      setIsLocationLoading(false);
      return;

    } catch (geolocationError: any) {
      console.log("Browser geolocation failed, trying IP location...", geolocationError);
      
      // Fallback to IP-based location
      try {
        const ipLocation = await getLocationFromIP();
        if (ipLocation) {
          console.log("Using IP-based location:", ipLocation);
          setUserLocation(ipLocation);
          setError("Using approximate location based on your IP address.");
        } else {
          console.log("IP location also failed, using default location");
          setError("Could not determine your location. Using default view.");
        }
      } catch (ipError) {
        console.error("IP location also failed:", ipError);
        setError("Could not determine your location. Using default view.");
      }
      
      setIsLocationLoading(false);
    }
  };

  const extractCoordinates = (mapsLink: string) => {
    try {
      console.log("Attempting to extract coordinates from:", mapsLink);

      // Prefer !3d...!4d... pattern (actual place coordinates)
      let match = mapsLink.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (match) {
        const coords = {
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
        };
        console.log("Extracted coordinates from !3d...!4d...:", coords);
        return coords;
      }

      // Fallback to @lat,lng
      match = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        const coords = {
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
        };
        console.log("Extracted coordinates from @lat,lng:", coords);
        return coords;
      }

      // Fallback to place/@lat,lng
      match = mapsLink.match(/place\/.*\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
        if (match) {
          const coords = {
            latitude: parseFloat(match[1]),
            longitude: parseFloat(match[2]),
          };
        console.log("Extracted coordinates from place/@lat,lng:", coords);
          return coords;
        }

      // Fallback to q=lat,lng
      match = mapsLink.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (match) {
        const coords = {
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2]),
        };
        console.log("Extracted coordinates from q=lat,lng:", coords);
        return coords;
      }

      console.error("No coordinates found in URL");
      return null;
    } catch (error) {
      console.error("Error extracting coordinates:", error);
      return null;
    }
  };

  const fetchVendors = async () => {
    try {
      const result = await api.getAllUsers();
      
      if (result.success && result.data) {
        // Normalize all vendors to ensure latitude/longitude fields
        const normalized = result.data.map(normalizeVendor);
        setVendors(normalized);
        console.log("Vendors set successfully:", normalized.length, "vendors");
        return normalized;
      } else {
        console.error("API response indicates failure:", result.error);
        setError(result.error || "Failed to fetch vendors data");
        return [];
      }
    } catch (error: unknown) {
      console.error("Error fetching vendors:", error);
      setError(`Failed to fetch vendors data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  };

  // Create custom icon with size based on zoom level
  const createVendorIcon = () => {
    return L.icon({
      iconUrl: laari,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });
  };

  const initializeMap = () => {
    if (isMapInitialized) {
      return;
    }

    // Default center coordinates (Jaipur, Rajasthan)
    const defaultCoords: [number, number] = [26.9124, 75.7873];
    const initialCoords = userLocation
      ? [userLocation.latitude, userLocation.longitude]
      : defaultCoords;

    const initialZoom = userLocation ? 15 : 13;
    setCurrentZoom(initialZoom);

    console.log("Initializing map with coordinates:", initialCoords);
    
    // Check if map container exists
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      console.error("Map container not found");
      return;
    }

    try {
      mapRef.current = L.map("map", { zoomControl: false }).setView(
        initialCoords as [number, number],
        initialZoom
      );

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", // Changed to OSM to avoid potential issues
        {
          maxZoom: 19,
          attribution: '© OpenStreetMap contributors',
        }
      ).addTo(mapRef.current);

      // Add custom zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      // Handle zoom events to update icon sizes
      mapRef.current.on("zoomend", () => {
        if (mapRef.current) {
          const newZoom = mapRef.current.getZoom();
          setCurrentZoom(newZoom);

          // Update all existing vendor markers with new icon sizes
          Object.entries(markersRef.current).forEach(([_, marker]) => {
            const newIcon = createVendorIcon();
            marker.setIcon(newIcon);
          });
        }
      });

      // Add user location CSS
      const style = document.createElement("style");
      style.textContent = `
        .user-location-marker {
          background: transparent;
        }
        .pulse {
          width: 20px;
          height: 20px;
          background: rgba(0, 128, 255, 0.7);
          border-radius: 50%;
          box-shadow: 0 0 0 rgba(0, 128, 255, 0.4);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 128, 255, 0.7);
          }
          70% {
            box-shadow: 0 0 0 15px rgba(0, 128, 255, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 128, 255, 0);
          }
        }
      `;
      document.head.appendChild(style);

      setIsMapInitialized(true);
      console.log("Map initialized successfully");
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Failed to initialize map");
    }
  };

  const updateUserLocationMarker = () => {
    if (!mapRef.current || !userLocation) return;

    // Remove existing marker if it exists
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.remove();
    }

    // Create user location marker
    const userIcon = L.divIcon({
      className: "user-location-marker",
      html: '<div class="pulse"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    userLocationMarkerRef.current = L.marker(
      [userLocation.latitude, userLocation.longitude],
      {
        icon: userIcon,
        zIndexOffset: 1000,
      }
    )
      .addTo(mapRef.current)
      .bindPopup("You are here");

    // Center map on user location with animation
    mapRef.current.flyTo(
      [userLocation.latitude, userLocation.longitude],
      15,
      {
        animate: true,
        duration: 1.5,
      }
    );
  };

  // Add this function to handle grouped vendors at the same location
  const createGroupedPopupContent = (vendorsAtLocation: Vendor[]) => {
    const count = vendorsAtLocation.length;
    
    return `
      <div class="grouped-popup" style="font-size: 12px; line-height: 1.4; min-width: 280px; max-width: 320px;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee;">
          <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #2c3e50;">${count} Vendors at this location</h3>
          <button onclick="event.stopPropagation(); this.closest('.leaflet-popup').style.display='none'" style="background: none; border: none; font-size: 16px; color: #999; cursor: pointer; padding: 2px;">×</button>
        </div>
        
        <!-- Vendor List -->
        <div style="max-height: 280px; overflow-y: auto;">
          ${vendorsAtLocation.map((vendor, index) => {
            const { status, color } = getOperatingStatus(vendor.operatingHours);
            return `
              <div class="vendor-item" style="
                display: flex; 
                align-items: center; 
                padding: 8px 6px; 
                margin-bottom: ${index < vendorsAtLocation.length - 1 ? '4px' : '0'}; 
                cursor: pointer; 
                border-radius: 6px;
                transition: background-color 0.2s;
              " 
              onclick="window.openVendorCard('${vendor._id}')"
              onmouseover="this.style.backgroundColor='#f8f9fa'"
              onmouseout="this.style.backgroundColor='transparent'">
                
                <!-- Vendor Avatar -->
                <div style="margin-right: 12px; flex-shrink: 0;">
                  ${vendor.profilePicture ? `
                    <img src="${vendor.profilePicture}" alt="${vendor.name}" style="
                      width: 32px; 
                      height: 32px; 
                      border-radius: 50%; 
                      object-fit: cover; 
                      border: 2px solid #ddd;
                    " />
                  ` : `
                    <div style="
                      width: 32px; 
                      height: 32px; 
                      border-radius: 50%; 
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      display: flex; 
                      align-items: center; 
                      justify-content: center; 
                      color: white; 
                      font-weight: bold; 
                      font-size: 14px;
                    ">
                      ${(vendor.name?.charAt(0) || '?').toUpperCase()}
                    </div>
                  `}
                </div>
                
                <!-- Vendor Info -->
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2px;">
                    <h4 style="margin: 0; font-size: 13px; font-weight: 600; color: #2c3e50; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px;">
                      ${vendor.name || 'Unnamed Vendor'}
                    </h4>
                    <span style="font-size: 16px; margin-left: 8px; flex-shrink: 0;">→</span>
                  </div>
                  
                  <div style="font-size: 11px; color: #666; margin-bottom: 3px;">
                    ${vendor.foodType || 'Food type not specified'}
                  </div>
                  
                  ${vendor.operatingHours ? `
                    <div style="display: flex; align-items: center;">
                      <span style="color: ${color}; margin-right: 4px; font-size: 8px;">●</span>
                      <span style="color: ${color}; font-size: 11px; font-weight: 500;">${status}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>
        
        <!-- Footer -->
        <div style="text-align: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid #eee;">
          <span style="color: #666; font-size: 11px; font-style: italic;">Click any vendor to view full details</span>
        </div>
      </div>
    `;
  };

  // Updated updateMapMarkers function to group vendors by location
  const updateMapMarkers = (vendors: Vendor[]) => {
    if (!mapRef.current || !isMapInitialized) {
      console.log("Map not initialized, skipping marker update");
      return;
    }

    console.log("Updating map markers for vendors:", vendors.length);

    // Clear existing vendor markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Group vendors by location (within ~50 meters)
    const locationGroups: { [key: string]: Vendor[] } = {};
    const processedVendors = new Set<string>();

    vendors.forEach((vendor) => {
      if (processedVendors.has(vendor._id)) return;

      // Get coordinates for this vendor
      let coords = null;
      if (typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number') {
        coords = { latitude: vendor.latitude, longitude: vendor.longitude };
      } else if (vendor.mapsLink) {
        coords = extractCoordinates(vendor.mapsLink);
      }
      
      if (!coords) {
        console.log(`Could not determine coordinates for ${vendor.name}`);
        return;
      }

      // Create a location key (rounded to ~50m precision)
      const locationKey = `${Math.round(coords.latitude * 1000)}_${Math.round(coords.longitude * 1000)}`;
      
      if (!locationGroups[locationKey]) {
        locationGroups[locationKey] = [];
      }
      
      locationGroups[locationKey].push(vendor);
      processedVendors.add(vendor._id);
    });

    // Create markers for each location group
    Object.entries(locationGroups).forEach(([locationKey, vendorsAtLocation]) => {
      if (vendorsAtLocation.length === 0) return;

      // Use the first vendor's coordinates as the group location
      const firstVendor = vendorsAtLocation[0];
      let coords = null;
      
      if (typeof firstVendor.latitude === 'number' && typeof firstVendor.longitude === 'number') {
        coords = { latitude: firstVendor.latitude, longitude: firstVendor.longitude };
      } else if (firstVendor.mapsLink) {
        coords = extractCoordinates(firstVendor.mapsLink);
      }
      
      if (!coords) return;

      try {
        let popupContent: string;
        let customIcon: L.Icon | L.DivIcon;

        if (vendorsAtLocation.length === 1) {
          // Single vendor - use existing popup design
          const vendor = vendorsAtLocation[0];
          const { status, color } = getOperatingStatus(vendor.operatingHours);
          
          popupContent = `
            <div class="custom-popup" style="font-size: 12px; line-height: 1.4; min-width: 200px; cursor: pointer;" onclick="window.openVendorCard('${vendor._id}')">
              <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                ${vendor.profilePicture ? `
                  <img src="${vendor.profilePicture}" alt="${vendor.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 2px solid #ddd;" />
                ` : `
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
                    ${(vendor.name?.charAt(0) || '?').toUpperCase()}
                  </div>
                `}
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #2c3e50;">${vendor.name}</h3>
                  ${vendor.foodType ? `<div style="color: #666; font-size: 11px; margin-bottom: 4px;">${vendor.foodType}</div>` : ''}
                  ${vendor.operatingHours ? `
                    <div style="display: flex; align-items: center;">
                      <span style="color: ${color}; margin-right: 4px; font-size: 10px;">●</span>
                      <span style="color: ${color}; font-size: 11px;">${status}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
              <div style="text-align: center; color: #007bff; font-size: 11px; font-weight: 500; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                Click to view full details →
              </div>
            </div>
          `;
          
          customIcon = createVendorIcon();
        } else {
          // Multiple vendors - use grouped popup
          popupContent = createGroupedPopupContent(vendorsAtLocation);
          
          // Create clustered icon with count
          customIcon = L.divIcon({
            className: 'vendor-cluster',
            html: `
              <div style="
                background: #C80B41;
                color: white;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                border: 3px solid white;
                box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              ">
                ${vendorsAtLocation.length}
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32],
          });
        }

        const marker = L.marker([coords.latitude, coords.longitude], {
          icon: customIcon,
        })
          .addTo(mapRef.current!)
          .bindPopup(popupContent, {
            maxWidth: vendorsAtLocation.length > 1 ? 320 : 250,
            className: vendorsAtLocation.length > 1 ? 'grouped-popup-container' : 'custom-popup-container'
          });

        // Store marker with a combined key for grouped locations
        const markerKey = vendorsAtLocation.length === 1 
          ? vendorsAtLocation[0]._id 
          : `group_${locationKey}`;
        markersRef.current[markerKey] = marker;
        
        console.log(`Successfully added marker for ${vendorsAtLocation.length} vendor(s) at location`);
      } catch (markerError) {
        console.error(`Error creating marker for location group:`, markerError);
      }
    });

    console.log(`Added ${Object.keys(markersRef.current).length} markers to map`);

    // Fit map bounds if no user location
    if (Object.keys(markersRef.current).length > 0 && !userLocation) {
      try {
        const group = L.featureGroup(Object.values(markersRef.current));
        mapRef.current.fitBounds(group.getBounds().pad(0.1));
        console.log("Fitted map bounds to include all markers");
      } catch (boundsError) {
        console.error("Error fitting bounds:", boundsError);
      }
    }
  };

  // Setup initial conditions
  useEffect(() => {
    console.log("MapDisplay component mounted, getting user location...");
    getUserLocation();

    // Cleanup function
    return () => {
      console.log("MapDisplay component unmounting, cleaning up...");
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      Object.values(markersRef.current).forEach((marker) => marker.remove());
      markersRef.current = {};
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      setIsMapInitialized(false);
    };
  }, []);

  // Initialize map once we know about user location (or timeout occurred)
  useEffect(() => {
    if (!isLocationLoading && !isMapInitialized) {
      console.log("Location loading complete, initializing map...");
      initializeMap();
    }
  }, [isLocationLoading, isMapInitialized]);

  // Add user location marker after map is initialized and location is available
  useEffect(() => {
    if (isMapInitialized && userLocation) {
      console.log("Map initialized and user location available, updating user marker...");
      updateUserLocationMarker();
    }
  }, [isMapInitialized, userLocation]);

  // Fetch vendors after map is initialized
  useEffect(() => {
    if (isMapInitialized) {
      console.log("Map initialized, fetching vendors...");
      const loadVendors = async () => {
        const vendorData = await fetchVendors();
        if (vendorData && vendorData.length > 0) {
          console.log("Fetched vendor data:", vendorData);
          updateMapMarkers(vendorData);
        } else {
          console.log("No vendor data received");
        }
      };
      loadVendors();

      // Setup refresh interval (reduced frequency to avoid overwhelming the server)
      const intervalId = window.setInterval(() => {
        console.log("Refreshing vendor data...");
        loadVendors();
      }, 300000); // Check every 5 minutes instead of 1 minute

      return () => {
        window.clearInterval(intervalId);
      };
    }
  }, [isMapInitialized]);

  // Update markers whenever vendors or zoom level changes
  useEffect(() => {
    if (isMapInitialized && vendors.length > 0) {
      console.log("Vendors or zoom changed, updating markers...");
      updateMapMarkers(vendors);
    }
  }, [vendors, currentZoom, isMapInitialized]);

  // Add location refresh button
  const refreshUserLocation = () => {
    console.log("Refreshing user location...");
    getUserLocation();
  };

  // Add open/close functions
  const openVendorCard = (vendor: Vendor) => {
    if (selectedVendor && selectedVendor._id !== vendor._id) {
      setIsVendorCardVisible(false);
      setTimeout(() => {
        setSelectedVendor(vendor);
        setIsVendorCardVisible(true);
      }, 800); // match the sidebar transition duration
    } else {
      setSelectedVendor(vendor);
      setIsVendorCardVisible(true);
    }
  };
  const closeVendorCard = () => {
    setSelectedVendor(null);
    setIsVendorCardVisible(false);
  };

  // Add global handler
  (window as any).openVendorCard = (vendorId: string) => {
    const vendor = vendors.find(v => v._id === vendorId);
    if (vendor) {
      openVendorCard(vendor);
    }
  };

  // Search bar logic
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowSuggestions(false);
      return;
    }
    const results = vendors.filter(vendor =>
      (vendor.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setSearchResults(results);
    setShowSuggestions(true);
  }, [searchTerm, vendors]);

  const handleSearchSelect = (vendor: Vendor) => {
    setSearchTerm(vendor.name || '');
    setShowSuggestions(false);
    // Zoom to vendor and open popup/card
    let coords = null;
    if (typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number') {
      coords = { latitude: vendor.latitude, longitude: vendor.longitude };
    } else if (vendor.mapsLink) {
      coords = extractCoordinates(vendor.mapsLink);
    }
    if (coords && mapRef.current) {
      // Use flyTo for smooth transition and center zoom
      mapRef.current.flyTo([coords.latitude, coords.longitude], 17, {
        animate: true,
        duration: 1.5
      });
      // Open popup if marker exists
      const marker = markersRef.current[vendor._id];
      if (marker) {
        marker.openPopup();
      }
      // Open vendor card as well
      openVendorCard(vendor);
    }
  };

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Top bar: Logo and Search Bar in a flex container for alignment */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1200,
          width: 'calc(100vw - 40px)',
          maxWidth: '700px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          pointerEvents: 'none', // allow map interaction except for children
        }}
      >
        {/* Logo */}
        <div
          style={{
            cursor: 'pointer',
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            height: '60px',
          }}
          onClick={() => navigate('/')}
        >
          <img src={logo} alt="Laari Logo" style={{ height: '60px', width: 'auto' }} />
        </div>
        {/* Search Bar */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'auto',
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <input
              type="text"
              placeholder="Search for a vendor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(searchResults.length > 0)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '24px',
                border: '1px solid #ccc',
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                outline: 'none',
                background: 'white',
              }}
            />
            {showSuggestions && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '48px',
                left: 0,
                width: '100%',
                background: 'white',
                border: '1px solid #eee',
                borderRadius: '0 0 12px 12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                maxHeight: '220px',
                overflowY: 'auto',
                zIndex: 1300,
              }}>
                {searchResults.map(vendor => (
                  <div
                    key={vendor._id}
                    onClick={() => handleSearchSelect(vendor)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f3f3f3',
                      fontWeight: 500,
                      color: '#2c3e50',
                      background: searchTerm === vendor.name ? '#f5f8ff' : 'white',
                    }}
                    onMouseDown={e => e.preventDefault()}
                  >
                    {vendor.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Error message covers search bar and can be dismissed */}
      {error && showError && (
        <div
          className="error-message"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100vw",
            backgroundColor: "#ff4d4d",
            color: "white",
            padding: "14px 60px 14px 24px",
            borderRadius: 0,
            zIndex: 1201,
            maxWidth: "100vw",
            textAlign: "left",
            fontSize: "20px",
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            boxSizing: 'border-box',
          }}
        >
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setShowError(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '28px',
              fontWeight: 700,
              cursor: 'pointer',
              marginLeft: '16px',
              lineHeight: 1,
              padding: 0,
              opacity: 0.85,
              transition: 'opacity 0.2s',
            }}
            aria-label="Close error message"
            title="Close"
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.85')}
          >
            ×
          </button>
        </div>
      )}
      {/* Map Content */}
      <div id="map" style={{ width: "100%", height: "100%", flexGrow: 1 }}></div>
      <button
        onClick={refreshUserLocation}
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          zIndex: 1000,
          padding: "10px",
          borderRadius: "50%",
          backgroundColor: "white",
          border: "2px solid #007bff",
          cursor: "pointer",
          width: "50px",
          height: "50px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        }}
        title="Refresh Location"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#007bff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
      </button>
      {isLocationLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            padding: "20px",
            borderRadius: "5px",
            zIndex: 1000,
            textAlign: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <div>Loading your location...</div>
          <div
            style={{
              width: "30px",
              height: "30px",
              border: "5px solid #f3f3f3",
              borderTop: "5px solid #3498db",
              borderRadius: "50%",
              margin: "10px auto",
              animation: "spin 2s linear infinite",
            }}
          ></div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}
      {isVendorCardVisible && selectedVendor && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '320px',
            height: '100vh',
            backgroundColor: 'white',
            zIndex: 2000,
            boxShadow: '2px 0 15px rgba(0,0,0,0.15)',
            overflow: 'auto',
            transform: isVendorCardVisible ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)'
          }}
        >
          <button
            onClick={closeVendorCard}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'rgba(0,0,0,0.1)',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#666',
              zIndex: 2001,
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.2)'}
            onMouseLeave={(e) => (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.1)'}
          >
            ×
          </button>
          
          <div style={{ padding: '20px 16px' }}>
            {/* Profile Picture and Name */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {selectedVendor.profilePicture ? (
                <img
                  src={selectedVendor.profilePicture}
                  alt={selectedVendor.name || 'Vendor'}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #eee',
                    marginBottom: '8px',
                  }}
                />
              ) : (
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                }}>
                  {(selectedVendor.name?.charAt(0) || '?').toUpperCase()}
                </div>
              )}
              <h2 style={{ 
                margin: '8px 0 4px 0', 
                color: '#2c3e50', 
                fontSize: '18px',
                fontWeight: '600',
                lineHeight: '1.2'
              }}>
                {selectedVendor.name || 'Not available'}
              </h2>
              <div style={{ 
                color: '#666', 
                marginBottom: '12px', 
                fontSize: '13px',
                fontWeight: '500'
              }}>
                {selectedVendor.foodType || 'Not available'}
              </div>
            </div>

            {/* Operating Status */}
            {selectedVendor.operatingHours && (
              <div style={{
                textAlign: 'center',
                marginBottom: '16px',
                padding: '8px 12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '12px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  color: getOperatingStatus(selectedVendor.operatingHours).color,
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}>
                  <span style={{ fontSize: '8px' }}>●</span>
                  {getOperatingStatus(selectedVendor.operatingHours).status}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              marginBottom: '20px',
              justifyContent: 'center'
            }}>
              <a
                href={selectedVendor.mapsLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 16px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '13px',
                  transition: 'background-color 0.2s',
                  flex: 1,
                  justifyContent: 'center'
                }}
              >
                📍 Directions
              </a>
              {selectedVendor.contactNumber && (
                <a
                  href={`tel:${selectedVendor.contactNumber}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '13px',
                    transition: 'background-color 0.2s',
                    flex: 1,
                    justifyContent: 'center'
                  }}
                >
                  📞 Call
                </a>
              )}
            </div>

            {/* Contact Number */}
            <div style={{ 
              marginBottom: '16px', 
              fontSize: '13px',
              textAlign: 'center',
              color: '#666'
            }}>
              <strong>Phone:</strong> {selectedVendor.contactNumber || 'Not available'}
            </div>

            {/* Operating Hours and Days - Compact */}
            <div style={{ 
              marginBottom: '20px', 
              fontSize: '13px', 
              color: '#444',
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '6px' }}>
                <strong>Hours:</strong> {
                  selectedVendor.operatingHours && 
                  selectedVendor.operatingHours.openTime && 
                  selectedVendor.operatingHours.closeTime 
                    ? `${selectedVendor.operatingHours.openTime} - ${selectedVendor.operatingHours.closeTime}` 
                    : 'Not available'
                }
              </div>
              <div>
                <strong>Days:</strong> {
                  selectedVendor.operatingHours && 
                  selectedVendor.operatingHours.days && 
                  selectedVendor.operatingHours.days.length > 0 
                    ? selectedVendor.operatingHours.days
                        .sort((a: number, b: number) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                        .map((day: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day])
                        .join(', ') 
                    : 'Not available'
                }
              </div>
            </div>

            {/* Menu Options - Compact */}
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ 
                fontSize: '15px', 
                color: '#2c3e50', 
                margin: '0 0 12px 0',
                fontWeight: '600'
              }}>
                Menu
              </h3>
              {Array.isArray(selectedVendor.bestDishes ?? []) && (selectedVendor.bestDishes ?? []).length > 0 ? (
                <div style={{ 
                  maxHeight: '200px', 
                  overflowY: 'auto',
                  backgroundColor: '#f8f9fa',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  {(selectedVendor.bestDishes ?? []).slice(0, 8).map((dish, idx) => (
                    <div key={idx} style={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                      fontSize: '13px',
                      color: '#444',
                      paddingBottom: '6px',
                      borderBottom: idx < Math.min((selectedVendor.bestDishes ?? []).length - 1, 7) ? '1px solid #e9ecef' : 'none'
                    }}>
                      <span style={{ 
                        fontWeight: '500',
                        flex: 1,
                        paddingRight: '8px'
                      }}>
                        {dish.name || 'Not available'}
                      </span>
                      {dish.price !== undefined && dish.price !== null ? (
                        <span style={{ 
                          color: '#28a745', 
                          fontWeight: '600',
                          fontSize: '12px'
                        }}>
                          ₹{dish.price}
                        </span>
                      ) : (
                        <span style={{ 
                          color: '#888', 
                          fontSize: '11px'
                        }}>
                          N/A
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ 
                  color: '#888', 
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '20px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef'
                }}>
                  Menu not available
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {isVendorCardVisible && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 1999
          }}
          onClick={closeVendorCard}
        />
      )}
    </div>
  );
}

function App() {
  const location = useLocation();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  
  const handleLoginSuccess = (token: string) => {
    setToken(token);
  };
  usePageTracking(); // tracks every route change

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", flexDirection: "column" }}>
      {/* Main content area */}
      <div style={{ flexGrow: 1, position: "relative" }}>
        <Routes>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/map" element={<MapDisplay />} />
          <Route
            path="/register"
            element={<Register onRegisterSuccess={() => {}} />}
          />
          <Route
            path="/login"
            element={<Login onLoginSuccess={handleLoginSuccess} />}
          />
          <Route
            path="/update-profile"
            element={
              token ? (
                <UpdateProfile />
              ) : (
                <Navigate to="/login" state={{ from: location }} replace />
              )
            }
          />
        </Routes>
      </div>
    </div>
  );
}

export default App;
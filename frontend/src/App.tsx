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
import api, { Vendor } from './api/client';


import ReactGA from 'react-ga4';

ReactGA.initialize('G-ZC8J75N781'); // Your GA4 Measurement ID

interface OperatingHours {
  openTime: string; // Format: "HH:mm" in 24-hour format
  closeTime: string; // Format: "HH:mm" in 24-hour format
  days: number[]; // 0-6 representing Sunday-Saturday
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

  const navigate = useNavigate();

  // Helper function to determine vendor operating status and color
  const getOperatingStatus = (operatingHours?: OperatingHours) => {
    if (!operatingHours || !operatingHours.openTime || !operatingHours.closeTime || !operatingHours.days) {
      return { status: 'Hours Not Specified', color: '#888' };
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 for Sunday, 6 for Saturday
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [openHours, openMinutes] = operatingHours.openTime.split(':').map(Number);
    const [closeHours, closeMinutes] = operatingHours.closeTime.split(':').map(Number);

    const openTimeInMinutes = openHours * 60 + openMinutes;
    let closeTimeInMinutes = closeHours * 60 + closeMinutes;

    // Handle overnight closing (e.g., opens 22:00, closes 02:00)
    if (closeTimeInMinutes < openTimeInMinutes) {
      if (currentMinutes >= openTimeInMinutes || currentMinutes <= closeTimeInMinutes) {
        // Within operating hours (including overnight)
      } else {
        return { status: 'Closed', color: '#d9534f' };
      }
    } else {
      // Standard same-day closing
      if (currentMinutes < openTimeInMinutes || currentMinutes > closeTimeInMinutes) {
        return { status: 'Closed', color: '#d9534f' };
      }
    }

    // Check if it's the right day
    if (!operatingHours.days.includes(currentDay)) {
      return { status: 'Closed Today', color: '#d9534f' };
    }

    // Check for 'Closes Soon' (within 30 minutes)
    const closesSoonThreshold = 30; // minutes
    if (closeTimeInMinutes < openTimeInMinutes) { // Overnight closing
      // Calculate time until close for today/tomorrow
      const timeUntilClose = (closeTimeInMinutes - currentMinutes + 1440) % 1440; 
      if (timeUntilClose <= closesSoonThreshold) {
        return { status: 'Closes Soon', color: '#f0ad4e' }; // Orange for closes soon
      }
    } else { // Same day closing
      if (closeTimeInMinutes - currentMinutes > 0 && closeTimeInMinutes - currentMinutes <= closesSoonThreshold) {
        return { status: 'Closes Soon', color: '#f0ad4e' };
      }
    }

    return { status: 'Open Now', color: '#28a745' }; // Green for open
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

      // Try multiple regex patterns to handle different Google Maps URL formats
      const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/, // Standard format
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // Alternate format
        /place\/.*\/@(-?\d+\.\d+),(-?\d+\.\d+)/, // Place format
        /q=(-?\d+\.\d+),(-?\d+\.\d+)/, // Query format
      ];

      for (const pattern of patterns) {
        const match = mapsLink.match(pattern);
        if (match) {
          const coords = {
            latitude: parseFloat(match[1]),
            longitude: parseFloat(match[2]),
          };
          console.log("Successfully extracted coordinates:", coords);
          return coords;
        }
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
        setVendors(result.data);
        console.log("Vendors set successfully:", result.data.length, "vendors");
        return result.data;
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

  // Updated updateMapMarkers function
  const updateMapMarkers = (vendors: Vendor[]) => {
    if (!mapRef.current || !isMapInitialized) {
      console.log("Map not initialized, skipping marker update");
      return;
    }

    console.log("Updating map markers for vendors:", vendors.length);

    // Clear existing vendor markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Track vendor markers for fitting bounds
    const validMarkers: L.Marker[] = [];

    vendors.forEach((vendor, index) => {
      console.log(`Processing vendor ${index + 1}:`, {
        name: vendor.name,
        mapsLink: vendor.mapsLink || "No maps link",
        hasOperatingHours: !!vendor.operatingHours,
        foodType: vendor.foodType
      });

      // Check if mapsLink exists
      if (!vendor.mapsLink) {
        console.log(`${vendor.name} has no Google Maps link, skipping`);
        return;
      }

      const coords = extractCoordinates(vendor.mapsLink);
      
      if (!coords) {
        console.log(`Could not extract coordinates for ${vendor.name}`);
        return;
      }

      const { status, color } = getOperatingStatus(vendor.operatingHours);

      // Create popup content with icons and collapsible operating hours
      const popupContent = `
        <div class="custom-popup" style="font-size: 12px; line-height: 1.4; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #2c3e50;">${vendor.name}</h3>
          
          ${vendor.contactNumber ? `
            <div style="display: flex; align-items: center; margin-bottom: 6px;">
              <svg style="width: 14px; height: 14px; margin-right: 8px; color: #666;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span style="color: #666;">${vendor.contactNumber}</span>
            </div>
          ` : ''}

          ${vendor.operatingHours ? `
            <div style="margin-bottom: 6px;">
              <div style="display: flex; align-items: center; cursor: pointer;" onclick="this.parentElement.querySelector('.hours-details').style.display = this.parentElement.querySelector('.hours-details').style.display === 'none' ? 'block' : 'none'">
                <svg style="width: 14px; height: 14px; margin-right: 8px; color: #666;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <span style="color: ${color}; display: flex; align-items: center;">
                  <span style="color: ${color}; margin-right: 4px;">●</span>
                  ${status}
                  <svg style="width: 12px; height: 12px; margin-left: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </span>
              </div>
              <div class="hours-details" style="display: none; margin-left: 22px; margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;">
                <div style="color: #666; margin-bottom: 2px;">
                  <strong>Hours:</strong> ${vendor.operatingHours.openTime} - ${vendor.operatingHours.closeTime}
                </div>
                <div style="color: #666;">
                  <strong>Days:</strong> ${vendor.operatingHours.days.map((day: number) => 
                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                  ).join(', ')}
                </div>
              </div>
            </div>
          ` : ''}

          ${vendor.mapsLink ? `
            <div style="display: flex; align-items: center;">
              <svg style="width: 14px; height: 14px; margin-right: 8px; color: #666;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <a href="${vendor.mapsLink}" target="_blank" style="color: #007bff; text-decoration: none; font-size: 12px;">View on Maps</a>
            </div>
          ` : ''}
        </div>
      `;

      try {
        // Create vendor icon with size based on current zoom level
        const customIcon = createVendorIcon();

        const marker = L.marker([coords.latitude, coords.longitude], {
          icon: customIcon,
        })
          .addTo(mapRef.current!)
          .bindPopup(popupContent, {
            maxWidth: 250,
            className: 'custom-popup-container'
          });

        markersRef.current[vendor._id] = marker;
        validMarkers.push(marker);
        console.log(`Successfully added marker for ${vendor.name}`);
      } catch (markerError) {
        console.error(`Error creating marker for ${vendor.name}:`, markerError);
      }
    });

    console.log(`Added ${validMarkers.length} markers to map`);

    // Fit map bounds to include all markers if we don't have user location
    if (validMarkers.length > 0 && !userLocation) {
      try {
        const group = L.featureGroup(validMarkers);
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

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Logo in top-left for MapDisplay */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <img src={logo} alt="Laari Logo" style={{ height: '100px' }} />
      </div>

      {/* Map Content */}
      <div id="map" style={{ width: "100%", height: "100%", flexGrow: 1 }}></div>
      {error && (
        <div
          className="error-message"
          style={{
            position: "absolute",
            top: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 0, 0, 0.7)",
            color: "white",
            padding: "10px",
            borderRadius: "5px",
            zIndex: 1000,
            maxWidth: "90%",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
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
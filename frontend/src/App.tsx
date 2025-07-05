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
import api, { normalizeVendor, Review } from './api/client';


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
  area?: string; // Add area field for vendor location
  location?: { area?: string; coordinates?: number[] }; // Add location field for vendor location
  category?: string[]; // Add category field for food categories
}

// Define food categories
const FOOD_CATEGORIES = [
  'Chaat',
  'Juices',
  'Tea/coffee',
  'Snacks (Samosa, Vada Pav, etc.)',
  'Dessert',
  'Gujju Snacks',
  'PavBhaji',
  'Punjabi (Parathe, Lassi, etc)',
  'Paan',
  'Korean',
  'Chinese',
  'South Indian',
  'Other'
];

const FOOD_TYPES = ['veg', 'non-veg', 'swaminarayan', 'jain'];

// Filter interface
interface FilterState {
  foodTypes: string[];
  categories: string[];
}

// Define area boundaries for Ahmedabad and Gandhinagar localities
const AREA_BOUNDARIES: { [key: string]: { lat: number; lng: number; zoom: number } } = {
  // Ahmedabad
  'navrangpura': { lat: 23.0425, lng: 72.5586, zoom: 15 },
  'ellis bridge': { lat: 23.0258, lng: 72.5714, zoom: 15 },
  'paldi': { lat: 23.0120, lng: 72.5597, zoom: 15 },
  'maninagar': { lat: 22.9957, lng: 72.6031, zoom: 15 },
  'vastrapur': { lat: 23.0406, lng: 72.5151, zoom: 15 },
  'satellite': { lat: 23.0307, lng: 72.5151, zoom: 15 },
  'bopal': { lat: 23.0300, lng: 72.4647, zoom: 14 },
  'bodakdev': { lat: 23.0587, lng: 72.5072, zoom: 15 },
  'thaltej': { lat: 23.0702, lng: 72.5077, zoom: 15 },
  'gota': { lat: 23.1023, lng: 72.5417, zoom: 14 },
  'chandkheda': { lat: 23.1122, lng: 72.5797, zoom: 14 },
  'motera': { lat: 23.1046, lng: 72.5952, zoom: 15 },
  'sabarmati': { lat: 23.0736, lng: 72.5802, zoom: 15 },
  'naranpura': { lat: 23.0680, lng: 72.5617, zoom: 15 },
  'memnagar': { lat: 23.0626, lng: 72.5462, zoom: 15 },
  'ambawadi': { lat: 23.0225, lng: 72.5487, zoom: 15 },
  'vasna': { lat: 23.0067, lng: 72.5462, zoom: 15 },
  'jodhpur': { lat: 23.0262, lng: 72.5151, zoom: 15 },
  'prahlad nagar': { lat: 23.0225, lng: 72.5017, zoom: 15 },
  'shyamal': { lat: 23.0250, lng: 72.5300, zoom: 15 },
  'anandnagar': { lat: 23.0275, lng: 72.5400, zoom: 15 },
  'gheekanta': { lat: 23.0300, lng: 72.5800, zoom: 15 },
  'kalupur': { lat: 23.0286, lng: 72.6029, zoom: 15 },
  'saraspur': { lat: 23.0380, lng: 72.6130, zoom: 15 },
  'asara': { lat: 23.0400, lng: 72.6000, zoom: 15 },
  'naroda': { lat: 23.0896, lng: 72.6677, zoom: 14 },
  'odhav': { lat: 23.0330, lng: 72.6690, zoom: 14 },
  'vatva': { lat: 22.9580, lng: 72.6420, zoom: 14 },
  'iscon': { lat: 23.0300, lng: 72.4950, zoom: 15 },
  'sarkhej': { lat: 22.9910, lng: 72.5010, zoom: 14 },
  'juhapura': { lat: 23.0080, lng: 72.5240, zoom: 14 },
  'vastral': { lat: 23.0330, lng: 72.6850, zoom: 14 },
  'nikol': { lat: 23.0450, lng: 72.6700, zoom: 14 },
  'bapunagar': { lat: 23.0330, lng: 72.6250, zoom: 15 },
  'amraiwadi': { lat: 23.0130, lng: 72.6350, zoom: 15 },
  'ranip': { lat: 23.0800, lng: 72.5700, zoom: 15 },
  'gandhinagar': { lat: 23.2230, lng: 72.6500, zoom: 13 },
  // Gandhinagar
  'sector 1': { lat: 23.2230, lng: 72.6500, zoom: 15 },
  'sector 2': { lat: 23.2250, lng: 72.6520, zoom: 15 },
  'sector 3': { lat: 23.2270, lng: 72.6540, zoom: 15 },
  'sector 4': { lat: 23.2290, lng: 72.6560, zoom: 15 },
  'sector 5': { lat: 23.2310, lng: 72.6580, zoom: 15 },
  'sector 6': { lat: 23.2330, lng: 72.6600, zoom: 15 },
  'sector 7': { lat: 23.2350, lng: 72.6620, zoom: 15 },
  'sector 8': { lat: 23.2370, lng: 72.6640, zoom: 15 },
  'sector 9': { lat: 23.2390, lng: 72.6660, zoom: 15 },
  'sector 10': { lat: 23.2410, lng: 72.6680, zoom: 15 },
  'sector 11': { lat: 23.2430, lng: 72.6700, zoom: 15 },
  'sector 12': { lat: 23.2450, lng: 72.6720, zoom: 15 },
  'sector 13': { lat: 23.2470, lng: 72.6740, zoom: 15 },
  'sector 14': { lat: 23.2490, lng: 72.6760, zoom: 15 },
  'sector 15': { lat: 23.2510, lng: 72.6780, zoom: 15 },
  'sector 16': { lat: 23.2530, lng: 72.6800, zoom: 15 },
  'sector 17': { lat: 23.2550, lng: 72.6820, zoom: 15 },
  'sector 18': { lat: 23.2570, lng: 72.6840, zoom: 15 },
  'sector 19': { lat: 23.2590, lng: 72.6860, zoom: 15 },
  'sector 20': { lat: 23.2610, lng: 72.6880, zoom: 15 },
  'sector 21': { lat: 23.2630, lng: 72.6900, zoom: 15 },
  'sector 22': { lat: 23.2650, lng: 72.6920, zoom: 15 },
  'sector 23': { lat: 23.2670, lng: 72.6940, zoom: 15 },
  'sector 24': { lat: 23.2690, lng: 72.6960, zoom: 15 },
  'sector 25': { lat: 23.2710, lng: 72.6980, zoom: 15 },
  'sector 26': { lat: 23.2730, lng: 72.7000, zoom: 15 },
  'sector 27': { lat: 23.2750, lng: 72.7020, zoom: 15 },
  'sector 28': { lat: 23.2770, lng: 72.7040, zoom: 15 },
  'sector 29': { lat: 23.2790, lng: 72.7060, zoom: 15 },
  'sector 30': { lat: 23.2810, lng: 72.7080, zoom: 15 },
  'infocity': { lat: 23.2040, lng: 72.6369, zoom: 15 },
  'gift city': { lat: 23.1568, lng: 72.6835, zoom: 15 },
  'kudasan': { lat: 23.2000, lng: 72.6500, zoom: 15 },
  'chiloda': { lat: 23.2500, lng: 72.7000, zoom: 15 },
  'sargasan': { lat: 23.2100, lng: 72.6200, zoom: 15 },
  'adraj mota': { lat: 23.3000, lng: 72.7000, zoom: 15 },
  'randesan': { lat: 23.2200, lng: 72.7100, zoom: 15 },
  'vavol': { lat: 23.2300, lng: 72.7200, zoom: 15 },
  'pethapur': { lat: 23.2800, lng: 72.7300, zoom: 15 },
  'kolavada': { lat: 23.2900, lng: 72.7400, zoom: 15 },
  'zundal': { lat: 23.1800, lng: 72.6700, zoom: 15 },
  'chhatral': { lat: 23.3300, lng: 72.7800, zoom: 15 },
  // Add more localities as needed
};

function MapDisplay() {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]); // Add filtered vendors state
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
  const [searchResults, setSearchResults] = useState<any[]>([]); // Change to any[] to support different result types
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showError, setShowError] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Filter states
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    foodTypes: [],
    categories: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showOnlyOpen, setShowOnlyOpen] = useState(false);

  const navigate = useNavigate();



  // Filter vendors based on active filters and open status
  const applyFilters = (vendorList: Vendor[]) => {
    let filteredVendors = vendorList;

    // Apply open/closed filter first
    if (showOnlyOpen) {
      filteredVendors = filteredVendors.filter(vendor => {
        const { status } = getOperatingStatus(vendor.operatingHours);
        return status === 'Open Now';
      });
    }

    // Apply food type and category filters
    if (activeFilters.foodTypes.length === 0 && activeFilters.categories.length === 0) {
      return filteredVendors; // No additional filters applied, return filtered vendors
    }

    console.log('Applying filters:', activeFilters);
    console.log('Vendors to filter:', filteredVendors.length);

    return filteredVendors.filter(vendor => {
      // Check food type filter
      const foodTypeMatch = activeFilters.foodTypes.length === 0 || 
        activeFilters.foodTypes.includes((vendor.foodType || 'none').toLowerCase().trim());

      // Check category filter - use the category field that's now set by normalizeVendor
      const categoryMatch = activeFilters.categories.length === 0 || 
        (vendor.category && vendor.category.some((cat: string) => activeFilters.categories.includes(cat)));

      // Debug: Log vendor filtering details for food type filters
      if (activeFilters.foodTypes.length > 0) {
        console.log(`Vendor ${vendor.name}:`, {
          foodType: vendor.foodType,
          foodTypeMatch,
          categoryMatch,
          passes: foodTypeMatch && categoryMatch
        });
      }

      return foodTypeMatch && categoryMatch;
    });
  };

  // Handle filter changes
  const handleFilterChange = (filterType: 'foodTypes' | 'categories', value: string) => {
    console.log('Filter change triggered:', { filterType, value });
    
    setActiveFilters(prev => {
      let newFilters: string[];
      
      if (filterType === 'foodTypes') {
        // For food types: only one can be selected at a time (radio button behavior)
        const currentFoodType = prev.foodTypes[0]; // Get the currently selected food type
        if (currentFoodType === value) {
          // If clicking the same food type, deselect it
          newFilters = [];
        } else {
          // Select the new food type (replace any existing selection)
          newFilters = [value];
        }
      } else {
        // For categories: multiple can be selected (checkbox behavior)
        const currentFilters = prev[filterType];
        newFilters = currentFilters.includes(value)
          ? currentFilters.filter(item => item !== value)
          : [...currentFilters, value];
      }

      const updatedFilters = {
        ...prev,
        [filterType]: newFilters
      };

      console.log('Updated filters:', updatedFilters);

      // Apply filters immediately
      const filtered = applyFilters(vendors);
      setFilteredVendors(filtered);

      return updatedFilters;
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({
      foodTypes: [],
      categories: []
    });
    setShowOnlyOpen(false);
    setFilteredVendors([]);
  };

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
    if (!operatingHours || !operatingHours.openTime || !operatingHours.closeTime) {
      return { status: 'Hours Not Specified', color: '#888' };
    }

    // If days is missing or empty, assume all days
    const days = Array.isArray(operatingHours.days) && operatingHours.days.length > 0
      ? operatingHours.days
      : [0,1,2,3,4,5,6];

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
        (currentMinutes >= openTimeInMinutes && days.includes(currentDay)) ||
        (currentMinutes <= closeTimeInMinutes && days.includes(yesterdayDay))
      ) {
        isOpen = true;
      }
    }
    // Case 2: Same-day schedule
    else {
      if (currentMinutes >= openTimeInMinutes && currentMinutes <= closeTimeInMinutes && days.includes(currentDay)) {
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

      // Add custom zoom control to bottom left
      L.control.zoom({ position: 'bottomleft' }).addTo(mapRef.current);

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
        .vendor-cluster {
          background: #ff6b6b;
          border: 2px solid white;
          border-radius: 50%;
          color: white;
          font-weight: bold;
          text-align: center;
          line-height: 28px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .filter-panel {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 16px;
        }
        .filter-section {
          margin-bottom: 16px;
        }
        .filter-section h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }
        .filter-options {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .filter-chip {
          padding: 4px 12px;
          background: #f0f0f0;
          border: 1px solid #ddd;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-chip:hover {
          background: #e0e0e0;
        }
        .filter-chip.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        .filter-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        .filter-button {
          padding: 6px 12px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .filter-button:hover {
          background: #f5f5f5;
        }
        .filter-button.primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        .filter-button.primary:hover {
          background: #0056b3;
        }
        .active-filters-count {
          display: inline-block;
          background: #ff6b6b;
          color: white;
          border-radius: 10px;
          padding: 2px 6px;
          font-size: 10px;
          margin-left: 4px;
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
  const updateMapMarkers = (vendorsToDisplay: Vendor[]) => {
    if (!mapRef.current || !isMapInitialized) {
      console.log("Map not initialized, skipping marker update");
      return;
    }

    console.log("Updating map markers for vendors:", vendorsToDisplay.length);

    // Clear existing vendor markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Group vendors by location (within ~50 meters)
    const locationGroups: { [key: string]: Vendor[] } = {};
    const processedVendors = new Set<string>();

    vendorsToDisplay.forEach((vendor) => {
      if (processedVendors.has(vendor._id)) return;

      // Get coordinates for this vendor
      let coords = getVendorCoordinates(vendor);
      
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
      let coords = getVendorCoordinates(firstVendor);
      
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

  // Update markers whenever vendors, filtered vendors, or zoom level changes
  useEffect(() => {
    if (isMapInitialized && vendors.length > 0) {
      console.log("Vendors or zoom changed, updating markers...");
      // Use filtered vendors if available, otherwise use all vendors
      const vendorsToShow = filteredVendors.length > 0 ? filteredVendors : vendors;
      updateMapMarkers(vendorsToShow);
    }
  }, [vendors, filteredVendors, currentZoom, isMapInitialized]);

  // Apply filters when vendors are loaded
  useEffect(() => {
    if (vendors.length > 0) {
      if (activeFilters.foodTypes.length > 0 || activeFilters.categories.length > 0 || showOnlyOpen) {
        const filtered = applyFilters(vendors);
        setFilteredVendors(filtered);
        console.log('Filters applied:', {
          foodTypes: activeFilters.foodTypes,
          categories: activeFilters.categories,
          showOnlyOpen,
          filteredCount: filtered.length,
          totalVendors: vendors.length
        });
      } else {
        // No filters active, show all vendors
        setFilteredVendors([]);
        console.log('No filters active, showing all vendors');
      }
    }
  }, [vendors, activeFilters, showOnlyOpen]);

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
    // First try to find vendor in filtered vendors, then in all vendors
    const vendor = (filteredVendors.length > 0 ? filteredVendors : vendors).find(v => v._id === vendorId);
    if (vendor) {
      openVendorCard(vendor);
    }
  };

  // Enhanced search bar logic with area functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      setShowSuggestions(false);
      // Don't clear filtered vendors when search is cleared - keep filters active
      return;
    }

    const lowerSearch = searchTerm.toLowerCase();
    const results: any[] = [];
    const areaMatches: Array<{
      type: 'area';
      name: string;
      displayName: string;
      coordinates: { lat: number; lng: number; zoom: number };
    }> = [];

    // Check for area matches first
    Object.keys(AREA_BOUNDARIES).forEach(area => {
      if (area.toLowerCase().includes(lowerSearch)) {
        areaMatches.push({
          type: 'area',
          name: area,
          displayName: `${area.charAt(0).toUpperCase() + area.slice(1)} Area`,
          coordinates: AREA_BOUNDARIES[area]
        });
      }
    });

    // Use filtered vendors if available, otherwise use all vendors
    const vendorsToSearch = filteredVendors.length > 0 ? filteredVendors : vendors;

    // Filter vendors by name and menu items
    const vendorResults = vendorsToSearch.filter(vendor => {
      // Match vendor name
      if ((vendor.name || '').toLowerCase().includes(lowerSearch)) {
        return true;
      }
      // Match menu items (bestDishes)
      if (Array.isArray(vendor.bestDishes)) {
        return vendor.bestDishes.some(dish =>
          (dish.name || '').toLowerCase().includes(lowerSearch)
        );
      }
      return false;
    });

    // Filter vendors by area if area is specified
    if (lowerSearch.length > 2) {
      const areaVendors = vendorsToSearch.filter(vendor => {
        const vendorArea = (vendor.area || vendor.location?.area || '').toLowerCase();
        return vendorArea.includes(lowerSearch);
      });
      
      // Add area-specific vendor results
      if (areaVendors.length > 0) {
        results.push({
          type: 'area-vendors',
          area: lowerSearch,
          vendors: areaVendors,
          displayName: `${areaVendors.length} vendors in ${lowerSearch}`
        });
      }
    }

    // Combine all results: areas first, then area-vendors, then individual vendors
    const finalResults = [...areaMatches, ...results, ...vendorResults];
    
    setSearchResults(finalResults);
    setShowSuggestions(true);
  }, [searchTerm, vendors, filteredVendors]);

  // Enhanced search selection handler
  const handleSearchSelect = (result: any) => {
    if (result.type === 'area') {
      // Handle area selection - center map on area
      setSearchTerm(result.displayName);
      setShowSuggestions(false);
      
      if (mapRef.current) {
        mapRef.current.flyTo(
          [result.coordinates.lat, result.coordinates.lng], 
          result.coordinates.zoom,
          {
            animate: true,
            duration: 1.5
          }
        );
      }
      
      // Optionally filter vendors by area
      filterVendorsByArea(result.name);
      
    } else if (result.type === 'area-vendors') {
      // Handle area-vendors selection - show all vendors in that area
      setSearchTerm(`Vendors in ${result.area}`);
      setShowSuggestions(false);
      
      // Center map on area and show all vendors
      const firstVendor = result.vendors[0];
      if (firstVendor && mapRef.current) {
        const coords = getVendorCoordinates(firstVendor);
        if (coords) {
          mapRef.current.flyTo([coords.latitude, coords.longitude], 14, {
            animate: true,
            duration: 1.5
          });
        }
      }
      
      // Highlight all vendors in the area
      highlightAreaVendors(result.vendors);
      
    } else {
      // Handle individual vendor selection (original logic)
      setSearchTerm(result.name || '');
      setShowSuggestions(false);
      
      let coords = getVendorCoordinates(result);
      if (coords && mapRef.current) {
        mapRef.current.flyTo([coords.latitude, coords.longitude], 17, {
          animate: true,
          duration: 1.5
        });
        
        // Find the marker - it might be in a group
        const marker = markersRef.current[result._id];
        if (marker) {
          marker.openPopup();
        }
        openVendorCard(result);
      }
    }
  };

  // Replace all coordinate extraction logic for vendors in MapDisplay with the following helper:
  const getVendorCoordinates = (vendor: Vendor): { latitude: number; longitude: number } | null => {
    // 1. Try mapsLink extraction
    if (vendor.mapsLink) {
      const coords = extractCoordinates(vendor.mapsLink);
      if (coords) return coords;
    }
    // 2. Try latitude/longitude fields
    if (typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number') {
      return { latitude: vendor.latitude, longitude: vendor.longitude };
    }
    // 3. Try location.coordinates (WhatsApp pin)
    if ((vendor as any).location && Array.isArray((vendor as any).location.coordinates) && (vendor as any).location.coordinates.length === 2) {
      return {
        latitude: (vendor as any).location.coordinates[1],
        longitude: (vendor as any).location.coordinates[0],
      };
    }
    return null;
  };

  // Helper function to filter vendors by area
  const filterVendorsByArea = (area: string) => {
    // Apply area filter on top of existing filters
    const currentFiltered = applyFilters(vendors);
    const areaFiltered = currentFiltered.filter(vendor => {
      const vendorArea = (vendor.area || vendor.location?.area || '').toLowerCase();
      return vendorArea.includes(area.toLowerCase());
    });
    
    setFilteredVendors(areaFiltered);
  };

  // Helper function to highlight area vendors
  const highlightAreaVendors = (areaVendors: Vendor[]) => {
    // Close all existing popups
    Object.values(markersRef.current).forEach(marker => {
      if (marker) marker.closePopup();
    });
    
    // Open popups for area vendors
    areaVendors.forEach(vendor => {
      // Check if vendor has an individual marker
      const marker = markersRef.current[vendor._id];
      if (marker) {
        marker.openPopup();
      } else {
        // Vendor might be in a group marker, try to find it
        Object.entries(markersRef.current).forEach(([key, marker]) => {
          if (key.startsWith('group_')) {
            // This is a group marker, we can't easily highlight individual vendors
            // Just open the group popup
            marker.openPopup();
          }
        });
      }
    });
  };

  // Handle Enter key press for area search
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const lowerSearch = searchTerm.toLowerCase().trim();
      
      // Check if it's an area name
      const matchedArea = Object.keys(AREA_BOUNDARIES).find(area => 
        area.toLowerCase() === lowerSearch
      );
      
      if (matchedArea) {
        // Center map on the area
        const coordinates = AREA_BOUNDARIES[matchedArea];
        if (mapRef.current) {
          mapRef.current.flyTo(
            [coordinates.lat, coordinates.lng], 
            coordinates.zoom,
            {
              animate: true,
              duration: 1.5
            }
          );
        }
        
        // Filter vendors by area
        filterVendorsByArea(matchedArea);
        setShowSuggestions(false);
      } else {
        // Try geocoding for unknown areas (optional)
        geocodeAndCenterMap(searchTerm);
      }
    }
  };

  // Optional: Geocoding function for unknown areas
  const geocodeAndCenterMap = async (searchTerm: string) => {
    try {
      // Using a geocoding service (example with OpenStreetMap Nominatim)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchTerm)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        if (mapRef.current) {
          mapRef.current.flyTo([parseFloat(result.lat), parseFloat(result.lon)], 13, {
            animate: true,
            duration: 1.5
          });
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  // Fetch reviews when vendor card opens
  useEffect(() => {
    if (isVendorCardVisible && selectedVendor) {
      api.getReviews(selectedVendor._id).then(res => {
        if (res.success && res.data) setReviews(res.data);
        else setReviews([]);
      });
    }
  }, [isVendorCardVisible, selectedVendor]);

  const handleReviewInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReviewForm({ ...reviewForm, [e.target.name]: e.target.value });
  };

  const handleStarClick = (star: number) => {
    setReviewForm({ ...reviewForm, rating: star });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setReviewError(null);
    if (!selectedVendor) return;
    if (!reviewForm.name || !reviewForm.email || !reviewForm.rating) {
      setReviewError('Name, email, and rating are required.');
      setSubmitting(false);
      return;
    }
    const reviewData = {
      vendorId: selectedVendor._id,
      name: reviewForm.name,
      email: reviewForm.email,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    };
    const res = await api.addReview(reviewData);
    if (res.success && res.data) {
      setReviews([res.data, ...reviews]);
      setReviewForm({ name: '', email: '', rating: 0, comment: '' });
      setShowAllReviews(false);
    } else {
      setReviewError(res.error || 'Failed to submit review.');
    }
    setSubmitting(false);
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
              placeholder="Search for a vendor or area..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(searchResults.length > 0)}
              onKeyPress={handleSearchKeyPress}
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
                {searchResults.map((result, index) => {
                  if (result.type === 'area') {
                    return (
                      <div
                        key={`area-${index}`}
                        onClick={() => handleSearchSelect(result)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f3f3',
                          fontWeight: 500,
                          color: '#2c3e50',
                          background: '#e8f4fd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '8px', fontSize: '16px' }}>📍</span>
                          <span>{result.displayName}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Area</span>
                      </div>
                    );
                  } else if (result.type === 'area-vendors') {
                    return (
                      <div
                        key={`area-vendors-${index}`}
                        onClick={() => handleSearchSelect(result)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f3f3',
                          fontWeight: 500,
                          color: '#2c3e50',
                          background: '#fff3cd',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '8px', fontSize: '16px' }}>🏪</span>
                          <span>{result.displayName}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Area Vendors</span>
                      </div>
                    );
                  } else {
                    // Individual vendor
                    return (
                      <div
                        key={result._id}
                        onClick={() => handleSearchSelect(result)}
                        style={{
                          padding: '12px 16px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f3f3',
                          fontWeight: 500,
                          color: '#2c3e50',
                          background: searchTerm === result.name ? '#f5f8ff' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                        onMouseDown={e => e.preventDefault()}
                      >
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: '8px', fontSize: '16px' }}>🍽️</span>
                          <span>{result.name}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>Vendor</span>
                      </div>
                    );
                  }
                })}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Filter Panel */}
      <div
        style={{
          position: 'absolute',
          top: '100px',
          left: '20px',
          zIndex: 1200,
          width: '300px',
        }}
      >
        {/* Filter Toggle Button */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            padding: window.innerWidth <= 768 ? '4px 10px' : '8px 16px',
            backgroundColor: 'white',
            border: '2px solid #C80B41',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: window.innerWidth <= 768 ? '10px' : '14px',
            fontWeight: '500',
            color: '#C80B41',
            display: 'flex',
            alignItems: 'center',
            gap: window.innerWidth <= 768 ? '4px' : '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            pointerEvents: 'auto',
            marginBottom: '8px',
          }}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = '#fff5f7';
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.backgroundColor = 'white';
          }}
        >
          <span>🔍</span>
          Filters
          {(activeFilters.foodTypes.length > 0 || activeFilters.categories.length > 0) && (
            <span className="active-filters-count">
              {activeFilters.foodTypes.length + activeFilters.categories.length}
            </span>
          )}
        </button>

        {/* What's Open Now Button */}
        <button
          onClick={() => {
            const newShowOnlyOpen = !showOnlyOpen;
            setShowOnlyOpen(newShowOnlyOpen);
            
            if (newShowOnlyOpen) {
              // Apply open filter immediately
              const filtered = applyFilters(vendors);
              setFilteredVendors(filtered);
            } else {
              // Clear open filter - show all vendors or apply other active filters
              if (activeFilters.foodTypes.length === 0 && activeFilters.categories.length === 0) {
                setFilteredVendors([]); // This will show all vendors in the useEffect
              } else {
                // Reapply other active filters
                const filtered = applyFilters(vendors);
                setFilteredVendors(filtered);
              }
            }
          }}
          style={{
            padding: window.innerWidth <= 768 ? '4px 10px' : '8px 16px',
            backgroundColor: showOnlyOpen ? '#C80B41' : 'white',
            border: '2px solid #C80B41',
            borderRadius: '20px',
            cursor: 'pointer',
            fontSize: window.innerWidth <= 768 ? '10px' : '14px',
            fontWeight: '500',
            color: showOnlyOpen ? 'white' : '#C80B41',
            display: 'flex',
            alignItems: 'center',
            gap: window.innerWidth <= 768 ? '4px' : '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.2s',
            pointerEvents: 'auto',
          }}
          onMouseEnter={(e) => {
            if (!showOnlyOpen) {
              (e.target as HTMLButtonElement).style.backgroundColor = '#fff5f7';
            }
          }}
          onMouseLeave={(e) => {
            if (!showOnlyOpen) {
              (e.target as HTMLButtonElement).style.backgroundColor = 'white';
            }
          }}
        >
          <span>🕐</span>
          {showOnlyOpen ? 'Show All' : "What's Open Now"}
        </button>

        {/* Filter Panel Content */}
        {showFilters && (
          <div className="filter-panel" style={{ marginTop: '12px', pointerEvents: 'auto' }}>
            {/* Vendor Count */}
            <div style={{ 
              marginBottom: '16px', 
              padding: '8px 12px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '6px',
              fontSize: '12px',
              color: '#666',
              textAlign: 'center'
            }}>
              Showing {filteredVendors.length > 0 ? filteredVendors.length : vendors.length} of {vendors.length} vendors
              {showOnlyOpen && (
                <div style={{ 
                  fontSize: '11px', 
                  color: '#C80B41', 
                  fontWeight: '500',
                  marginTop: '2px'
                }}>
                  (Open now only)
                </div>
              )}
            </div>

            {/* Food Type Filters */}
            <div className="filter-section">
              <h3>Food Type</h3>
              <div className="filter-options">
                {FOOD_TYPES.map(type => (
                  <button
                    key={type}
                    className={`filter-chip ${activeFilters.foodTypes.includes(type) ? 'active' : ''}`}
                    onClick={() => handleFilterChange('foodTypes', type)}
                  >
                    {type === 'veg' ? '🥬' : type === 'non-veg' ? '🍗' : type === 'swaminarayan' ? '🕉️' : '☸️'} {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filters */}
            <div className="filter-section">
              <h3>Food Categories</h3>
              <div className="filter-options">
                {FOOD_CATEGORIES.map(category => (
                  <button
                    key={category}
                    className={`filter-chip ${activeFilters.categories.includes(category) ? 'active' : ''}`}
                    onClick={() => handleFilterChange('categories', category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Actions */}
            <div className="filter-actions">
              <button
                className="filter-button"
                onClick={clearAllFilters}
              >
                Clear All
              </button>
              <button
                className="filter-button primary"
                onClick={() => setShowFilters(false)}
              >
                Apply
              </button>
            </div>
          </div>
        )}
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
      {/* Top right controls */}
      <div style={{
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 1201,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 12,
      }}>
        <button
          className="refresh-btn-desktop"
          onClick={refreshUserLocation}
          style={{
            padding: '8px',
            borderRadius: '50%',
            backgroundColor: 'white',
            border: '2px solid #007bff',
            cursor: 'pointer',
            width: '40px',
            height: '40px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 2px 5px rgba(0,0,0,0.12)',
          }}
          title="Refresh Location"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
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
        {/* Zoom controls will be rendered by Leaflet, but you can add custom ones here if needed */}
      </div>
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
              {/* Directions Button: open Google Maps directions from user location to vendor */}
              {(() => {
                const vendorCoords = getVendorCoordinates(selectedVendor);
                let directionsUrl = '#';
                if (vendorCoords) {
                  let origin = 'My+Location';
                  if (userLocation && typeof userLocation.latitude === 'number' && typeof userLocation.longitude === 'number') {
                    origin = `${userLocation.latitude},${userLocation.longitude}`;
                  }
                  directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${vendorCoords.latitude},${vendorCoords.longitude}&travelmode=driving`;
                }
                return (
                  <a
                    href={directionsUrl}
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
                );
              })()}
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

            {/* Report Button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => {
                  const vendorCoords = getVendorCoordinates(selectedVendor);
                  const reportData = {
                    vendorName: selectedVendor.name || 'Unknown Vendor',
                    vendorId: selectedVendor._id,
                    vendorLocation: vendorCoords ? `${vendorCoords.latitude}, ${vendorCoords.longitude}` : 'Location not available',
                    vendorArea: selectedVendor.area || selectedVendor.location?.area || 'Area not specified',
                    userLocation: userLocation ? `${userLocation.latitude}, ${userLocation.longitude}` : 'User location not available',
                    reportTime: new Date().toISOString(),
                    subject: `Wrong Location Report - ${selectedVendor.name || 'Unknown Vendor'}`
                  };

                  // Create form data for Web3Forms
                  const formData = new FormData();
                  formData.append('access_key', 'd003bcfb-91bc-44d0-8347-1259bbc5158f'); // Replace with actual access key
                  formData.append('subject', reportData.subject);
                  formData.append('from_name', 'LaariKhojo User');
                  formData.append('message', `
Vendor Location Report

Vendor Name: ${reportData.vendorName}
Vendor ID: ${reportData.vendorId}
Vendor Location: ${reportData.vendorLocation}
Vendor Area: ${reportData.vendorArea}
User Location: ${reportData.userLocation}
Report Time: ${new Date(reportData.reportTime).toLocaleString()}

The user reports that this vendor is not present at the specified location.
                  `.trim());

                  // Submit to Web3Forms
                  fetch('https://api.web3forms.com/submit', {
                    method: 'POST',
                    body: formData
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.success) {
                      alert('Thank you for reporting! We will investigate this location issue.');
                    } else {
                      alert('Failed to submit report. Please try again.');
                    }
                  })
                  .catch(error => {
                    console.error('Error submitting report:', error);
                    alert('Failed to submit report. Please try again.');
                  });
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '500',
                  fontSize: '12px',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                  justifyContent: 'center'
                }}
                onMouseEnter={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#c82333';
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545';
                }}
              >
                ⚠️ Report Wrong Location
              </button>
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

            {/* Reviews & Ratings - Enhanced Version */}
            <div style={{ 
              marginTop: 24, 
              backgroundColor: '#f8f9fa', 
              borderRadius: 12, 
              padding: 16, 
              border: '1px solid #e9ecef' 
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 16 
              }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  color: '#2c3e50', 
                  margin: 0, 
                  fontWeight: 600 
                }}>
                  Reviews & Ratings
                </h3>
                {reviews.length > 0 && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    backgroundColor: '#fff',
                    padding: '4px 8px',
                    borderRadius: 8,
                    border: '1px solid #e9ecef'
                  }}>
                    <span style={{ 
                      color: '#f5b50a', 
                      fontSize: 14, 
                      fontWeight: 'bold' 
                    }}>
                      {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                    </span>
                    <div style={{ color: '#f5b50a', fontSize: 12 }}>
                      {'★'.repeat(Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length))}
                    </div>
                    <span style={{ 
                      color: '#666', 
                      fontSize: 11 
                    }}>
                      ({reviews.length})
                    </span>
                  </div>
                )}
              </div>

              {/* Reviews List */}
              <div style={{ 
                maxHeight: showAllReviews ? '400px' : '200px', 
                overflowY: 'auto',
                marginBottom: 16,
                backgroundColor: '#fff',
                borderRadius: 8,
                border: '1px solid #e9ecef'
              }}>
                {reviews.length === 0 ? (
                  <div style={{ 
                    color: '#888', 
                    fontSize: '13px', 
                    textAlign: 'center',
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    <div style={{ 
                      fontSize: 32, 
                      opacity: 0.3 
                    }}>
                      ⭐
                    </div>
                    <div>No reviews yet</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>
                      Be the first to share your experience!
                    </div>
                  </div>
                ) : (
                  <>
                    {reviews.slice(0, showAllReviews ? reviews.length : 2).map((r, idx) => (
                      <div key={r._id || idx} style={{ 
                        padding: 12,
                        borderBottom: idx < Math.min(reviews.length - 1, showAllReviews ? reviews.length - 1 : 1) ? '1px solid #f0f0f0' : 'none'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'flex-start',
                          marginBottom: 6
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8 
                          }}>
                            <div style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: 12,
                              fontWeight: 'bold'
                            }}>
                              {(r.name || 'A').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ 
                                fontWeight: 600, 
                                fontSize: 13,
                                color: '#2c3e50'
                              }}>
                                {r.name}
                              </div>
                              <div style={{ 
                                fontSize: 10, 
                                color: '#888'
                              }}>
                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                }) : ''}
                              </div>
                            </div>
                          </div>
                          <div style={{ 
                            backgroundColor: '#f8f9fa',
                            padding: '2px 6px',
                            borderRadius: 4,
                            border: '1px solid #e9ecef'
                          }}>
                            <div style={{ 
                              color: '#f5b50a', 
                              fontSize: 12,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 2
                            }}>
                              <span style={{ fontSize: 10 }}>★</span>
                              <span style={{ fontWeight: 600 }}>{r.rating}</span>
                            </div>
                          </div>
                        </div>
                        {r.comment && (
                          <div style={{ 
                            fontSize: 12, 
                            color: '#444',
                            lineHeight: 1.4,
                            marginLeft: 40,
                            fontStyle: 'italic'
                          }}>
                            "{r.comment}"
                          </div>
                        )}
                      </div>
                    ))}
                    {reviews.length > 2 && (
                      <div style={{ 
                        textAlign: 'center', 
                        padding: 8,
                        borderTop: '1px solid #f0f0f0'
                      }}>
                        <button 
                          style={{ 
                            fontSize: 12, 
                            color: '#007bff', 
                            background: 'none', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontWeight: 500,
                            padding: '4px 8px',
                            borderRadius: 4,
                            transition: 'background-color 0.2s'
                          }} 
                          onClick={() => setShowAllReviews(!showAllReviews)}
                          onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = '#f0f8ff'}
                          onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                        >
                          {showAllReviews ? '↑ Show less' : `↓ Show all ${reviews.length} reviews`}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Add Review Form */}
              <div style={{ 
                backgroundColor: '#fff',
                borderRadius: 8,
                padding: 16,
                border: '1px solid #e9ecef'
              }}>
                <h4 style={{ 
                  fontSize: 14, 
                  color: '#2c3e50', 
                  margin: '0 0 12px 0',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{ fontSize: 16 }}>✍️</span>
                  Write a Review
                </h4>
                
                <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        name="name" 
                        value={reviewForm.name} 
                        onChange={handleReviewInput} 
                        placeholder="Your Name" 
                        style={{ 
                          width: '100%', 
                          padding: '8px 12px', 
                          borderRadius: 6, 
                          border: '1px solid #ddd', 
                          fontSize: 13,
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          outline: 'none'
                        }} 
                        onFocus={e => {
                          (e.target as HTMLInputElement).style.borderColor = '#007bff';
                          (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(0,123,255,0.1)';
                        }}
                        onBlur={e => {
                          (e.target as HTMLInputElement).style.borderColor = '#ddd';
                          (e.target as HTMLInputElement).style.boxShadow = 'none';
                        }}
                        required 
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <input 
                        name="email" 
                        value={reviewForm.email} 
                        onChange={handleReviewInput} 
                        placeholder="Your Email" 
                        type="email" 
                        style={{ 
                          width: '100%', 
                          padding: '8px 12px', 
                          borderRadius: 6, 
                          border: '1px solid #ddd', 
                          fontSize: 13,
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          outline: 'none'
                        }} 
                        onFocus={e => {
                          (e.target as HTMLInputElement).style.borderColor = '#007bff';
                          (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(0,123,255,0.1)';
                        }}
                        onBlur={e => {
                          (e.target as HTMLInputElement).style.borderColor = '#ddd';
                          (e.target as HTMLInputElement).style.boxShadow = 'none';
                        }}
                        required 
                      />
                    </div>
                  </div>

                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: 8,
                    padding: 12,
                    backgroundColor: '#f8f9fa',
                    borderRadius: 6,
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{ 
                      fontSize: 13, 
                      fontWeight: 500, 
                      color: '#2c3e50',
                      marginBottom: 4
                    }}>
                      Rate your experience:
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4,
                      justifyContent: 'center'
                    }}>
                      {[1,2,3,4,5].map(star => (
                        <span 
                          key={star} 
                          style={{ 
                            cursor: 'pointer', 
                            color: reviewForm.rating >= star ? '#f5b50a' : '#ddd', 
                            fontSize: 24,
                            transition: 'color 0.2s, transform 0.1s',
                            userSelect: 'none'
                          }} 
                          onClick={() => handleStarClick(star)}
                          onMouseEnter={e => {
                            (e.target as HTMLSpanElement).style.transform = 'scale(1.1)';
                          }}
                          onMouseLeave={e => {
                            (e.target as HTMLSpanElement).style.transform = 'scale(1)';
                          }}
                        >
                          {reviewForm.rating >= star ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                    {reviewForm.rating > 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        fontSize: 11, 
                        color: '#666',
                        marginTop: 4
                      }}>
                        {reviewForm.rating === 1 && "Poor"}
                        {reviewForm.rating === 2 && "Fair"}
                        {reviewForm.rating === 3 && "Good"}
                        {reviewForm.rating === 4 && "Very Good"}
                        {reviewForm.rating === 5 && "Excellent"}
                      </div>
                    )}
                  </div>

                  <div>
                    <textarea 
                      name="comment" 
                      value={reviewForm.comment} 
                      onChange={handleReviewInput} 
                      placeholder="Share your experience (optional)" 
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        border: '1px solid #ddd', 
                        fontSize: 13, 
                        minHeight: 60,
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        outline: 'none'
                      }} 
                      onFocus={e => {
                        (e.target as HTMLTextAreaElement).style.borderColor = '#007bff';
                        (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 2px rgba(0,123,255,0.1)';
                      }}
                      onBlur={e => {
                        (e.target as HTMLTextAreaElement).style.borderColor = '#ddd';
                        (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
                      }}
                    />
                  </div>

                  {reviewError && (
                    <div style={{ 
                      color: '#dc3545', 
                      fontSize: 12, 
                      backgroundColor: '#f8d7da',
                      padding: 8,
                      borderRadius: 4,
                      border: '1px solid #f5c6cb'
                    }}>
                      {reviewError}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting || reviewForm.rating === 0} 
                    style={{ 
                      width: '100%', 
                      background: submitting || reviewForm.rating === 0 ? '#6c757d' : '#007bff', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: 6, 
                      padding: '10px 16px', 
                      fontWeight: 600, 
                      fontSize: 14, 
                      cursor: submitting || reviewForm.rating === 0 ? 'not-allowed' : 'pointer',
                      opacity: submitting || reviewForm.rating === 0 ? 0.7 : 1,
                      transition: 'background-color 0.2s, transform 0.1s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                    onMouseEnter={e => {
                      if (!submitting && reviewForm.rating > 0) {
                        (e.target as HTMLButtonElement).style.backgroundColor = '#0056b3';
                        (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!submitting && reviewForm.rating > 0) {
                        (e.target as HTMLButtonElement).style.backgroundColor = '#007bff';
                        (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    {submitting ? (
                      <>
                        <span style={{ 
                          width: 12, 
                          height: 12, 
                          border: '2px solid #fff', 
                          borderTop: '2px solid transparent', 
                          borderRadius: '50%', 
                          animation: 'spin 1s linear infinite' 
                        }}></span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: 16 }}>📝</span>
                        Submit Review
                      </>
                    )}
                  </button>
                </form>
              </div>
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
      {/* WhatsApp Floating Button - Bottom Right */}
      <a
        href="https://wa.me/15557897194?text=Hi"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 2500,
          width: 50,
          height: 50,
          borderRadius: '50%',
          background: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'none',
          border: 'none',
          cursor: 'pointer',
          transition: 'background 0.2s',
          padding: 0,
        }}
        aria-label="Chat on WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#25D366"/>
          <path d="M16 6.5C10.2 6.5 5.5 11.2 5.5 17C5.5 18.7 6 20.3 6.8 21.7L5 27L10.4 25.2C11.7 25.9 13.3 26.5 15 26.5C20.8 26.5 25.5 21.8 25.5 16C25.5 11.2 20.8 6.5 16 6.5ZM15 24.5C13.5 24.5 12.1 24.1 10.9 23.4L10.6 23.2L7.5 24.2L8.5 21.1L8.3 20.8C7.5 19.5 7 18 7 16.5C7 12.4 10.4 9 14.5 9C18.6 9 22 12.4 22 16.5C22 20.6 18.6 24 14.5 24C14.3 24 14.1 24 14 24C14.3 24.2 14.6 24.4 15 24.5ZM19.2 18.7C18.9 18.6 17.7 18 17.4 17.9C17.1 17.8 16.9 17.8 16.7 18.1C16.5 18.3 16.2 18.7 16 18.9C15.8 19.1 15.6 19.1 15.3 19C14.2 18.6 13.2 17.7 12.6 16.7C12.5 16.4 12.6 16.2 12.8 16C13 15.8 13.2 15.5 13.3 15.3C13.4 15.1 13.4 14.9 13.3 14.7C13.2 14.5 12.7 13.3 12.5 12.8C12.3 12.3 12.1 12.3 11.9 12.3C11.7 12.3 11.5 12.3 11.3 12.3C11.1 12.3 10.8 12.4 10.7 12.6C10.2 13.2 10 14.1 10.2 15.1C10.5 16.7 11.7 18.2 13.2 19.1C14.7 20 16.5 20.2 18.1 19.7C19.1 19.4 20 18.8 20.6 18.3C20.8 18.2 20.9 18 20.9 17.8C20.9 17.6 20.8 17.4 20.7 17.3C20.6 17.2 20.5 17.1 20.3 17.1C20.1 17.1 19.5 17.1 19.2 18.7Z" fill="#fff"/>
        </svg>
      </a>
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
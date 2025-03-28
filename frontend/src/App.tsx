import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import HomeScreen from "./components/HomeScreen";
import Header from "./components/Header";
import Register from "./components/Register";
import UpdateProfile from "./components/UpdateProfile";
import Login from "./components/Login";
import laari from "./assets/laari.png"
import { JSX, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

interface OperatingHours {
  open: string;    // Format: "HH:mm" in 24-hour format
  close: string;   // Format: "HH:mm" in 24-hour format
  days: number[];  // 0-6 representing Sunday-Saturday
}

interface Vendor {
  _id: string;
  name: string;
  email?: string;
  contactNumber: string;
  mapsLink: string;
  operatingHours: OperatingHours;
}

// Protected route component to check authentication
function ProtectedRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = localStorage.getItem("token") !== null;
  
  if (!isAuthenticated) {
    // Store the intended destination for redirect after login
    localStorage.setItem("redirectAfterLogin", "/update-profile");
    return <Navigate to="/login" replace />;
  }
  
  return children;
}

function MapDisplay() {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const userLocationMarkerRef = useRef<L.Marker | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [currentZoom, setCurrentZoom] = useState<number>(13);
  const markersUpdateInterval = useRef<number | null>(null);

  const isVendorOperating = (operatingHours: OperatingHours): boolean => {
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();
  
    // Check if vendor operates on current day
    if (!operatingHours.days.includes(currentDay)) {
      return false;
    }
  
    // Convert operating hours to minutes for comparison
    const [openHours, openMinutes] = operatingHours.open.split(':').map(Number);
    const [closeHours, closeMinutes] = operatingHours.close.split(':').map(Number);
    const openTime = openHours * 60 + openMinutes;
    const closeTime = closeHours * 60 + closeMinutes;
  
    // Handle cases where closing time is on the next day
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }
  
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          console.log("User location obtained:", userCoords);
          setUserLocation(userCoords);

          // If map is already initialized, center it on user's location
          if (mapRef.current) {
            mapRef.current.setView([userCoords.latitude, userCoords.longitude], 15);
            
            // Add or update user location marker
            if (userLocationMarkerRef.current) {
              userLocationMarkerRef.current.setLatLng([userCoords.latitude, userCoords.longitude]);
            } else {
              const userIcon = L.divIcon({
                className: 'user-location-marker',
                html: '<div class="pulse"></div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });
              
              userLocationMarkerRef.current = L.marker([userCoords.latitude, userCoords.longitude], {
                icon: userIcon,
                zIndexOffset: 1000 // Ensure it's above other markers
              }).addTo(mapRef.current)
                .bindPopup("You are here");
            }
          }
        },
        (error) => {
          console.error("Error getting user location:", error);
          setError("Could not access your location. Using default view.");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
      setError("Geolocation is not supported by your browser. Using default view.");
    }
  };

  const extractCoordinates = (mapsLink: string) => {
    try {
      console.log("Attempting to extract coordinates from:", mapsLink);
      
      // Try multiple regex patterns to handle different Google Maps URL formats
      const patterns = [
        /@(-?\d+\.\d+),(-?\d+\.\d+)/,  // Standard format
        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,  // Alternate format
        /place\/.*\/@(-?\d+\.\d+),(-?\d+\.\d+)/  // Place format
      ];
      
      for (const pattern of patterns) {
        const match = mapsLink.match(pattern);
        if (match) {
          const coords = {
            latitude: parseFloat(match[1]),
            longitude: parseFloat(match[2])
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
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_BASEURL}/api/all-users`);
      if (!response.ok) {
        throw new Error("Failed to fetch vendors");
      }
      const data = await response.json();
      console.log("Fetched Vendors:", data); // Debugging
      setVendors(data.data);
      updateMapMarkers(data.data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError("Failed to fetch vendors data");
    }
  };
  
  // Calculate icon size based on zoom level
  const calculateIconSize = (baseSize: number): number => {
    // Base size at zoom level 13
    const zoomFactor = Math.pow(1.2, currentZoom - 13);
    return Math.max(24, Math.min(96, baseSize * zoomFactor));
  };
  
  // Create custom icon with size based on zoom level
  const createVendorIcon = () => {
    const size = calculateIconSize(64);
    return L.icon({
      iconUrl: laari,
      iconSize: [size, size],
      iconAnchor: [size/4, size/2],
      popupAnchor: [0, -size/2]
    });
  };
  
  const initializeMap = () => {
    const initialCoords = userLocation 
      ? [userLocation.latitude, userLocation.longitude] 
      : [26.8482821, 75.5609975]; // Default center if user location not available
    
    const initialZoom = userLocation ? 15 : 13; // Zoom closer if we have user location
    setCurrentZoom(initialZoom);
    
    console.log("Initializing map with coordinates:", initialCoords);
    mapRef.current = L.map("map").setView(initialCoords as [number, number], initialZoom);
    
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "Laari Khojo",
    }).addTo(mapRef.current);
    
    // Handle zoom events to update icon sizes
    mapRef.current.on('zoomend', () => {
      if (mapRef.current) {
        const newZoom = mapRef.current.getZoom();
        setCurrentZoom(newZoom);
        
        // Update all existing vendor markers with new icon sizes
        Object.entries(markersRef.current).forEach(([id, marker]) => {
          const newIcon = createVendorIcon();
          marker.setIcon(newIcon);
        });
      }
    });
    
    // Add user location marker if available
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-location-marker',
        html: '<div class="pulse"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
      
      userLocationMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userIcon,
        zIndexOffset: 1000 // Ensure it's above other markers
      }).addTo(mapRef.current)
        .bindPopup("You are here");
    }
  };
  
  const updateMapMarkers = async (vendors: Vendor[]) => {
    if (!mapRef.current) {
      initializeMap();
    }
  
    // Clear existing vendor markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
  
    vendors.forEach(vendor => {
      console.log(`Vendor: ${vendor.name}, MapsLink: ${vendor.mapsLink}`);
      const coords = extractCoordinates(vendor.mapsLink);
      console.log(`Extracted Coordinates:`, coords);    
  
      if (isVendorOperating(vendor.operatingHours) && coords) {
        console.log(`Adding marker for ${vendor.name} at:`, coords);
        const operatingStatus = `Open: ${vendor.operatingHours.open} - ${vendor.operatingHours.close}`;
        const daysOpen = vendor.operatingHours.days
          .map(day => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day])
          .join(', ');

        const popupContent = `
          <div class="custom-popup">
            <h3 style="font-weight: bold; margin-bottom: 5px;">${vendor.name}</h3>
            <p><strong>Contact:</strong> ${vendor.contactNumber}</p>
            <p><strong>Hours:</strong> ${operatingStatus}</p>
            <p><strong>Days Open:</strong> ${daysOpen}</p>
            <p><strong>Location:</strong> <a href="${vendor.mapsLink}" target="_blank" style="color: blue; text-decoration: underline;">View on Google Maps</a></p>
          </div>
        `;

        // Create vendor icon with size based on current zoom level
        const customIcon = createVendorIcon();
  
        const marker = L.marker([coords.latitude, coords.longitude], { icon: customIcon })
          .addTo(mapRef.current!)
          .bindPopup(popupContent, {className:'custom-popup'});
        
        markersRef.current[vendor._id] = marker;
      } else {
        console.log(`${vendor.name} is currently closed or has invalid coordinates`);
      }
    });
  
    // Fit map bounds to include all markers only if user location is not available
    if (!userLocation && Object.keys(markersRef.current).length > 0) {
      const markers = Object.values(markersRef.current);
      const group = L.featureGroup(markers);
      mapRef.current?.fitBounds(group.getBounds().pad(0.1));
    }
  };

  useEffect(() => {
    // Get user location first
    getUserLocation();

    // Fetch vendors
    fetchVendors();

    // Update markers every minute to check operating hours
    const intervalId = window.setInterval(() => {
      if (vendors.length > 0) {
        updateMapMarkers(vendors);
      }
    }, 60000); // Check every minute

    // Add CSS for user location pulse effect
    const style = document.createElement('style');
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

    // Cleanup function
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (intervalId) {
        window.clearInterval(intervalId);
      }
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      document.head.removeChild(style);
    };
  }, []);

  // Update markers whenever vendors data or zoom level changes
  useEffect(() => {
    if (vendors.length > 0 && mapRef.current) {
      updateMapMarkers(vendors);
    }
  }, [vendors, currentZoom]);

  // Update map center when user location changes
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.setView([userLocation.latitude, userLocation.longitude], 15);
    }
  }, [userLocation]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div id="map" style={{ width: "100%", height: "100%" }}></div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

function App() {
  const location = useLocation();  
  const [showRegisterButton, setShowRegisterButton] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Hide register button when on register page 
    setShowRegisterButton(location.pathname !== '/register');
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [location]);

  // Continue from where we left off in the App component
const handleLoginSuccess = (token: string) => {
  setIsLoggedIn(true);
  
  // Check if there's a redirect destination saved
  const redirectPath = localStorage.getItem('redirectAfterLogin');
  if (redirectPath) {
    localStorage.removeItem('redirectAfterLogin');
    window.location.href = redirectPath;
  } else {
    // Default redirect to home if no specific destination
    window.location.href = '/';
  }
};

const handleLogout = () => {
  localStorage.removeItem('token');
  setIsLoggedIn(false);
};

return (
  <>
    <Header 
      showRegisterButton={showRegisterButton}
      isLoggedIn={isLoggedIn}
      onLogout={handleLogout}
    />
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/map" element={<MapDisplay />} />
      <Route path="/register" element={<Register onRegisterSuccess={() => {}} />} />
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route 
        path="/update-profile" 
        element={
          <ProtectedRoute>
            <UpdateProfile />
          </ProtectedRoute>
        } 
      />
    </Routes>
  </>
);
}

export default App; 

      
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import HomeScreen from "./components/HomeScreen";
import Header from "./components/Header";
import Register from "./components/Register";
import UpdateProfile from "./components/UpdateProfile";
import Login from "./components/Login";
import laari from "./assets/laari.png";
import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API_URL = "https://laari-khojo-backend.onrender.com";

interface OperatingHours {
  openTime: string; // Format: "HH:mm" in 24-hour format
  closeTime: string; // Format: "HH:mm" in 24-hour format
  days: number[]; // 0-6 representing Sunday-Saturday
}

interface Vendor {
  _id: string;
  name: string;
  email?: string;
  contactNumber: string;
  mapsLink: string;
  operatingHours: OperatingHours;
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

  // Modified isVendorOperating function to handle undefined operatingHours
  const isVendorOperating = (operatingHours?: OperatingHours): boolean => {
    // Return false if operatingHours is undefined or doesn't have required properties
    if (
      !operatingHours ||
      !operatingHours.days ||
      !operatingHours.openTime ||
      !operatingHours.closeTime
    ) {
      return false;
    }

    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Check if vendor operates on current day
    if (!operatingHours.days.includes(currentDay)) {
      return false;
    }

    // Convert operating hours to minutes for comparison
    const [openHours, openMinutes] = operatingHours.openTime
      .split(":")
      .map(Number);
    const [closeHours, closeMinutes] = operatingHours.closeTime
      .split(":")
      .map(Number);
    const openTime = openHours * 60 + openMinutes;
    const closeTime = closeHours * 60 + closeMinutes;

    // Handle cases where closing time is on the next day
    if (closeTime < openTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const getUserLocation = () => {
    setIsLocationLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          console.log("User location obtained:", userCoords);
          setUserLocation(userCoords);
          setIsLocationLoading(false);
        },
        (error) => {
          console.error("Error getting user location:", error);
          setError("Could not access your location. Using default view.");
          setIsLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
      setError(
        "Geolocation is not supported by your browser. Using default view."
      );
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
      const response = await fetch(`${API_URL}/api/all-users`);
      if (!response.ok) {
        throw new Error("Failed to fetch vendors");
      }
      const data = await response.json();
      console.log("Fetched Vendors:", data);
      setVendors(data.data);
      return data.data;
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError("Failed to fetch vendors data");
      return [];
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
      iconAnchor: [size / 4, size / 2],
      popupAnchor: [0, -size / 2],
    });
  };

  const initializeMap = () => {
    if (isMapInitialized) {
      return;
    }

    // Default center coordinates
    const defaultCoords: [number, number] = [26.8482821, 75.5609975];
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

    // Initialize map
    try {
      mapRef.current = L.map("map").setView(
        initialCoords as [number, number],
        initialZoom
      );

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          attribution: "Laari Khojo",
        }
      ).addTo(mapRef.current);

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
        zIndexOffset: 1000, // Ensure it's above other markers
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

  // Modified updateMapMarkers function to safely handle vendor information
  const updateMapMarkers = (vendors: Vendor[]) => {
    if (!mapRef.current || !isMapInitialized) {
      return;
    }

    // Clear existing vendor markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    // Track vendor markers for fitting bounds
    const validMarkers: L.Marker[] = [];

    vendors.forEach((vendor) => {
      console.log(
        `Vendor: ${vendor.name}, MapsLink: ${vendor.mapsLink || "No maps link"}`
      );

      // Check if mapsLink exists
      if (!vendor.mapsLink) {
        console.log(`${vendor.name} has no Google Maps link.`);
        return; // Skip this vendor
      }

      const coords = extractCoordinates(vendor.mapsLink);
      console.log(`Extracted Coordinates:`, coords);

      // Check if vendor is operating and has valid coordinates
      if (isVendorOperating(vendor.operatingHours) && coords) {
        console.log(`Adding marker for ${vendor.name} at:`, coords);

        // Safely display operating hours information if available
        let operatingStatus = "Hours not specified";
        let daysOpen = "Days not specified";

        if (
          vendor.operatingHours &&
          vendor.operatingHours.openTime &&
          vendor.operatingHours.closeTime
        ) {
          operatingStatus = `Open: ${vendor.operatingHours.openTime} - ${vendor.operatingHours.closeTime}`;
        }

        if (
          vendor.operatingHours &&
          vendor.operatingHours.days &&
          Array.isArray(vendor.operatingHours.days)
        ) {
          daysOpen = vendor.operatingHours.days
            .map(
              (day) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]
            )
            .join(", ");
        }

        const popupContent = `
        <div class="custom-popup">
          <h3 style="font-weight: 600; margin: 0 0 10px 0; font-size: 18px;">${
            vendor.name
          }</h3>
          
          <div class="info-line" style="margin-bottom: 8px; display: flex;">
            <div class="info-label" style="font-weight: 600; margin-right: 5px; min-width: 75px;">Contact:</div>
            <div class="info-value" style="flex: 1;">${
              vendor.contactNumber || "Not provided"
            }</div>
          </div>
          
          <div class="info-line" style="margin-bottom: 8px; display: flex;">
            <div class="info-label" style="font-weight: 600; margin-right: 5px; min-width: 75px;">Hours:</div>
            <div class="info-value" style="flex: 1;">${operatingStatus}</div>
          </div>
          
          <div class="info-line" style="margin-bottom: 8px; display: flex;">
            <div class="info-label" style="font-weight: 600; margin-right: 5px; min-width: 75px;">Days Open:</div>
            <div class="info-value" style="flex: 1; word-wrap: break-word;">${daysOpen}</div>
          </div>
          
          <div class="info-line" style="margin-bottom: 8px; display: flex;">
            <div class="info-label" style="font-weight: 600; margin-right: 5px; min-width: 75px;">Location:</div>
            <div class="info-value" style="flex: 1;">
              <a href="${
                vendor.mapsLink
              }" target="_blank" style="color: white; text-decoration: underline;">View</a>
            </div>
          </div>
        </div>
        `;

        // Create vendor icon with size based on current zoom level
        const customIcon = createVendorIcon();

        const marker = L.marker([coords.latitude, coords.longitude], {
          icon: customIcon,
        })
          .addTo(mapRef.current!)
          .bindPopup(popupContent, { className: "custom-popup" });

        markersRef.current[vendor._id] = marker;
        validMarkers.push(marker);
      } else {
        console.log(
          `${vendor.name} is currently closed, has invalid coordinates, or missing operating hours`
        );
      }
    });

    // Fit map bounds to include all markers if we don't have user location
    // or if no markers are visible near user location
    if (validMarkers.length > 0 && !userLocation) {
      const group = L.featureGroup(validMarkers);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  // Setup initial conditions
  useEffect(() => {
    // Get user location first
    getUserLocation();

    // Cleanup function
    return () => {
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
      initializeMap();
    }
  }, [isLocationLoading, isMapInitialized]);

  // Add user location marker after map is initialized and location is available
  useEffect(() => {
    if (isMapInitialized && userLocation) {
      updateUserLocationMarker();
    }
  }, [isMapInitialized, userLocation]);

  // Fetch vendors after map is initialized
  useEffect(() => {
    if (isMapInitialized) {
      const loadVendors = async () => {
        const vendorData = await fetchVendors();
        updateMapMarkers(vendorData);
      };
      loadVendors();

      // Setup refresh interval
      const intervalId = window.setInterval(() => {
        loadVendors();
      }, 60000); // Check every minute

      return () => {
        window.clearInterval(intervalId);
      };
    }
  }, [isMapInitialized]);

  // Update markers whenever vendors or zoom level changes
  useEffect(() => {
    if (isMapInitialized && vendors.length > 0) {
      updateMapMarkers(vendors);
    }
  }, [vendors, currentZoom, isMapInitialized]);

  // Add location refresh button
  const refreshUserLocation = () => {
    getUserLocation();
  };

  return (
    <div style={{ width: "100%", height: "100vh", position: "relative" }}>
      <div id="map" style={{ width: "100%", height: "100%" }}></div>
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
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            padding: "20px",
            borderRadius: "5px",
            zIndex: 1000,
            textAlign: "center",
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
  const navigate = useNavigate();
  const [showRegisterButton, setShowRegisterButton] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Hide register button when on register page
    setShowRegisterButton(location.pathname !== "/register");

    // Check if user is logged in
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [location]);

  const handleLoginSuccess = (token: string) => {
    setIsLoggedIn(true);

    // Store token (example: localStorage)
    localStorage.setItem("token", token);

    // Get the redirect path from location state if available
    const from = location.state?.from?.pathname || "/update-profile";

    // Use navigate instead of window.location for better React Router integration
    navigate(from, { replace: true });
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    navigate("/login");
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
            isLoggedIn ? (
              <UpdateProfile />
            ) : (
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        />
      </Routes>
    </>
  );
}

export default App;
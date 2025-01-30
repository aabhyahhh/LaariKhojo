// App.tsx
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import io, { Socket } from "socket.io-client";
import "leaflet/dist/leaflet.css";
import "./App.css";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  // Add other profile fields as needed
}

function App() {
  const mapRef = useRef<LeafletMap | null>(null);
  const socketRef = useRef<typeof Socket | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch profile data
  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("No authentication token found. Please log in.");
        return null;
      }

      const response = await fetch("http://localhost:3000/api/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data.data); // Store the profile data in state
        return data.data;
      } else {
        setError(data.message || "Failed to fetch profile data");
        // If unauthorized, redirect to login
        if (response.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
        return null;
      }
    } catch (error) {
      setError("Error connecting to server");
      console.error("Fetch error:", error);
      return null;
    }
  };

  // Function to create map marker with profile data
  const createMapMarker = (latitude: number, longitude: number, profile: UserProfile | null) => {
    const customIcon = L.icon({
      iconUrl: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
      iconSize: [30, 30],
      iconAnchor: [15, 30],
      popupAnchor: [0, -30]
    });

    // Remove existing marker if any
    if (markerRef.current) {
      markerRef.current.remove();
    }

    console.log(profile)


    // Create popup content with profile data
    const popupContent = `
      <div class="popup-content">
        <h3>${profile?.name || "Loading..."}</h3>
        <p>${profile?.email || "Loading..."}</p>
        ${profile?._id ? `<a href="/profile/${profile._id}" class="profile-link">View Profile</a>` : ''}
        <p>Current Location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</p>
      </div>
    `;


    // Create and add new marker
    markerRef.current = L.marker([latitude, longitude], { icon: customIcon })
      .bindPopup(popupContent)
      .addTo(mapRef.current!)
      .openPopup();
  };

  const getCurrentLocation = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Initialize map if it doesn't exist
          if (!mapRef.current) {
            mapRef.current = L.map("map").setView([latitude, longitude], 18);
            
            L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
              maxZoom: 19,
              attribution: "Laari Khojo",
            }).addTo(mapRef.current);

            // Initialize Socket.IO connection
            socketRef.current = io("http://localhost:3000", {
              transports: ["websocket"],
              reconnection: true,
              auth: {
                token: localStorage.getItem("token")
              }
            });

            socketRef.current.on("connect", () => {
              console.log("Connected to server");
            });
          } else {
            mapRef.current.setView([latitude, longitude], 17);
          }

          // Fetch profile data and create marker
          const profileData = await fetchProfileData();
          createMapMarker(latitude, longitude, profileData);

          // Emit location to server if socket is connected
          if (socketRef.current?.connected) {
            socketRef.current.emit("send-location", {
              latitude,
              longitude,
              userId: profile?._id
            });
          }
        },
        (error) => {
          console.error("Error getting location:", error);
          setError("Failed to get location. Please enable location services.");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      setError("Geolocation is not supported by this browser");
    }
  };

  useEffect(() => {
    // Initial fetch of profile and location
    const initializeApp = async () => {
      await fetchProfileData();
      getCurrentLocation();
    };

    initializeApp();

    // Set up periodic location updates
    const locationInterval = setInterval(() => {
      getCurrentLocation();
    }, 10000); // Update every 10 seconds

    // Cleanup function
    return () => {
      clearInterval(locationInterval);
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative">
      {error && (
        <div className="absolute top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          {error}
        </div>
      )}
      <div id="map" style={{ width: "100%", height: "100vh" }} />
    </div>
  );
}

export default App;
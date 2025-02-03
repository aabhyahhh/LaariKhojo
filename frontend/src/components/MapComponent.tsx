import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import io, { Socket } from "socket.io-client";
import "leaflet/dist/leaflet.css";
import "../App.css";
import markerIcon from "./assets/download.png"
import Login from "./Login";

interface UserProfile {
  _id: string;
  name: string;
  contactNumber: string;
  mapsLink: string; // Assuming this is a URL
  // Add other profile fields as needed
}

function MapComponent() {
  const mapRef = useRef<LeafletMap | null>(null);
  const socketRef = useRef<typeof Socket | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const fetchProfileData = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("No token found");
      return;
    }
    try {
      console.log("Fetching profile data" + token);
      const response = await fetch("http://localhost:3000/api/profile", {
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      console.log(data.data._id);
      setProfile({
        _id: data.data._id,
        name: data.data.name,
        contactNumber: data.data.contactNumber,
        mapsLink: data.data.mapsLink,
      });
      // Update marker popup if it exists
      if (markerRef.current) {
        const popupContent = `
          <div>
            <h3>Profile Data</h3>
            <p>Name: ${data.data.name}</p>
            <p>Contact Number: ${data.data.contactNumber}</p>
            <p>Maps: ${data.data.mapsLink}</p>

          </div>
        `;
        markerRef.current.setPopupContent(popupContent);
        markerRef.current.openPopup();
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const getCurrentLocation = async () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Initialize map if it doesn't exist
          if (!mapRef.current) {
            mapRef.current = L.map("map").setView([latitude, longitude], 18);

            L.tileLayer(
              "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
              {
                maxZoom: 19,
                attribution: "Laari Khojo",
              }
            ).addTo(mapRef.current);
          }

          // Update or create marker
          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            const popupContent = profile
              ? `
              <div>
                <h3>Discover</h3>
                <p>Name: ${profile.name}</p>
                <p>Contact Number: ${profile.contactNumber}</p>
                <p>Maps: ${profile.mapsLink}</p>
              </div>
            `
              : "No profile data available";
            !profile && fetchProfileData();
            
            const customIcon = L.icon({
              iconUrl: markerIcon, // Replace with your icon path
              iconSize: [30, 30], // Width, Height (Adjust as needed)
              iconAnchor: [15, 30], // Center the icon correctly
              popupAnchor: [0, -30], // Adjust popup position
            });
            
            markerRef.current = L.marker([latitude, longitude], { icon: customIcon })
              .addTo(mapRef.current)
              .bindPopup(popupContent)
              .openPopup();

          // Center map on marker
          mapRef.current.setView([latitude, longitude], 17);

          // Emit location to server if socket is connected
          if (socketRef.current?.connected) {
            socketRef.current.emit("send-location", {
              latitude,
              longitude,
              userId: profile?._id,
            });
          }
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
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
      fetchProfileData();
      getCurrentLocation();
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Only set up location interval
    const locationInterval = setInterval(getCurrentLocation, 600000); // 10 minutes

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
  }, [isLoggedIn]);

  const handleLoginSuccess = (token: string) => {
    setIsLoggedIn(true);
    fetchProfileData();
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
}

export default MapComponent;
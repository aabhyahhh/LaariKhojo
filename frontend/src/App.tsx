import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import io, { Socket } from "socket.io-client";
import "leaflet/dist/leaflet.css";
import "./App.css";

function App() {
  const mapRef = useRef<LeafletMap | null>(null);
  const socketRef = useRef<typeof Socket | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const getCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("position", position.coords);
          const { latitude, longitude } = position.coords;

          // Initialize map if it doesn't exist yet
          if (!mapRef.current) {
            mapRef.current = L.map("map").setView([latitude, longitude], 18);

            // Add the tile layer
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              maxZoom: 19,
              attribution: "© OpenStreetMap contributors",
            }).addTo(mapRef.current);

            // Initialize Socket.IO connection
            socketRef.current = io("http://localhost:3000", {
              transports: ["websocket"],
              reconnection: true,
            });

            socketRef.current.on("connect", () => {
              console.log("Connected to server");
            });

            socketRef.current.on("connect_error", (error: any) => {
              console.error("Connection error:", error);
            });
          } else {
            // If map exists, just update the view
            mapRef.current.setView([latitude, longitude], 17);
          }

          // Remove existing marker if any
          if (markerRef.current) {
            markerRef.current.remove();
          }

          // Add new marker at user's location
          markerRef.current = L.marker([latitude, longitude])
            .bindPopup("You are here!")
            .addTo(mapRef.current);
        },
        (error) => {
          console.error("Error getting location:", error);
          // Fallback to default location if permission denied or error
          if (!mapRef.current) {
            mapRef.current = L.map("map").setView([23.8103, 90.4125], 18);

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
              maxZoom: 19,
              attribution: "© OpenStreetMap contributors",
            }).addTo(mapRef.current);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser");
    }
  };

  useEffect(() => {
    // Request location immediately
    getCurrentLocation();

    // Cleanup function
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  return <div id="map" style={{ width: "100%", height: "100vh" }} />;
}

export default App;

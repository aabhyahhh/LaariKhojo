import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "../assets/download.png";

interface UserProfile {
  _id: string;
  name: string;
  contactNumber: string;
  latitude: number;
  longitude: number;
}

function MapComponent() {
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/all-users", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch users");

      const data = await response.json();
      setUsers(data.data);
      initializeMap(data.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users' data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const initializeMap = (users: UserProfile[]) => {
    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (!mapRef.current && users.length > 0) {
      // Initialize map centered on the first user's location
      mapRef.current = L.map("map").setView([users[0].latitude, users[0].longitude], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "Laari Khojo",
      }).addTo(mapRef.current);
    }

    // Define a custom marker icon
    const customIcon = L.icon({
      iconUrl: markerIcon,
      iconSize: [35, 35],
      iconAnchor: [17, 35],
      popupAnchor: [0, -30],
    });

    // Add markers with popups
    users.forEach((user) => {
      const marker = L.marker([user.latitude, user.longitude], { icon: customIcon })
        .addTo(mapRef.current!)
        .bindPopup(`
          <div style="font-family: Arial, sans-serif; text-align: center;">
            <h3 style="font-size: 16px; margin-bottom: 5px;">${user.name}</h3>
            <p style="margin: 0; font-size: 14px;"><strong>Contact:</strong> ${user.contactNumber}</p>
          </div>
        `);
      markersRef.current.push(marker);
    });

    // Adjust map view to fit all markers
    if (mapRef.current && users.length > 0) {
      const bounds = L.latLngBounds(users.map(user => [user.latitude, user.longitude]));
      mapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  useEffect(() => {
    fetchUsers();

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div id="map" className="w-full h-full" />
      
      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-4 py-2 rounded shadow">
          Loading users...
        </div>
      )}

      {error && (
        <div className="absolute top-4 right-4 bg-red-100 text-red-700 px-4 py-2 rounded shadow">
          {error}
        </div>
      )}
    </div>
  );
}

export default MapComponent;

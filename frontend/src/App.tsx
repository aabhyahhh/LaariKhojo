import { Routes, Route } from "react-router-dom";
import HomeScreen from "./components/HomeScreen";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap } from "leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

interface Vendor {
  _id: string;
  name: string;
  email?: string;
  contactNumber: string;
  mapsLink: string;
}

function MapDisplay() {
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);

  const extractCoordinates = (mapsLink: string) => {
    try {
      const regex = /@(-?\d+\.\d+),(-?\d+\.\d+)/;
      const match = mapsLink.match(regex);
      if (match) {
        return {
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[2])
        };
      }
      return null;
    } catch (error) {
      console.error("Error extracting coordinates:", error);
      return null;
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch("http://localhost:3000/api/all-users");
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
  

  const updateMapMarkers = async (vendors: Vendor[]) => {
    if (!mapRef.current) {
  mapRef.current = L.map("map").setView([23.033863, 72.585022], 13);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution: "Laari Khojo",
      }).addTo(mapRef.current);
    }
  
    vendors.forEach(vendor => {
      console.log(`Vendor: ${vendor.name}, MapsLink: ${vendor.mapsLink}`);
      const coords = extractCoordinates(vendor.mapsLink);
      console.log(`Extracted Coordinates:`, coords);    
  
      if (coords) {
        const popupContent = `
          <div class="custom-popup">
            <h3 style="font-weight: bold; margin-bottom: 5px;">${vendor.name}</h3>
            <p><strong>Contact:</strong> ${vendor.contactNumber}</p>
            <p><strong>Location:</strong> <a href="${vendor.mapsLink}" target="_blank" style="color: blue; text-decoration: underline;">View on Google Maps</a></p>
          </div>
        `; // Using a template string instead of JSX
  
        const marker = L.marker([coords.latitude, coords.longitude])
          .addTo(mapRef.current!)
          .bindPopup(popupContent);
  
        markersRef.current[vendor._id] = marker;
      }
    });
  
    // Fit map bounds to include all markers
    if (Object.keys(markersRef.current).length > 0) {
      const markers = Object.values(markersRef.current);
      const group = L.featureGroup(markers);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  useEffect(() => {
    fetchVendors();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      Object.values(markersRef.current).forEach(marker => marker.remove());
      markersRef.current = {};
    };
  }, []);


  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div id="map" style={{ width: "100%", height: "100%" }}></div>
      {error && <div className="error-message">{error}</div>}
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/map" element={<MapDisplay />} />
    </Routes>
  );
}

export default App;
import { Routes, Route } from "react-router-dom";
import HomeScreen from "./components/HomeScreen";
import { useEffect, useRef, useState } from "react";
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

function MapDisplay() {
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [error, setError] = useState<string | null>(null);
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
      console.log("Initializing map...");
      mapRef.current = L.map("map").setView([26.8482821, 75.5609975], 13); // Updated default center
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        attribution: "Laari Khojo",
      }).addTo(mapRef.current);
    }
  
    // Clear existing markers
    Object.values(markersRef.current).forEach(marker => marker.remove());
    markersRef.current = {};
  
    vendors.forEach(vendor => {
      console.log(`Vendor: ${vendor.name}, MapsLink: ${vendor.mapsLink}`);
      const coords = extractCoordinates(vendor.mapsLink);
      console.log(`Extracted Coordinates:`, coords);    
  
      if (isVendorOperating(vendor.operatingHours)) {
        const coords = extractCoordinates(vendor.mapsLink);
        
        if (coords) {
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
  
        const marker = L.marker([coords.latitude, coords.longitude])
          .addTo(mapRef.current!)
          .bindPopup(popupContent);
  
        markersRef.current[vendor._id] = marker;
      } else {
        console.log(`${vendor.name} is currently closed`);

      }
    }});
  
    // Fit map bounds to include all markers
    if (Object.keys(markersRef.current).length > 0) {
      const markers = Object.values(markersRef.current);
      const group = L.featureGroup(markers);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  };

  useEffect(() => {
    fetchVendors();

    // Update markers every minute to check operating hours
    const intervalId = window.setInterval(() => {
      if (vendors.length > 0) {
        updateMapMarkers(vendors);
      }
    }, 60000); // Check every minute

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
    };
  }, []);

  // Update markers whenever vendors data changes
  useEffect(() => {
    if (vendors.length > 0) {
      updateMapMarkers(vendors);
    }
  }, [vendors]);

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
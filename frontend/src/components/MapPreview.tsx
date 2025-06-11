import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPreview.css';
import laari from '../assets/laari.png';

interface MapPreviewProps {
  onExpand?: () => void;
  vendors?: any[];
}

const MapPreview: React.FC<MapPreviewProps> = ({ onExpand }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629], // Center of India
      zoom: 5,
      zoomControl: false // We'll add custom zoom control
    });

    // Add tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: 'Laari Khojo'
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({
      position: 'bottomright'
    }).addTo(map);

    mapRef.current = map;

    // Get user location
    getUserLocation();

    return () => {
      map.remove();
    };
  }, []);

  const getUserLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 600000 // 10 minutes cache
          }
        );
      });

      const userCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      setUserLocation(userCoords);
      setError(null);

      // Center map on user location
      if (mapRef.current) {
        mapRef.current.setView([userCoords.latitude, userCoords.longitude], 13);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setError("Could not determine your location. Using default view.");
    }
  };

  const addVendorMarkers = (vendorData: any[]) => {
    if (!mapRef.current) return;

    // Clear existing markers before adding new ones (important for updates)
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Create custom icon
    const vendorIcon = L.icon({
      iconUrl: laari,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });

    vendorData.forEach((vendor) => {
      if (vendor.mapsLink) { // Use mapsLink as the condition for coordinates
        // Extract coordinates from mapsLink (similar to MapDisplay in App.tsx)
        const extractCoordinates = (mapsLink: string) => {
          try {
            const patterns = [
              /@(-?\d+\.\d+),(-?\d+\.\d+)/, // Standard format
              /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // Alternate format
              /place\/.*\/@(-?\d+\.\d+),(-?\d+\.\d+)/, // Place format
              /q=(-?\d+\.\d+),(-?\d+\.\d+)/, // Query format
            ];

            for (const pattern of patterns) {
              const match = mapsLink.match(pattern);
              if (match) {
                return {
                  latitude: parseFloat(match[1]),
                  longitude: parseFloat(match[2]),
                };
              }
            }
            return null;
          } catch (error) {
            console.error("Error extracting coordinates from mapsLink:", error);
            return null;
          }
        };

        const coords = extractCoordinates(vendor.mapsLink);

        if (coords) {
          const marker = L.marker(
            [coords.latitude, coords.longitude],
            { icon: vendorIcon }
          ).addTo(mapRef.current!);

          // Create popup content
          const popupContent = `
            <div class="custom-popup">
              <h3>${vendor.name}</h3>
              <p>${vendor.description || 'No description available'}</p>
              ${vendor.contactNumber ? `<p>📞 ${vendor.contactNumber}</p>` : ''}
              ${vendor.mapsLink ? `<a href="${vendor.mapsLink}" target="_blank">📍 View on Google Maps</a>` : ''}
            </div>
          `;

          marker.bindPopup(popupContent);
        }
      }
    });
  };

  const handleExpandClick = () => {
    if (onExpand) {
      onExpand();
    } else {
      navigate('/map');
    }
  };

  return (
    <div className="map-preview-container">
      <div className="map-preview-content">
        <div ref={mapContainerRef} className="map-preview" />
        {error && <div className="map-error">{error}</div>}
      </div>
    </div>
  );
};

export default MapPreview; 
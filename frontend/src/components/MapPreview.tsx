import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPreview.css';
import laari from '../assets/logo_cropped.png';

interface MapPreviewProps {
  onExpand?: () => void;
  vendors?: any[];
}

const MapPreview: React.FC<MapPreviewProps> = ({ onExpand, vendors = [] }) => {
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

  // Add vendors to map when vendors prop changes
  useEffect(() => {
    if (mapRef.current && vendors && vendors.length > 0) {
      console.log("Adding vendor markers to map preview:", vendors.length, "vendors");
      addVendorMarkers(vendors);
    }
  }, [vendors]);

  const getUserLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // 1 minute cache
          }
        );
      });

      const userCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      
      setUserLocation(userCoords);
      setError(null);

      // Center map on user location and add user marker
      if (mapRef.current) {
        mapRef.current.setView([userCoords.latitude, userCoords.longitude], 15);
        
        // Add user location marker
        addUserLocationMarker(userCoords);
      }
    } catch (error) {
      console.error("Error getting location:", error);
      setError("Could not determine your location. Using default view.");
    }
  };

  const addUserLocationMarker = (userCoords: { latitude: number; longitude: number }) => {
    if (!mapRef.current) return;

    // Create a custom blue marker for user location
    const userLocationIcon = L.divIcon({
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #007bff;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      className: 'user-location-marker',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    // Add user location marker
    const userMarker = L.marker([userCoords.latitude, userCoords.longitude], {
      icon: userLocationIcon
    }).addTo(mapRef.current);

    // Add popup
    userMarker.bindPopup(`
      <div style="text-align: center;">
        <strong>You are here</strong><br/>
        <small>Lat: ${userCoords.latitude.toFixed(6)}<br/>
        Lng: ${userCoords.longitude.toFixed(6)}</small>
      </div>
    `);
  };

  const addVendorMarkers = (vendorData: any[]) => {
    if (!mapRef.current) return;

    console.log("Processing vendor data for markers:", vendorData);

    // Clear existing vendor markers before adding new ones (preserve user location marker)
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && !layer.options.icon?.options?.className?.includes('user-location-marker')) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Create custom icon
    const vendorIcon = L.icon({
      iconUrl: laari,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });

    let markersAdded = 0;

    vendorData.forEach((vendor, index) => {
      console.log(`Processing vendor ${index + 1}:`, vendor);
      
      if (vendor.mapsLink) {
        // Extract coordinates from mapsLink
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
          console.log(`Adding marker for ${vendor.name} at:`, coords);
          
          const marker = L.marker(
            [coords.latitude, coords.longitude],
            { icon: vendorIcon }
          ).addTo(mapRef.current!);

          // Create popup content with icons and collapsible operating hours
          const popupContent = `
            <div class="custom-popup" style="font-size: 12px; line-height: 1.4; min-width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #2c3e50;">${vendor.name}</h3>
              
              ${vendor.contactNumber ? `
                <div style="display: flex; align-items: center; margin-bottom: 6px;">
                  <svg style="width: 14px; height: 14px; margin-right: 8px; color: #666;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                  <span style="color: #666;">${vendor.contactNumber}</span>
                </div>
              ` : ''}

              ${vendor.operatingHours ? `
                <div style="margin-bottom: 6px;">
                  <div style="display: flex; align-items: center; cursor: pointer;" onclick="this.parentElement.querySelector('.hours-details').style.display = this.parentElement.querySelector('.hours-details').style.display === 'none' ? 'block' : 'none'">
                    <svg style="width: 14px; height: 14px; margin-right: 8px; color: #666;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span style="color: #666; display: flex; align-items: center;">
                      <span style="color: #28a745; margin-right: 4px;">●</span>
                      Open Now
                      <svg style="width: 12px; height: 12px; margin-left: 4px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </span>
                  </div>
                  <div class="hours-details" style="display: none; margin-left: 22px; margin-top: 4px; padding-top: 4px; border-top: 1px solid #eee;">
                    <div style="color: #666; margin-bottom: 2px;">
                      <strong>Hours:</strong> ${vendor.operatingHours.openTime} - ${vendor.operatingHours.closeTime}
                    </div>
                    <div style="color: #666;">
                      <strong>Days:</strong> ${vendor.operatingHours.days.map((day: number) => 
                        ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day]
                      ).join(', ')}
                    </div>
                  </div>
                </div>
              ` : ''}

              ${vendor.mapsLink ? `
                <div style="display: flex; align-items: center;">
                  <svg style="width: 14px; height: 14px; margin-right: 8px; color: #666;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                  <a href="${vendor.mapsLink}" target="_blank" style="color: #007bff; text-decoration: none; font-size: 12px;">View on Maps</a>
                </div>
              ` : ''}
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 250,
            className: 'custom-popup-container'
          });
          markersAdded++;
        } else {
          console.warn(`Could not extract coordinates for vendor: ${vendor.name}`);
        }
      } else {
        console.warn(`No mapsLink found for vendor: ${vendor.name}`);
      }
    });

    console.log(`Added ${markersAdded} markers to map preview`);
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
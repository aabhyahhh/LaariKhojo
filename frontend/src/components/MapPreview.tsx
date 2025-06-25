// Add this at the very top for TypeScript module declaration
// @ts-ignore
// eslint-disable-next-line
// If you want, you can move this to a .d.ts file in the future
// @ts-ignore
// eslint-disable-next-line
// TypeScript ignore for OverlappingMarkerSpiderfier import

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPreview.css';
import laari from '../assets/logo_cropped.png';
import OverlappingMarkerSpiderfier from 'overlapping-marker-spiderfier-leaflet';

interface Vendor {
  _id: string;
  name: string;
  email?: string;
  contactNumber: string;
  mapsLink: string;
  operatingHours: {
    openTime: string;
    closeTime: string;
    days: number[];
  };
  profilePicture?: string;
  foodType?: string;
  topDishes?: Array<{ name: string; price?: number; description?: string; image?: string }>;
  gallery?: string[];
}

interface MapPreviewProps {
  vendors?: Vendor[];
}

const MapPreview: React.FC<MapPreviewProps> = ({ vendors = [] }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isVendorCardVisible, setIsVendorCardVisible] = useState<boolean>(false);
  const omsRef = useRef<any>(null); // Ref for OverlappingMarkerSpiderfier instance

  // Helper function to convert 24-hour time (HH:mm) to minutes from midnight
  const convert24HourToMinutes = (timeStr: string): number => {
    const time = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!time) return 0;
    const hours = parseInt(time[1], 10);
    const minutes = parseInt(time[2], 10);
    return hours * 60 + minutes;
  };

  const getOperatingStatus = (operatingHours?: Vendor['operatingHours']) => {
    if (!operatingHours || !operatingHours.openTime || !operatingHours.closeTime || !operatingHours.days || operatingHours.days.length === 0) {
      return { status: 'Hours Not Specified', color: '#888' };
    }
    const now = new Date();
    const currentDay = now.getDay();
    const yesterdayDay = (currentDay - 1 + 7) % 7;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openTimeInMinutes = convert24HourToMinutes(operatingHours.openTime);
    const closeTimeInMinutes = convert24HourToMinutes(operatingHours.closeTime);

    let isOpen = false;
    if (closeTimeInMinutes < openTimeInMinutes) {
      if ((currentMinutes >= openTimeInMinutes && operatingHours.days.includes(currentDay)) ||
          (currentMinutes <= closeTimeInMinutes && operatingHours.days.includes(yesterdayDay))) {
        isOpen = true;
      }
    } else {
      if (currentMinutes >= openTimeInMinutes && currentMinutes <= closeTimeInMinutes && operatingHours.days.includes(currentDay)) {
        isOpen = true;
      }
    }

    if (!isOpen) return { status: 'Closed', color: '#d9534f' };
    
    const timeUntilClose = (closeTimeInMinutes - currentMinutes + 1440) % 1440;
    if (timeUntilClose > 0 && timeUntilClose <= 30) {
      return { status: 'Closes Soon', color: '#f0ad4e' };
    }
    
    return { status: 'Open Now', color: '#28a745' };
  };

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

  const addVendorMarkers = (vendorData: Vendor[]) => {
    if (!mapRef.current) return;

    console.log("Processing vendor data for markers:", vendorData);

    // Clear existing vendor markers before adding new ones (preserve user location marker)
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof L.Marker && !layer.options.icon?.options?.className?.includes('user-location-marker')) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Remove previous OMS instance if exists
    if (omsRef.current) {
      omsRef.current.clearMarkers();
      omsRef.current = null;
    }

    // Create custom icon
    const vendorIcon = L.icon({
      iconUrl: laari,
      iconSize: [24, 24],
      iconAnchor: [12, 24],
      popupAnchor: [0, -24],
    });

    // Initialize OverlappingMarkerSpiderfier
    if (mapRef.current) {
      omsRef.current = new OverlappingMarkerSpiderfier(mapRef.current, {
        keepSpiderfied: true,
        nearbyDistance: 20, // px
      });
    }

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
          
          const { status, color } = getOperatingStatus(vendor.operatingHours);
          
          const marker = L.marker(
            [coords.latitude, coords.longitude],
            { icon: vendorIcon }
          );

          // Create popup content with icons and collapsible operating hours
          const popupContent = `
            <div class="custom-popup" style="font-size: 12px; line-height: 1.4; min-width: 200px; cursor: pointer;" onclick="window.openVendorCard('${vendor._id}')">
              <div style="display: flex; align-items: flex-start; margin-bottom: 8px;">
                ${vendor.profilePicture ? `
                  <img src="${vendor.profilePicture}" alt="${vendor.name}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; margin-right: 12px; border: 2px solid #ddd;" />
                ` : `
                  <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); margin-right: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
                    ${vendor.name.charAt(0).toUpperCase()}
                  </div>
                `}
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #2c3e50;">${vendor.name}</h3>
                  ${vendor.foodType ? `<div style="color: #666; font-size: 11px; margin-bottom: 4px;">${vendor.foodType}</div>` : ''}
                  ${vendor.operatingHours ? `
                    <div style="display: flex; align-items: center;">
                      <span style="color: ${color}; margin-right: 4px; font-size: 10px;">●</span>
                      <span style="color: ${color}; font-size: 11px;">${status}</span>
                    </div>
                  ` : ''}
                </div>
              </div>
              <div style="text-align: center; color: #007bff; font-size: 11px; font-weight: 500; margin-top: 8px; padding-top: 8px; border-top: 1px solid #eee;">
                Click to view full details →
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, {
            maxWidth: 250,
            className: 'custom-popup-container'
          });

          // Add marker to OMS for spiderfying
          if (omsRef.current) {
            omsRef.current.addMarker(marker);
          }
          marker.addTo(mapRef.current!);
          markersAdded++;
        } else {
          console.warn(`Could not extract coordinates for vendor: ${vendor.name}`);
        }
      } else {
        console.warn(`No mapsLink found for vendor: ${vendor.name}`);
      }
    });

    // Optional: Listen for OMS events (e.g., marker spiderfied/unspiderfied)
    if (omsRef.current) {
      omsRef.current.addListener('spiderfy', function(markers: any[]) {
        // Optionally, you can highlight spiderfied markers here
      });
      omsRef.current.addListener('unspiderfy', function(markers: any[]) {
        // Optionally, you can reset marker styles here
      });
    }

    console.log(`Added ${markersAdded} markers to map preview`);
  };

  const openVendorCard = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsVendorCardVisible(true);
  };

  const closeVendorCard = () => {
    setSelectedVendor(null);
    setIsVendorCardVisible(false);
  };

  (window as any).openVendorCard = (vendorId: string) => {
    const vendor = vendors.find(v => v._id === vendorId);
    if (vendor) {
      openVendorCard(vendor);
    }
  };

  return (
    <div className="map-preview-container">
      <div className="map-preview-content">
        <div ref={mapContainerRef} className="map-preview" />
        {error && <div className="map-error">{error}</div>}
        {isVendorCardVisible && selectedVendor && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '400px',
              height: '100vh',
              backgroundColor: 'white',
              zIndex: 2000,
              boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
              overflow: 'auto',
              transform: isVendorCardVisible ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease-in-out'
            }}
          >
            <button
              onClick={closeVendorCard}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666',
                zIndex: 2001
              }}
            >
              ×
            </button>
            {/* Vendor details JSX here (see user message for full details) */}
          </div>
        )}
        {isVendorCardVisible && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.3)',
              zIndex: 1999
            }}
            onClick={closeVendorCard}
          />
        )}
      </div>
    </div>
  );
};

export default MapPreview;
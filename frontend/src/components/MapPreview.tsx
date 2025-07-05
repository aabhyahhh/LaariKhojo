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
import api, { Review } from '../api/client';

interface Vendor {
  _id: string;
  name: string;
  email?: string;
  contactNumber: string;
  mapsLink: string;
  latitude?: number;
  longitude?: number;
  operatingHours: {
    openTime: string;
    closeTime: string;
    days: number[];
  };
  profilePicture?: string;
  foodType?: string;
  topDishes?: Array<{ name: string; price?: number; description?: string; image?: string }>;
  gallery?: string[];
  bestDishes?: Array<{ name: string; price?: number; description?: string; image?: string }>;
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
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 0, comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Helper function to convert time string to minutes from midnight (supports 24-hour and 12-hour AM/PM)
  const convertToMinutes = (timeStr: string): number => {
    // Try 24-hour format first
    let match = timeStr.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
    if (match) {
      const hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      return hours * 60 + minutes;
    }
    // Try 12-hour format with AM/PM
    match = timeStr.match(/^\s*(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const period = match[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
    }
    return 0; // fallback
  };

  const getOperatingStatus = (operatingHours?: Vendor['operatingHours']) => {
    if (!operatingHours || !operatingHours.openTime || !operatingHours.closeTime || !operatingHours.days || operatingHours.days.length === 0) {
      return { status: 'Hours Not Specified', color: '#888' };
    }
    const now = new Date();
    const currentDay = now.getDay();
    const yesterdayDay = (currentDay - 1 + 7) % 7;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openTimeInMinutes = convertToMinutes(operatingHours.openTime);
    const closeTimeInMinutes = convertToMinutes(operatingHours.closeTime);

    let isOpen = false;
    if (closeTimeInMinutes < openTimeInMinutes) {
      // Overnight: openTime (e.g., 16:00) to 23:59 today, and 00:00 to closeTime tomorrow
      if (
        (currentMinutes >= openTimeInMinutes && operatingHours.days.includes(currentDay)) ||
        (currentMinutes <= closeTimeInMinutes && operatingHours.days.includes(yesterdayDay))
      ) {
        isOpen = true;
      }
    } else {
      if (currentMinutes >= openTimeInMinutes && currentMinutes <= closeTimeInMinutes && operatingHours.days.includes(currentDay)) {
        isOpen = true;
      }
    }

    if (!isOpen) return { status: 'Closed', color: '#d9534f' };
    
    let timeUntilClose;
    if (closeTimeInMinutes < openTimeInMinutes) {
      if (currentMinutes >= openTimeInMinutes) {
        timeUntilClose = (closeTimeInMinutes + 1440) - currentMinutes;
      } else {
        timeUntilClose = closeTimeInMinutes - currentMinutes;
      }
    } else {
      timeUntilClose = closeTimeInMinutes - currentMinutes;
    }
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
      let coords: { latitude: number; longitude: number } | null = null;
      if (typeof vendor.latitude === 'number' && typeof vendor.longitude === 'number') {
        coords = { latitude: vendor.latitude, longitude: vendor.longitude };
      } else if (vendor.mapsLink) {
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
        coords = extractCoordinates(vendor.mapsLink);
      }
        if (coords) {
          console.log(`Adding marker for ${vendor.name} at:`, coords);
          const { status, color } = getOperatingStatus(vendor.operatingHours);
          const marker = L.marker(
            [coords.latitude, coords.longitude],
            { icon: vendorIcon }
        );

          // Create popup content with icons and collapsible operating hours
          const popupContent = `
            <div class="custom-popup" data-vendor-id="${vendor._id}" style="font-size: 12px; line-height: 1.4; min-width: 200px; cursor: pointer;">
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

        marker.addTo(mapRef.current!);
          markersAdded++;
      } else {
        console.warn(`Could not determine coordinates for vendor: ${vendor.name}`);
      }
    });

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

  // Add this useEffect to handle popup clicks and open the sidebar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      // Find the closest element with a vendor id
      let el = e.target as HTMLElement | null;
      while (el && el !== document.body) {
        // Check for custom-popup or vendor-item
        if (el.classList.contains('custom-popup') || el.classList.contains('vendor-item')) {
          // Try to extract vendorId from onclick attribute or data attribute
          let vendorId = null;
          // Try onclick="window.openVendorCard('...')"
          const onclick = el.getAttribute('onclick');
          if (onclick) {
            const match = onclick.match(/openVendorCard\(['"]([a-fA-F0-9]+)['"]\)/);
            if (match) vendorId = match[1];
          }
          // Or try data-vendor-id
          if (!vendorId && el.hasAttribute('data-vendor-id')) {
            vendorId = el.getAttribute('data-vendor-id');
          }
          if (vendorId) {
            const vendor = vendors.find(v => v._id === vendorId);
            if (vendor) {
              openVendorCard(vendor);
              break;
            }
          }
        }
        el = el.parentElement;
      }
    };
    const mapDiv = mapContainerRef.current;
    if (mapDiv) {
      mapDiv.addEventListener('click', handler);
    }
    return () => {
      if (mapDiv) {
        mapDiv.removeEventListener('click', handler);
      }
    };
  }, [vendors]);

  // Fetch reviews when vendor card opens
  useEffect(() => {
    if (isVendorCardVisible && selectedVendor) {
      api.getReviews(selectedVendor._id).then(res => {
        if (res.success && res.data) setReviews(res.data);
        else setReviews([]);
      });
    }
  }, [isVendorCardVisible, selectedVendor]);

  const handleReviewInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReviewForm({ ...reviewForm, [e.target.name]: e.target.value });
  };

  const handleStarClick = (star: number) => {
    setReviewForm({ ...reviewForm, rating: star });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setReviewError(null);
    if (!selectedVendor) return;
    if (!reviewForm.name || !reviewForm.email || !reviewForm.rating) {
      setReviewError('Name, email, and rating are required.');
      setSubmitting(false);
      return;
    }
    const reviewData = {
      vendorId: selectedVendor._id,
      name: reviewForm.name,
      email: reviewForm.email,
      rating: reviewForm.rating,
      comment: reviewForm.comment,
    };
    const res = await api.addReview(reviewData);
    if (res.success && res.data) {
      setReviews([res.data, ...reviews]);
      setReviewForm({ name: '', email: '', rating: 0, comment: '' });
      setShowAllReviews(false);
    } else {
      setReviewError(res.error || 'Failed to submit review.');
    }
    setSubmitting(false);
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
              width: '320px',
              height: '100vh',
              backgroundColor: 'white',
              zIndex: 2000,
              boxShadow: '2px 0 15px rgba(0,0,0,0.15)',
              overflow: 'auto',
              transform: isVendorCardVisible ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.8s cubic-bezier(0.4, 0.0, 0.2, 1)'
            }}
          >
            <button
              onClick={closeVendorCard}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: 'rgba(0,0,0,0.1)',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#666',
                zIndex: 2001,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.2)'}
              onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = 'rgba(0,0,0,0.1)'}
            >
              ×
            </button>
            <div style={{ padding: '20px 16px' }}>
              {/* Profile Picture and Name */}
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                {selectedVendor.profilePicture ? (
                  <img
                    src={selectedVendor.profilePicture}
                    alt={selectedVendor.name || 'Vendor'}
                    style={{
                      width: '70px',
                      height: '70px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #eee',
                      marginBottom: '8px',
                    }}
                  />
                ) : (
                  <div style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    marginBottom: '8px',
                  }}>
                    {(selectedVendor.name?.charAt(0) || '?').toUpperCase()}
                  </div>
                )}
                <h2 style={{ 
                  margin: '8px 0 4px 0', 
                  color: '#2c3e50', 
                  fontSize: '18px',
                  fontWeight: '600',
                  lineHeight: '1.2'
                }}>
                  {selectedVendor.name || 'Not available'}
                </h2>
                <div style={{ 
                  color: '#666', 
                  marginBottom: '12px', 
                  fontSize: '13px',
                  fontWeight: '500'
                }}>
                  {selectedVendor.foodType || 'Not available'}
                </div>
              </div>

              {/* Operating Status */}
              {selectedVendor.operatingHours && (
                <div style={{
                  textAlign: 'center',
                  marginBottom: '16px',
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '12px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    color: getOperatingStatus(selectedVendor.operatingHours).color,
                    fontSize: '12px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '8px' }}>●</span>
                    {getOperatingStatus(selectedVendor.operatingHours).status}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                marginBottom: '20px',
                justifyContent: 'center'
              }}>
                {/* Directions Button: open Google Maps directions from user location to vendor */}
                {(() => {
                  // Use vendor coordinates only (no userLocation in preview)
                  let vendorCoords = null;
                  if (selectedVendor.mapsLink) {
                    const extractCoordinates = (mapsLink: string) => {
                      const patterns = [
                        /@(-?\d+\.\d+),(-?\d+\.\d+)/,
                        /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
                        /place\/.*\/@(-?\d+\.\d+),(-?\d+\.\d+)/,
                        /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
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
                    };
                    vendorCoords = extractCoordinates(selectedVendor.mapsLink);
                  }
                  if (!vendorCoords && typeof selectedVendor.latitude === 'number' && typeof selectedVendor.longitude === 'number') {
                    vendorCoords = { latitude: selectedVendor.latitude, longitude: selectedVendor.longitude };
                  }
                  let directionsUrl = '#';
                  if (vendorCoords) {
                    directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${vendorCoords.latitude},${vendorCoords.longitude}&travelmode=driving`;
                  }
                  return (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '10px 16px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: '500',
                        fontSize: '13px',
                        transition: 'background-color 0.2s',
                        flex: 1,
                        justifyContent: 'center'
                      }}
                    >
                      📍 Directions
                    </a>
                  );
                })()}
                {selectedVendor.contactNumber && (
                  <a
                    href={`tel:${selectedVendor.contactNumber}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '500',
                      fontSize: '13px',
                      transition: 'background-color 0.2s',
                      flex: 1,
                      justifyContent: 'center'
                    }}
                  >
                    📞 Call
                  </a>
                )}
              </div>

              {/* Report Button */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => {
                    const extractCoordinates = (mapsLink: string) => {
                      try {
                        console.log("Attempting to extract coordinates from:", mapsLink);

                        // Prefer !3d...!4d... pattern (actual place coordinates)
                        let match = mapsLink.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
                        if (match) {
                          const coords = {
                            latitude: parseFloat(match[1]),
                            longitude: parseFloat(match[2]),
                          };
                          console.log("Extracted coordinates from !3d...!4d...:", coords);
                          return coords;
                        }

                        // Fallback to @lat,lng
                        match = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                        if (match) {
                          const coords = {
                            latitude: parseFloat(match[1]),
                            longitude: parseFloat(match[2]),
                          };
                          console.log("Extracted coordinates from @lat,lng:", coords);
                          return coords;
                        }

                        // Fallback to place/@lat,lng
                        match = mapsLink.match(/place\/.*\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
                        if (match) {
                          const coords = {
                            latitude: parseFloat(match[1]),
                            longitude: parseFloat(match[2]),
                          };
                          console.log("Extracted coordinates from place/@lat,lng:", coords);
                          return coords;
                        }

                        // Fallback to q=lat,lng
                        match = mapsLink.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
                        if (match) {
                          const coords = {
                            latitude: parseFloat(match[1]),
                            longitude: parseFloat(match[2]),
                          };
                          console.log("Extracted coordinates from q=lat,lng:", coords);
                          return coords;
                        }

                        console.error("No coordinates found in URL");
                        return null;
                      } catch (error) {
                        console.error("Error extracting coordinates:", error);
                        return null;
                      }
                    };

                    const vendorCoords = extractCoordinates(selectedVendor.mapsLink);
                    const reportData = {
                      vendorName: selectedVendor.name || 'Unknown Vendor',
                      vendorId: selectedVendor._id,
                      vendorLocation: vendorCoords ? `${vendorCoords.latitude}, ${vendorCoords.longitude}` : 'Location not available',
                      vendorArea: 'Area not specified',
                      userLocation: 'User location not available',
                      reportTime: new Date().toISOString(),
                      subject: `Wrong Location Report - ${selectedVendor.name || 'Unknown Vendor'}`
                    };

                    // Create form data for Web3Forms
                    const formData = new FormData();
                    formData.append('access_key', 'd003bcfb-91bc-44d0-8347-1259bbc5158f');
                    formData.append('subject', reportData.subject);
                    formData.append('from_name', 'LaariKhojo User');
                    formData.append('message', `
Vendor Location Report

Vendor Name: ${reportData.vendorName}
Vendor ID: ${reportData.vendorId}
Vendor Location: ${reportData.vendorLocation}
Vendor Area: ${reportData.vendorArea}
User Location: ${reportData.userLocation}
Report Time: ${new Date(reportData.reportTime).toLocaleString()}

The user reports that this vendor is not present at the specified location.
                    `.trim());

                    // Submit to Web3Forms
                    fetch('https://api.web3forms.com/submit', {
                      method: 'POST',
                      body: formData
                    })
                    .then(response => response.json())
                    .then(data => {
                      if (data.success) {
                        alert('Thank you for reporting! We will investigate this location issue.');
                      } else {
                        alert('Failed to submit report. Please try again.');
                      }
                    })
                    .catch(error => {
                      console.error('Error submitting report:', error);
                      alert('Failed to submit report. Please try again.');
                    });
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '500',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    justifyContent: 'center'
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#c82333';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLButtonElement).style.backgroundColor = '#dc3545';
                  }}
                >
                  ⚠️ Report Wrong Location
                </button>
              </div>

              {/* Contact Number */}
              <div style={{ 
                marginBottom: '16px', 
                fontSize: '13px',
                textAlign: 'center',
                color: '#666'
              }}>
                <strong>Phone:</strong> {selectedVendor.contactNumber || 'Not available'}
              </div>

              {/* Operating Hours and Days - Compact */}
              <div style={{ 
                marginBottom: '20px', 
                fontSize: '13px', 
                color: '#444',
                backgroundColor: '#f8f9fa',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong>Hours:</strong> {
                    selectedVendor.operatingHours && 
                    selectedVendor.operatingHours.openTime && 
                    selectedVendor.operatingHours.closeTime 
                      ? `${selectedVendor.operatingHours.openTime} - ${selectedVendor.operatingHours.closeTime}` 
                      : 'Not available'
                  }
                </div>
                <div>
                  <strong>Days:</strong> {
                    selectedVendor.operatingHours && 
                    selectedVendor.operatingHours.days && 
                    selectedVendor.operatingHours.days.length > 0 
                      ? selectedVendor.operatingHours.days
                          .sort((a: number, b: number) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b))
                          .map((day: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day])
                          .join(', ') 
                      : 'Not available'
                  }
                </div>
              </div>

              {/* Menu Options - Compact */}
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ 
                  fontSize: '15px', 
                  color: '#2c3e50', 
                  margin: '0 0 12px 0',
                  fontWeight: '600'
                }}>
                  Menu
                </h3>
                {Array.isArray(selectedVendor.bestDishes ?? selectedVendor.topDishes ?? []) && (selectedVendor.bestDishes ?? selectedVendor.topDishes ?? []).length > 0 ? (
                  <div style={{ 
                    maxHeight: '200px', 
                    overflowY: 'auto',
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    {(selectedVendor.bestDishes ?? selectedVendor.topDishes ?? []).slice(0, 8).map((dish, idx) => (
                      <div key={idx} style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        fontSize: '13px',
                        color: '#444',
                        paddingBottom: '6px',
                        borderBottom: idx < Math.min((selectedVendor.bestDishes ?? selectedVendor.topDishes ?? []).length - 1, 7) ? '1px solid #e9ecef' : 'none'
                      }}>
                        <span style={{ 
                          fontWeight: '500',
                          flex: 1,
                          paddingRight: '8px'
                        }}>
                          {dish.name || 'Not available'}
                        </span>
                        {dish.price !== undefined && dish.price !== null ? (
                          <span style={{ 
                            color: '#28a745', 
                            fontWeight: '600',
                            fontSize: '12px'
                          }}>
                            ₹{dish.price}
                          </span>
                        ) : (
                          <span style={{ 
                            color: '#888', 
                            fontSize: '11px'
                          }}>
                            N/A
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ 
                    color: '#888', 
                    fontSize: '13px',
                    textAlign: 'center',
                    padding: '20px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    Menu not available
                  </div>
                )}
              </div>

              {/* Reviews & Ratings - Enhanced Version */}
              <div style={{ 
                marginTop: 24, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 12, 
                padding: 16, 
                border: '1px solid #e9ecef' 
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  marginBottom: 16 
                }}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    color: '#2c3e50', 
                    margin: 0, 
                    fontWeight: 600 
                  }}>
                    Reviews & Ratings
                  </h3>
                  {reviews.length > 0 && (
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6,
                      backgroundColor: '#fff',
                      padding: '4px 8px',
                      borderRadius: 8,
                      border: '1px solid #e9ecef'
                    }}>
                      <span style={{ 
                        color: '#f5b50a', 
                        fontSize: 14, 
                        fontWeight: 'bold' 
                      }}>
                        {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)}
                      </span>
                      <div style={{ color: '#f5b50a', fontSize: 12 }}>
                        {'★'.repeat(Math.round(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length))}
                      </div>
                      <span style={{ 
                        color: '#666', 
                        fontSize: 11 
                      }}>
                        ({reviews.length})
                      </span>
                    </div>
                  )}
                </div>

                {/* Reviews List */}
                <div style={{ 
                  maxHeight: showAllReviews ? '400px' : '200px', 
                  overflowY: 'auto',
                  marginBottom: 16,
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  border: '1px solid #e9ecef'
                }}>
                  {reviews.length === 0 ? (
                    <div style={{ 
                      color: '#888', 
                      fontSize: '13px', 
                      textAlign: 'center',
                      padding: 24,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <div style={{ 
                        fontSize: 32, 
                        opacity: 0.3 
                      }}>
                        ⭐
                      </div>
                      <div>No reviews yet</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>
                        Be the first to share your experience!
                      </div>
                    </div>
                  ) : (
                    <>
                      {reviews.slice(0, showAllReviews ? reviews.length : 2).map((r, idx) => (
                        <div key={r._id || idx} style={{ 
                          padding: 12,
                          borderBottom: idx < Math.min(reviews.length - 1, showAllReviews ? reviews.length - 1 : 1) ? '1px solid #f0f0f0' : 'none'
                        }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: 6
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 8 
                            }}>
                              <div style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: 12,
                                fontWeight: 'bold'
                              }}>
                                {(r.name || 'A').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ 
                                  fontWeight: 600, 
                                  fontSize: 13,
                                  color: '#2c3e50'
                                }}>
                                  {r.name}
                                </div>
                                <div style={{ 
                                  fontSize: 10, 
                                  color: '#888'
                                }}>
                                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  }) : ''}
                                </div>
                              </div>
                            </div>
                            <div style={{ 
                              backgroundColor: '#f8f9fa',
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: '1px solid #e9ecef'
                            }}>
                              <div style={{ 
                                color: '#f5b50a', 
                                fontSize: 12,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}>
                                <span style={{ fontSize: 10 }}>★</span>
                                <span style={{ fontWeight: 600 }}>{r.rating}</span>
                              </div>
                            </div>
                          </div>
                          {r.comment && (
                            <div style={{ 
                              fontSize: 12, 
                              color: '#444',
                              lineHeight: 1.4,
                              marginLeft: 40,
                              fontStyle: 'italic'
                            }}>
                              "{r.comment}"
                            </div>
                          )}
                        </div>
                      ))}
                      {reviews.length > 2 && (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: 8,
                          borderTop: '1px solid #f0f0f0'
                        }}>
                          <button 
                            style={{ 
                              fontSize: 12, 
                              color: '#007bff', 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer',
                              fontWeight: 500,
                              padding: '4px 8px',
                              borderRadius: 4,
                              transition: 'background-color 0.2s'
                            }} 
                            onClick={() => setShowAllReviews(!showAllReviews)}
                            onMouseEnter={e => (e.target as HTMLButtonElement).style.backgroundColor = '#f0f8ff'}
                            onMouseLeave={e => (e.target as HTMLButtonElement).style.backgroundColor = 'transparent'}
                          >
                            {showAllReviews ? '↑ Show less' : `↓ Show all ${reviews.length} reviews`}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Add Review Form */}
                <div style={{ 
                  backgroundColor: '#fff',
                  borderRadius: 8,
                  padding: 16,
                  border: '1px solid #e9ecef'
                }}>
                  <h4 style={{ 
                    fontSize: 14, 
                    color: '#2c3e50', 
                    margin: '0 0 12px 0',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    <span style={{ fontSize: 16 }}>✍️</span>
                    Write a Review
                  </h4>
                  
                  <form onSubmit={handleReviewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <input 
                          name="name" 
                          value={reviewForm.name} 
                          onChange={handleReviewInput} 
                          placeholder="Your Name" 
                          style={{ 
                            width: '100%', 
                            padding: '8px 12px', 
                            borderRadius: 6, 
                            border: '1px solid #ddd', 
                            fontSize: 13,
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                            outline: 'none'
                          }} 
                          onFocus={e => {
                            (e.target as HTMLInputElement).style.borderColor = '#007bff';
                            (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(0,123,255,0.1)';
                          }}
                          onBlur={e => {
                            (e.target as HTMLInputElement).style.borderColor = '#ddd';
                            (e.target as HTMLInputElement).style.boxShadow = 'none';
                          }}
                          required 
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <input 
                          name="email" 
                          value={reviewForm.email} 
                          onChange={handleReviewInput} 
                          placeholder="Your Email" 
                          type="email" 
                          style={{ 
                            width: '100%', 
                            padding: '8px 12px', 
                            borderRadius: 6, 
                            border: '1px solid #ddd', 
                            fontSize: 13,
                            transition: 'border-color 0.2s, box-shadow 0.2s',
                            outline: 'none'
                          }} 
                          onFocus={e => {
                            (e.target as HTMLInputElement).style.borderColor = '#007bff';
                            (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px rgba(0,123,255,0.1)';
                          }}
                          onBlur={e => {
                            (e.target as HTMLInputElement).style.borderColor = '#ddd';
                            (e.target as HTMLInputElement).style.boxShadow = 'none';
                          }}
                          required 
                        />
                      </div>
                    </div>

                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 8,
                      padding: 12,
                      backgroundColor: '#f8f9fa',
                      borderRadius: 6,
                      border: '1px solid #e9ecef'
                    }}>
                      <div style={{ 
                        fontSize: 13, 
                        fontWeight: 500, 
                        color: '#2c3e50',
                        marginBottom: 4
                      }}>
                        Rate your experience:
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 4,
                        justifyContent: 'center'
                      }}>
                        {[1,2,3,4,5].map(star => (
                          <span 
                            key={star} 
                            style={{ 
                              cursor: 'pointer', 
                              color: reviewForm.rating >= star ? '#f5b50a' : '#ddd', 
                              fontSize: 24,
                              transition: 'color 0.2s, transform 0.1s',
                              userSelect: 'none'
                            }} 
                            onClick={() => handleStarClick(star)}
                            onMouseEnter={e => {
                              (e.target as HTMLSpanElement).style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={e => {
                              (e.target as HTMLSpanElement).style.transform = 'scale(1)';
                            }}
                          >
                            {reviewForm.rating >= star ? '★' : '☆'}
                          </span>
                        ))}
                      </div>
                      {reviewForm.rating > 0 && (
                        <div style={{ 
                          textAlign: 'center', 
                          fontSize: 11, 
                          color: '#666',
                          marginTop: 4
                        }}>
                          {reviewForm.rating === 1 && "Poor"}
                          {reviewForm.rating === 2 && "Fair"}
                          {reviewForm.rating === 3 && "Good"}
                          {reviewForm.rating === 4 && "Very Good"}
                          {reviewForm.rating === 5 && "Excellent"}
                        </div>
                      )}
                    </div>

                    <div>
                      <textarea 
                        name="comment" 
                        value={reviewForm.comment} 
                        onChange={handleReviewInput} 
                        placeholder="Share your experience (optional)" 
                        style={{ 
                          width: '100%', 
                          padding: '8px 12px', 
                          borderRadius: 6, 
                          border: '1px solid #ddd', 
                          fontSize: 13, 
                          minHeight: 60,
                          resize: 'vertical',
                          fontFamily: 'inherit',
                          transition: 'border-color 0.2s, box-shadow 0.2s',
                          outline: 'none'
                        }} 
                        onFocus={e => {
                          (e.target as HTMLTextAreaElement).style.borderColor = '#007bff';
                          (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 2px rgba(0,123,255,0.1)';
                        }}
                        onBlur={e => {
                          (e.target as HTMLTextAreaElement).style.borderColor = '#ddd';
                          (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    {reviewError && (
                      <div style={{ 
                        color: '#dc3545', 
                        fontSize: 12, 
                        backgroundColor: '#f8d7da',
                        padding: 8,
                        borderRadius: 4,
                        border: '1px solid #f5c6cb'
                      }}>
                        {reviewError}
                      </div>
                    )}

                    <button 
                      type="submit" 
                      disabled={submitting || reviewForm.rating === 0} 
                      style={{ 
                        width: '100%', 
                        background: submitting || reviewForm.rating === 0 ? '#6c757d' : '#007bff', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 6, 
                        padding: '10px 16px', 
                        fontWeight: 600, 
                        fontSize: 14, 
                        cursor: submitting || reviewForm.rating === 0 ? 'not-allowed' : 'pointer',
                        opacity: submitting || reviewForm.rating === 0 ? 0.7 : 1,
                        transition: 'background-color 0.2s, transform 0.1s',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6
                      }}
                      onMouseEnter={e => {
                        if (!submitting && reviewForm.rating > 0) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#0056b3';
                          (e.target as HTMLButtonElement).style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!submitting && reviewForm.rating > 0) {
                          (e.target as HTMLButtonElement).style.backgroundColor = '#007bff';
                          (e.target as HTMLButtonElement).style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {submitting ? (
                        <>
                          <span style={{ 
                            width: 12, 
                            height: 12, 
                            border: '2px solid #fff', 
                            borderTop: '2px solid transparent', 
                            borderRadius: '50%', 
                            animation: 'spin 1s linear infinite' 
                          }}></span>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: 16 }}>📝</span>
                          Submit Review
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
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
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/15557897194?text=Hi"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
        style={{
          position: 'fixed',
          bottom: '28px',
          right: '28px',
          zIndex: 2500,
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#25D366',
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'box-shadow 0.2s, transform 0.2s',
          cursor: 'pointer',
          textDecoration: 'none',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.28)';
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.08)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.18)';
          (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)';
        }}
      >
        {/* WhatsApp SVG Icon */}
        <svg width="34" height="34" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="16" fill="#25D366"/>
          <path d="M16 6.5C10.2 6.5 5.5 11.2 5.5 17C5.5 18.7 6 20.3 6.8 21.7L5 27L10.4 25.2C11.7 25.9 13.3 26.5 15 26.5C20.8 26.5 25.5 21.8 25.5 16C25.5 11.2 20.8 6.5 16 6.5ZM15 24.5C13.5 24.5 12.1 24.1 10.9 23.4L10.6 23.2L7.5 24.2L8.5 21.1L8.3 20.8C7.5 19.5 7 18 7 16.5C7 12.4 10.4 9 14.5 9C18.6 9 22 12.4 22 16.5C22 20.6 18.6 24 14.5 24C14.3 24 14.1 24 14 24C14.3 24.2 14.6 24.4 15 24.5ZM19.2 18.7C18.9 18.6 17.7 18 17.4 17.9C17.1 17.8 16.9 17.8 16.7 18.1C16.5 18.3 16.2 18.7 16 18.9C15.8 19.1 15.6 19.1 15.3 19C14.2 18.6 13.2 17.7 12.6 16.7C12.5 16.4 12.6 16.2 12.8 16C13 15.8 13.2 15.5 13.3 15.3C13.4 15.1 13.4 14.9 13.3 14.7C13.2 14.5 12.7 13.3 12.5 12.8C12.3 12.3 12.1 12.3 11.9 12.3C11.7 12.3 11.5 12.3 11.3 12.3C11.1 12.3 10.8 12.4 10.7 12.6C10.2 13.2 10 14.1 10.2 15.1C10.5 16.7 11.7 18.2 13.2 19.1C14.7 20 16.5 20.2 18.1 19.7C19.1 19.4 20 18.8 20.6 18.3C20.8 18.2 20.9 18 20.9 17.8C20.9 17.6 20.8 17.4 20.7 17.3C20.6 17.2 20.5 17.1 20.3 17.1C20.1 17.1 19.5 17.1 19.2 18.7Z" fill="#fff"/>
        </svg>
      </a>
    </div>
  );
};

export default MapPreview;
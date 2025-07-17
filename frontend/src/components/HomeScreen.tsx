import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';
// import Header from '../components/Header'; // Removed unused import
// import homescreenBg from '../assets/homescreen-bg.png'; // Removed unused import
import MapPreview from './MapPreview';
import { API_URL } from '../api/config'; // Import API_URL
import laarikhojoImage from '../assets/laarikhojo.png'; // Import the new image
import logoCropped from '../assets/logo_cropped.png'; // Import logo_cropped.png

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
}

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]); // State to store vendors
  // const [error, setError] = useState<string | null>(null); // Removed unused state
  const [isLaptopResolution, setIsLaptopResolution] = useState(window.innerWidth > 768); // New state for screen resolution

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLaptopResolution(window.innerWidth > 768);
    };

    window.addEventListener('resize', checkScreenSize);
    // Clean up the event listener on component unmount
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Commenting out unused state since we're hiding the sections that use them
  // const [activeKey, setActiveKey] = useState<'visibility' | 'trust' | 'credit'>('visibility');
  // const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // const keyOrder: Array<'visibility' | 'trust' | 'credit'> = ['visibility', 'trust', 'credit'];

  // const contentMap: Record<typeof activeKey, string> = {
  //   visibility: "Digitising Street Vendors Can<br/>Increase Their Daily Income By<br/>Up To 30% By Making Them<br/>Discoverable To Nearby<br/>Customers",
  //   trust: "Digital Platforms Enable Customer<br/>Reviews and Location Tracking<br/>That Build Trust and Lead To<br/>More Loyal, Repeat Buyers",
  //   credit: "Online Profiles and Sales Data<br/>Help Vendors Qualify For<br/>Micro-loans and Government<br/>Subsidies For Business Growth"
  // };

  // // Auto-rotate through the keywords
  // useEffect(() => {
  //   if (!isAutoPlaying) return;

  //   const interval = setInterval(() => {
  //     setActiveKey(prevKey => {
  //       const currentIndex = keyOrder.indexOf(prevKey);
  //       const nextIndex = (currentIndex + 1) % keyOrder.length;
  //       return keyOrder[nextIndex];
  //     });
  //   }, 3000); // Change every 3 seconds

  //   return () => clearInterval(interval);
  // }, [isAutoPlaying]);

  // const handleKeywordClick = (key: 'visibility' | 'trust' | 'credit') => {
  //   setActiveKey(key);
  //   setIsAutoPlaying(false); // Stop auto-play when user manually clicks
    
  //   // Resume auto-play after 10 seconds of inactivity
  //   setTimeout(() => {
  //     setIsAutoPlaying(true);
  //   }, 10000);
  // };

  const handleGetStartedClick = () => {
    navigate("/map");
  };

  // Function to fetch vendors (similar to MapDisplay)
  const fetchVendors = async () => {
    try {
      console.log("Fetching vendors from:", `${API_URL}/api/all-users`);
      const response = await fetch(`${API_URL}/api/all-users`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch vendors: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Fetched Vendors Response:", data);
      
      if (data.success && data.data) {
        setVendors(data.data);
        console.log("Vendors set successfully:", data.data.length, "vendors");
        return data.data;
      } else {
        console.error("API response indicates failure:", data);
        // setError("Failed to fetch vendors data"); // Removed call to unused setError
        return [];
      }
    } catch (error: unknown) {
      console.error("Error fetching vendors:", error);
      // setError(`Failed to fetch vendors data: ${error instanceof Error ? error.message : 'Unknown error'}`); // Removed call to unused setError
      return [];
    }
  };

  useEffect(() => {
    fetchVendors(); // Fetch vendors on component mount
  }, []);

  const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const toRad = (x: number) => (x * Math.PI) / 180;
    const R = 6371; // Radius of Earth in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const extractCoordinates = (mapsLink: string) => {
    if (typeof mapsLink !== 'string') return null;
    // Try !3d...!4d... pattern
    let match = mapsLink.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (match) {
      return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
    }
    // Try @lat,lng
    match = mapsLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
    }
    // Try place/@lat,lng
    match = mapsLink.match(/place\/.*\/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
    }
    // Try q=lat,lng
    match = mapsLink.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return { latitude: parseFloat(match[1]), longitude: parseFloat(match[2]) };
    }
    return null;
  };

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [nearbyCount, setNearbyCount] = useState<number>(0);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          setUserLocation(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, []);

  useEffect(() => {
    if (userLocation && vendors.length > 0) {
      const count = vendors.filter((vendor) => {
        const coords = extractCoordinates(vendor.mapsLink);
        if (!coords) return false;
        const dist = haversineDistance(
          userLocation.latitude,
          userLocation.longitude,
          coords.latitude,
          coords.longitude
        );
        return dist <= 2;
      }).length;
      setNearbyCount(count);
    }
  }, [userLocation, vendors]);

  return (
    <div className="home-container">
      {/* Logo Cropped on the top-left for HomeScreen */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          cursor: 'pointer',
        }}
        onClick={() => navigate('/')}
      >
        <img src={logoCropped} alt="Laari Logo" style={{ height: '60px' }} />
      </div>

      {/* Instagram Section */}
      {isLaptopResolution && (
        <div
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '8px 15px',
            borderRadius: '20px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
          }}
          onClick={() => window.open('https://www.instagram.com/laari.khojo?igsh=MTFjeWQ3aGo5ZHM1cw==', '_blank')}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="#E1306C"
          >
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          <span style={{ 
            color: '#333', 
            fontWeight: '500',
            fontSize: '16px'
          }}>
            @laarikhojo
          </span>
        </div>
      )}

      {/* Main Laari Khojo Image at the top center */}
      <img 
        src={laarikhojoImage} 
        alt="Laari Khojo Main" 
        className="laarikhojo-image"
        style={{
          position: 'absolute',
          top: '20px', // Align with other top elements
          left: '50%',
          transform: 'translateX(-50%)',
          height: '70px', // Adjust height to match the main logo size if needed
          zIndex: 999 // Ensure it's below the main logo and Instagram icon but above other content
        }}
      />

      {/* Hero Section Content */}
      <div className="hero-content-container">
      
        {/* Remove old image tag here as it's moved above */}
        {/* <img 
          src={laarikhojoImage} 
          alt="Laari Khojo" 
          style={{
            width: 'auto',
            height: '250px', // Adjust height as needed
            display: 'block', // Ensures it takes up its own line
            margin: '0 auto', // Centers horizontally
            marginTop: '-50px' // Adjusts vertical position to align with top logo
          }}
        /> */}
        
        <h1 className="hero-title" style={{ color: '#444', fontSize:'44px', marginTop:'10px' }}>Find Street Vendors Near You!</h1>
        <p className="hero-description" style={{ fontSize:'18px' }}>Connecting Street Vendors Ka Swaad</p>
        <button
          className="get-started-btn"
          onClick={handleGetStartedClick}
          style={{ backgroundColor: "#C80B41", margin:'15px', cursor: 'pointer' }}
        >
          Nearby Vendors
          {/* Arrow icon - using a simple SVG for now */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/>
          </svg>
        </button>
        <div style={{ padding: "0 5px 5px 5px", fontSize: "20px", textAlign: "center" }}>
          {userLocation && (
            <p style={{ fontSize: "16px", color: "#C80B41", fontWeight: "bold", alignItems: "center", marginTop:'20px' }}>
              <span style={{ marginRight: "5px" }}>📍</span>{nearbyCount} vendors within 2km radius
            </p>
          )}
          <p style={{ fontSize: "16px", color: "#C80B41", fontWeight: "bold", alignItems: "center", marginTop:'20px' }}><span style={{ marginRight: "5px" }}>Total</span>{vendors.length} vendors live on Laari Khojo!</p>
        </div>
      </div>

      

      {/* Map Preview Section */}
      <div style={{ 
        width: "100%", 
        maxWidth: "1200px", 
        margin: "10px auto", 
        backgroundColor: "#f8f8f8", 
        borderRadius: "12px", 
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" 
      }}>
        
        {/* <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: "32px", fontWeight: "bold", color: "#2c3e50", margin: "0" }}>Discover Vendors Nearby</h1>
          <button
            onClick={handleExpandMap}
            style={{
              backgroundColor: "#ff3b3b",
              color: "white",
              padding: "10px 20px",
              borderRadius: "20px",
              border: "none",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            Expand Map <span style={{ fontSize: "20px", lineHeight: "1" }}>−</span>
          </button>
        </div> */}
        <MapPreview vendors={vendors} />
      </div>

      {/* Commenting out everything below hero section */}
      {/* 
      <div className="image-section">
        <div className="image-overlay">
        <img src={homescreenBg} alt="Home Screen Image" />
        </div>
        <div className="image-content">
          <h2 className="image-section-title">Digitising Street Food<br/>Experiences</h2>
          <p className="image-section-text">OnBoard your Laari now!</p>
        </div>
      </div>

      <div className="stats-section">
        <div className="stat-item">
          <h3 className="stat-number">50+</h3>
          <p className="stat-description">Year Of Experience</p>
        </div>
        <div className="stat-item">
          <h3 className="stat-number">200+</h3>
          <p className="stat-description">Field In Progress</p>
        </div>
        <div className="stat-item">
          <h3 className="stat-number">120,000+</h3>
          <p className="stat-description">Farmer Around World</p>
        </div>
        <div className="stat-item">
          <h3 className="stat-number">$15</h3>
          <p className="stat-description">Billion Agricultural Products</p>
        </div>
      </div>

      <div className="text-block-section">
        <div className="text-block-left">
            <p className="text-block-year">2025</p>
            <div className="text-block-keywords">
            {(['visibility', 'trust', 'credit'] as const).map((key) => (
              <span
                key={key}
                className={`keyword ${activeKey === key ? 'active' : ''}`}
                onClick={() => handleKeywordClick(key)}
              >
                {key === 'visibility' && 'Increased Visibility'}
                {key === 'trust' && 'Verified Businesses'}
                {key === 'credit' && 'Access to Credit & Services'}
              </span>
            ))}
            </div>
        </div>
        <div className="text-block-right">
            <h2 
              className="text-block-title" 
              dangerouslySetInnerHTML={{ __html: contentMap[activeKey] }}
            />
        </div>
      </div>
      */}
    </div>
  );
};

export default HomeScreen;
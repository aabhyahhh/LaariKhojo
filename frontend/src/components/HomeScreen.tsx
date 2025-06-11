import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';
import Header from '../components/Header';
import homescreenBg from '../assets/homescreen-bg.png';
import MapPreview from './MapPreview';
import { API_URL } from '../api/config'; // Import API_URL

interface Vendor {
  _id: string;
  name: string;
  email?: string;
  contactNumber: string;
  mapsLink: string;
  operatingHours: { /* ... */ }; // Simplified, adjust as needed
}

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [vendors, setVendors] = useState<Vendor[]>([]); // State to store vendors
  const [error, setError] = useState<string | null>(null); // State for error handling
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

  const handleExpandMap = () => {
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
        setError("Failed to fetch vendors data");
        return [];
      }
    } catch (error: unknown) {
      console.error("Error fetching vendors:", error);
      setError(`Failed to fetch vendors data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  };

  useEffect(() => {
    fetchVendors(); // Fetch vendors on component mount
  }, []);

  return (
    <div className="home-container">
      {/* Hero Section Content */}
      <div className="hero-content-container">
        <p className="hero-subtitle">• Discover Street Food Near You!</p>
        <h1 className="hero-title">Laari Khojo</h1>
        <p className="hero-description">Live & Local</p>
        <button
          className="get-started-btn"
          onClick={handleGetStartedClick}
        >
          Get Started
          {/* Arrow icon - using a simple SVG for now */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z"/>
          </svg>
        </button>
      </div>

      {/* Map Preview Section */}
      <div style={{ width: "80%", maxWidth: "800px", margin: "20px auto", backgroundColor: "#f8f8f8", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ padding: "20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
        </div>
        <div style={{ padding: "0 20px 20px 20px" }}>
          <p style={{ fontSize: "16px", color: "#555", marginBottom: "5px" }}>
            <span style={{ marginRight: "5px" }}>📍</span>Showing vendors near your location
          </p>
          <p style={{ fontSize: "16px", color: "#e74c3c", fontWeight: "bold" }}>{vendors.length} vendors found</p>
        </div>
        <MapPreview onExpand={handleExpandMap} vendors={vendors} />
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
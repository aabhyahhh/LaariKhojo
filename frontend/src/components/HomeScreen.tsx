import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';
import Header from '../components/Header';
import homescreenBg from '../assets/homescreen-bg.png';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState<'visibility' | 'trust' | 'credit'>('visibility');
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  const keyOrder: Array<'visibility' | 'trust' | 'credit'> = ['visibility', 'trust', 'credit'];

  const contentMap: Record<typeof activeKey, string> = {
    visibility: "Digitising Street Vendors Can<br/>Increase Their Daily Income By<br/>Up To 30% By Making Them<br/>Discoverable To Nearby<br/>Customers",
    trust: "Digital Platforms Enable Customer<br/>Reviews and Location Tracking<br/>That Build Trust and Lead To<br/>More Loyal, Repeat Buyers",
    credit: "Online Profiles and Sales Data<br/>Help Vendors Qualify For<br/>Micro-loans and Government<br/>Subsidies For Business Growth"
  };

  // Auto-rotate through the keywords
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveKey(prevKey => {
        const currentIndex = keyOrder.indexOf(prevKey);
        const nextIndex = (currentIndex + 1) % keyOrder.length;
        return keyOrder[nextIndex];
      });
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleKeywordClick = (key: 'visibility' | 'trust' | 'credit') => {
    setActiveKey(key);
    setIsAutoPlaying(false); // Stop auto-play when user manually clicks
    
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => {
      setIsAutoPlaying(true);
    }, 10000);
  };

  const handleGetStartedClick = () => {
    // TODO: Implement navigation for Get Started button
    console.log("Get Started clicked");
    navigate("/map");
  };

  return (
    <div className="home-container">

      {/* New Hero Section Content */}
      <div className="hero-content-container">
        <p className="hero-subtitle">• Street Vendor Discovery Platform</p>
        <h1 className="hero-title">Laari Khojo</h1>
        <p className="hero-description">Find your Favourite Street Food - Live and Local</p>
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

      {/* New Image Section Below Hero */}
      <div className="image-section">
        <div className="image-overlay">
        <img src={homescreenBg} alt="Home Screen Image" />
        </div> {/* Overlay for text legibility */}
        <div className="image-content">
          <h2 className="image-section-title">Digitising Street Food<br/>Experiences</h2>
          <p className="image-section-text">OnBoard your Laari now!</p>
        </div>
      </div>

      {/* New Statistics Section */}
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

    </div>
  );
};

export default HomeScreen;
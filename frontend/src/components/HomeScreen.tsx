import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="hero-section">
      <div className="hero">
        <h1 className="heading">Welcome</h1>
        <div className="hero-button">
          <button 
            className="explore-now"
            onClick={() => navigate('/map')}
          >
            Explore now!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;

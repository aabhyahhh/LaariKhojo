import React from 'react';
import { useNavigate } from 'react-router-dom';
import './HomeScreen.css';
import Header from '../components/Header';

const HomeScreen: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <Header showRegisterButton={true} />
      <div className="hero-section">
        <div className="overlay">
          <div className="hero-content">
            <h1>Welcome to Laari Khojo</h1>
            <button 
              className="explore-btn"
              onClick={() => navigate('/map')}
            >
              Explore Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
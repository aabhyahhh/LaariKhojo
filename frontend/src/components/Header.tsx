import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Header.css";
import fullLogo from "../assets/logo.png";

interface HeaderProps {
  showRegisterButton?: boolean;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  showRegisterButton = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleRegisterClick = () => {
    navigate("/register");
  };

  const handleProfileClick = () => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/update-profile");
    } else {
      navigate("/login");
    }
  };

  const isRegisterPage = location.pathname === '/register';
  const isUpdateProfilePage = location.pathname === '/update-profile';

  return (
    <div className="new-hero-section" id="home">
      <header className="navigation-bar">
        <div className="logo" onClick={() => navigate("/")}>
          <img src={fullLogo} alt="Cultivo Logo" />
        </div>

        <nav className="nav-links">
          <ul>
            <li><a href="#home" className="nav-button active">Home</a></li>
            <li><a href="#about" className="nav-button">Explore Now</a></li>
            <li><a href="#reviews" className="nav-button">Reviews</a></li>
          </ul>
        </nav>

        <div className="header-right">
          {showRegisterButton && !isRegisterPage && (
            <button
              onClick={handleRegisterClick}
              className="register-btn"
            >
              Register
            </button>
          )}

          {!isUpdateProfilePage && (
            <div onClick={handleProfileClick} className="user-profile">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" />
              </svg>
            </div>
          )}
        </div>
      </header>
    </div>
  );
};

export default Header;
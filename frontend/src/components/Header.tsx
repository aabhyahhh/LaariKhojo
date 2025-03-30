import React from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import fullLogo from "../assets/full-logo.png";

interface HeaderProps {
  showRegisterButton?: boolean;
  isLoggedIn?: boolean;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({
  showRegisterButton = true,
  onLogout,
  isLoggedIn = false,
}) => {
  const navigate = useNavigate();

  const handleRegisterClick = () => {
    navigate("/register");
  };

  const handleProfileClick = () => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/update-profile");
    } else {
      navigate("/login");
    }
  };

  return (
    <header>
      <div className="header-container">
        <div
          className="logo"
          onClick={() => navigate("/")}
        >
          <img src={fullLogo} alt="" />
        </div>
        
        <div className="header-right">
          {showRegisterButton && (
            <button
              onClick={handleRegisterClick}
              className="register-btn"
            >
              Register
            </button>
          )}

          {/* Profile Icon - only shown for simplicity in this implementation */}
          <div onClick={handleProfileClick} className="user-profile">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" />
            </svg>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
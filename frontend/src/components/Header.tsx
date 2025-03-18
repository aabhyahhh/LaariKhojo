import React from "react";
import { useNavigate } from "react-router-dom";
import "./Header.css";
import "../assets/profile.png";

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
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="header">
        <div
          className="left-header"
          onClick={() => navigate("/")}
        >
          Laari Khojo
        </div>
        </div>

        <div className="right-header">
        {showRegisterButton && (
          <button
            onClick={handleRegisterClick}
            className="px-4 py-2 rounded-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Register
          </button>
        )}

        {/* Profile Icon */}
        <div onClick={handleProfileClick} className="user-profile">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" />
          </svg>
        </div>
        </div>
    </header>
  );
};

export default Header;

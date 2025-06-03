import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css"; // Reuse login styles
import Header from "./Header";
import { API_URL } from "../api/config";

interface OperatingHours {
  openTime: string;
  closeTime: string;
  days: number[];
}

interface ProfileData {
  name: string;
  contactNumber: string;
  mapsLink: string;
  email: string;
  operatingHours: OperatingHours;
}

function UpdateProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);

  const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" }
  ];

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch user profile data
    const fetchProfileData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/profile`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const data = await response.json();
        if (data.success && data.data) {
          const profile: ProfileData = data.data;
          
          // Populate form fields
          setName(profile.name || "");
          setContactNumber(profile.contactNumber || "");
          setMapsLink(profile.mapsLink || "");
          
          if (profile.operatingHours) {
            setOpenTime(profile.operatingHours.openTime || "08:00");
            setCloseTime(profile.operatingHours.closeTime || "18:00");
            setSelectedDays(profile.operatingHours.days || [0, 1, 2, 3, 4, 5, 6]);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleDayToggle = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(id => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess('Profile updated successfully!');

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const operatingHours = {
      openTime: openTime,
      closeTime: closeTime,
      days: selectedDays
    };

    try {
      const response = await fetch(`${API_URL}/api/update-profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name,
          contactNumber,
          mapsLink,
          operatingHours
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || "Update failed");
      }

      setSuccess("Profile updated successfully!");
      // Reset form after successful update
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <>
      <Header isLoggedIn={true} onLogout={handleLogout} />
      
      <div className="register-container">
        <div className="register-card">
          {success ? (
            <div className="success-message">
              <h2>Profile Updated Successfully!</h2>
            </div>
          ) : (
            <>
              <div className="register-header">
                <h2>Update Your Profile</h2>
                <p>Modify your vendor information</p>
              </div>

              {error && (
                <div className="error-message">
                  <div className="error-icon">⚠️</div>
                  <p>{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                  <label htmlFor="username">
                    Laari Name
                  </label>
                  <input
                    type="text"
                    id="username"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactNumber">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    onChange={(e) => setContactNumber(e.target.value)}
                    value={contactNumber}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mapsLink">
                    Google Maps URL <a
                      href="https://www.google.co.in/maps/preview"
                      style={{ color: "blue", textDecoration: "underline" }}
                    >https://www.google.co.in/maps/preview
                    </a>
                  </label>
                  <input
                    type="url"
                    id="mapsLink"
                    onChange={(e) => setMapsLink(e.target.value)}
                    value={mapsLink}
                    required
                  />
                </div>

                {/* Operating Hours Section */}
                <div className="form-group">
                  <label>Operating Hours</label>
                  <div className="opening-hours-container">
                    <div className="time-inputs">
                      <label htmlFor="openTime">Open Time</label>
                      <input
                        type="time"
                        id="openTime"
                        value={openTime}
                        onChange={(e) => setOpenTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="time-inputs">
                      <label htmlFor="closeTime">Close Time</label>
                      <input
                        type="time"
                        id="closeTime"
                        value={closeTime}
                        onChange={(e) => setCloseTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Operating Days Section */}
                <div className="form-group">
                  <label>Operating Days</label>
                  <div className="days-grid">
                    {daysOfWeek.map((day) => (
                      <div key={day.id} className="day-checkbox">
                        <label htmlFor={`day-${day.id}`}>{day.name}</label>
                        <input
                          type="checkbox"
                          id={`day-${day.id}`}
                          checked={selectedDays.includes(day.id)}
                          onChange={() => handleDayToggle(day.id)}
                          className="day-checkbox-input"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className="register-button"
                  type="submit"
                >
                  Update Profile
                </button>
              </form>

              <div className="login-link">
                <p>
                  <button 
                    onClick={handleLogout}
                    className="text-red-500 hover:text-red-700"
                    style={{ 
                      backgroundColor: "transparent", 
                      border: "none", 
                      cursor: "pointer",
                      textDecoration: "underline" 
                    }}
                  >
                    Logout
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default UpdateProfile;
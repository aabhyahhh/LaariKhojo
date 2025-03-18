import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Reuse login styles
import Header from "./Header";

interface OperatingHours {
  open: string;
  close: string;
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
        const response = await fetch(`${import.meta.env.VITE_REACT_APP_BASEURL}/api/profile`, {
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
            setOpenTime(profile.operatingHours.open || "08:00");
            setCloseTime(profile.operatingHours.close || "18:00");
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
    setSuccess(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const operatingHours = {
      open: openTime,
      close: closeTime,
      days: selectedDays
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_REACT_APP_BASEURL}/api/update-profile`, {
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

      <div className="login-container">
        <div className="login-card" style={{ maxWidth: "600px" }}>
          <div className="login-header">
            <h2>Update Your Profile</h2>
            <p>Modify your vendor information</p>
          </div>

          {error && (
            <div className="error-message">
              <div className="error-icon">⚠️</div>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="success-message" style={{ 
              backgroundColor: "#d4edda", 
              color: "#155724", 
              padding: "10px", 
              borderRadius: "4px", 
              marginBottom: "20px" 
            }}>
              <p>✅ {success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="name">Laari Name</label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your stall name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactNumber">Contact Number</label>
              <input
                id="contactNumber"
                type="tel"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="Your phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mapsLink">Google Maps Link</label>
              <input
                id="mapsLink"
                type="url"
                required
                value={mapsLink}
                onChange={(e) => setMapsLink(e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="form-group">
              <label>Operating Hours</label>
              <div className="flex space-x-4">
                <div className="w-1/2">
                  <label htmlFor="openTime" className="text-sm">Open</label>
                  <input
                    id="openTime"
                    type="time"
                    required
                    value={openTime}
                    onChange={(e) => setOpenTime(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-1/2">
                  <label htmlFor="closeTime" className="text-sm">Close</label>
                  <input
                    id="closeTime"
                    type="time"
                    required
                    value={closeTime}
                    onChange={(e) => setCloseTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Operating Days</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {daysOfWeek.map((day) => (
                  <div key={day.id} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`day-${day.id}`}
                      checked={selectedDays.includes(day.id)}
                      onChange={() => handleDayToggle(day.id)}
                      className="mr-2"
                    />
                    <label htmlFor={`day-${day.id}`}>{day.name}</label>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="login-button">
              Update Profile
            </button>
          </form>

          <div className="mt-4 text-center">
            <button 
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 underline"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default UpdateProfile;
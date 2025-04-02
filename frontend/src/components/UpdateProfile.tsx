import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Register.css"; // Reuse login styles
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

const API_URL = "https://laari-khojo-backend.onrender.com";

function UpdateProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [debugResponse, setDebugResponse] = useState<any>(null);

  // Form state
  const [name, setName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  const [email, setEmail] = useState("");
  const [openTime, setOpenTime] = useState("08:00");
  const [closeTime, setCloseTime] = useState("18:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);

  // Debug options
  const [debugMode ] = useState(true);
  const [includeEmail, setIncludeEmail] = useState(false);

  const daysOfWeek = [
    { id: 0, name: "Sunday" },
    { id: 1, name: "Monday" },
    { id: 2, name: "Tuesday" },
    { id: 3, name: "Wednesday" },
    { id: 4, name: "Thursday" },
    { id: 5, name: "Friday" },
    { id: 6, name: "Saturday" },
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
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        console.log("Profile data received:", data);
        
        if (response.ok && data.success && data.data) {
          const profile: ProfileData = data.data;

          // Populate form fields
          setName(profile.name || "");
          setContactNumber(profile.contactNumber || "");
          setMapsLink(profile.mapsLink || "");
          setEmail(profile.email || "");

          if (profile.operatingHours) {
            setOpenTime(profile.operatingHours.open || "08:00");
            setCloseTime(profile.operatingHours.close || "18:00");
            setSelectedDays(
              profile.operatingHours.days || [0, 1, 2, 3, 4, 5, 6]
            );
          }
        } else {
          throw new Error(data.msg || "Failed to fetch profile data");
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  const handleDayToggle = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter((id) => id !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setDebugResponse(null);

    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Format the operating hours correctly
    // In handleSubmit function, update the operating hours creation
const operatingHours = {
  open: openTime || "08:00",
  close: closeTime || "18:00",
  days: selectedDays.length > 0 ? selectedDays : [0, 1, 2, 3, 4, 5, 6],
};

    // Create the request payload - modify based on debug options
    let profileData: any = {
      name,
      contactNumber,
      mapsLink,
      operatingHours
    };
    
    // Conditionally include email
    if (includeEmail) {
      profileData.email = email;
    }
    
    console.log("Sending profile update:", profileData);

    try {
      // Make the API request
      const response = await fetch(`${API_URL}/api/update-profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      // Try to parse response as JSON
      let data;
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      try {
        data = JSON.parse(responseText);
        console.log("Parsed response:", data);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        data = { 
          parse_error: true, 
          raw_response: responseText 
        };
      }
      
      // Save debug info
      setDebugResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers]),
        data: data,
        rawText: responseText
      });

      if (!response.ok) {
        throw new Error(data?.msg || `Update failed with status ${response.status}`);
      }

      setSuccess("Profile updated successfully!");
    } // Replace the catch block in handleSubmit with this:
    catch (err: any) {
      console.error("Update error details:", err);
      const errorMessage = err.message || "Update failed";
    
      if (err.response) {
        console.error("Error response:", err.response.data);
        setError(err.response.data.msg || errorMessage);
      } else {
        setError(errorMessage);
      }
    }    
  };

  // Simplified test request with minimal data
  const handleSimpleTest = async () => {
    setError(null);
    setSuccess(null);
    setDebugResponse(null);
    
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    
    // Create minimal test payload
    const testData = {
      name: name || "Test Name"
    };
    
    console.log("Sending minimal test data:", testData);
    
    try {
      const response = await fetch(`${API_URL}/api/update-profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testData),
      });
      
      const responseText = await response.text();
      console.log("Raw test response:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        data = { parse_error: true, raw_response: responseText };
      }
      
      setDebugResponse({
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries([...response.headers]),
        data: data,
        rawText: responseText
      });
      
      if (response.ok) {
        setSuccess("Test update successful!");
      } else {
        setError(`Test failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("Test error:", err);
      setError(err instanceof Error ? err.message : "Test failed");
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
              {debugResponse && (
                <div style={{ marginTop: "20px", textAlign: "left" }}>
                  <h3>Response Debug Info:</h3>
                  <pre style={{ 
                    background: "#f5f5f5", 
                    padding: "10px", 
                    borderRadius: "5px",
                    maxHeight: "200px",
                    overflow: "auto" 
                  }}>
                    {JSON.stringify(debugResponse, null, 2)}
                  </pre>
                </div>
              )}
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

              {/* Debug Response Display */}
              {debugMode && debugResponse && (
                <div style={{ 
                  margin: "10px 0", 
                  padding: "10px", 
                  background: "#f8f9fa", 
                  border: "1px solid #ddd",
                  borderRadius: "5px"
                }}>
                  <h3>Debug Response</h3>
                  <p><strong>Status:</strong> {debugResponse.status} {debugResponse.statusText}</p>
                  <div style={{ 
                    maxHeight: "200px", 
                    overflow: "auto", 
                    background: "#eee", 
                    padding: "10px", 
                    borderRadius: "4px", 
                    marginTop: "10px" 
                  }}>
                    <pre>{JSON.stringify(debugResponse, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Debug Controls */}
              {debugMode && (
                <div style={{ 
                  margin: "10px 0", 
                  padding: "10px", 
                  background: "#e9ecef", 
                  border: "1px solid #ced4da",
                  borderRadius: "5px"
                }}>
                  <h3>Debug Options</h3>
                  <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                    <input 
                      type="checkbox" 
                      id="includeEmail" 
                      checked={includeEmail} 
                      onChange={() => setIncludeEmail(!includeEmail)}
                      style={{ marginRight: "10px" }}
                    />
                    <label htmlFor="includeEmail">Include Email in Request</label>
                  </div>
                  <button 
                    onClick={handleSimpleTest}
                    style={{
                      padding: "8px 16px",
                      background: "#17a2b8",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer"
                    }}
                  >
                    Test Minimal Update
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="register-form">
                <div className="form-group">
                  <label htmlFor="username">Laari Name</label>
                  <input
                    type="text"
                    id="username"
                    onChange={(e) => setName(e.target.value)}
                    value={name}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contactNumber">Contact Number</label>
                  <input
                    type="tel"
                    id="contactNumber"
                    onChange={(e) => setContactNumber(e.target.value)}
                    value={contactNumber}
                    placeholder="10-digit mobile number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    value={email}
                    placeholder="your@email.com"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="mapsLink">Google Maps URL</label>
                  <input
                    type="url"
                    id="mapsLink"
                    onChange={(e) => setMapsLink(e.target.value)}
                    value={mapsLink}
                    placeholder="https://www.google.com/maps/..."
                    required
                  />
                  <small style={{ display: "block", marginTop: "5px", color: "#666" }}>
                    Must contain coordinates in format @latitude,longitude
                  </small>
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

                <button className="register-button" type="submit">
                  Update Profile
                </button>
              </form>

              <div className="login-link">
                <p>
                  <button
                    onClick={handleLogout}
                    style={{
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textDecoration: "underline",
                      color: "red"
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
}

export default UpdateProfile;
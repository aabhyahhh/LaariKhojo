import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";
import { Link } from "react-router-dom";

// Update this to your proxy URL if using the proxy solution
const API_URL = "https://laari-khojo-backend.onrender.com";

interface LoginProps {
  onLoginSuccess?: (token: string) => void;
  redirectPath?: string;
}

function Login({ onLoginSuccess, redirectPath = "/update-profile" }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state if available
  const from = location.state?.from?.pathname || redirectPath;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log("Attempting login with:", { email }); // Don't log passwords
      
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies if your backend uses them
        body: JSON.stringify({ email, password }),
      });

      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Response data:", data);

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store token in localStorage
      console.log("Login successful, token received");
      localStorage.setItem("token", data.accessToken);

      // Call the success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(data.accessToken);
      } else {
        // Only navigate directly if onLoginSuccess is not provided
        navigate(from);
      }

    } catch (err) {
      console.error("Login error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Login failed - CORS issue or server unavailable");
      }
    } finally {
      setLoading(false);
    }    
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Please sign in to your account</p>
        </div>

        {error && (
          <div className="error-message">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="login-link">
          <p>Don't have an account?
            <Link to="/register">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
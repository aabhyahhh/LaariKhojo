import { useState } from "react";
import "./Login.css";
import { Link } from "react-router-dom";
import Header from "./Header";

interface LoginProps {
  onLoginSuccess?: (token: string) => void;
}

function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await fetch("http://localhost:3000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Store token in localStorage
      console.log("Storing token in localStorage" + data.accessToken);
      localStorage.setItem("token", data.accessToken);

      // Call the success callback if provided
      if (onLoginSuccess) {
        onLoginSuccess(data.accessToken);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove authentication token
    window.location.reload(); // Reload or navigate to login page
  };

  return (
    <>
    <Header isLoggedIn={false} onLogout={ handleLogout } />

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

          <button type="submit" className="login-button">
            Sign in
          </button>
        </form>

        <div className="login-link">
          <p>Don't have an account?
            <Link to="/register">Sign Up</Link> {/* Use Link instead of a */}
          </p>
        </div>
      </div>
    </div>
    </>
  );
}

export default Login;

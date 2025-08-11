// src/pages/LoginPage.jsx
import '../styles/Login.css';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useState } from 'react';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="login-wrapper">
      <div className="auth-header">
        <img src={logo} alt="Code Sync Logo" className="logo-img" />
        <span className="logo-text">CodeSync</span>
      </div>

      <div className="auth-box">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Login to your account to continue</p>

        <form className="auth-form">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            required
          />

          <label htmlFor="login-password">Password</label>
          <div className="password-input-wrapper">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          <p className="forgot-password">
            <a href="#">Forgot Password?</a>
          </p>

          <button type="submit">Log In</button>

          <p className="auth-bottom-text">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

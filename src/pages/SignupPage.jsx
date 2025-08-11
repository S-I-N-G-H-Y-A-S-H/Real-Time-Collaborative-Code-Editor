// src/pages/SignupPage.jsx
import '../styles/Signup.css';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useState } from 'react';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
    } else {
      setError('');
      alert('Signed up successfully!');
      // add real signup logic here
    }
  };

  return (
    <div className="signup-wrapper">
      <div className="auth-header">
        <img src={logo} alt="Code Sync Logo" className="logo-img" />
        <span className="logo-text">CodeSync</span>
      </div>

      <div className="auth-box">
        <h1 className="auth-title">Join CodeSync</h1>
        <p className="auth-subtitle">Create your account to get started</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="signup-username">Username</label>
          <input
            id="signup-username"
            type="text"
            placeholder="Enter your username"
            required
          />

          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            required
          />

          <label htmlFor="signup-password">Create New Password</label>
          <div className="password-input-wrapper">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

          <label htmlFor="signup-confirm-password">Confirm Password</label>
          <div className="password-input-wrapper">
            <input
              id="signup-confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={error ? 'input-error' : ''}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((s) => !s)}
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && <p className="error-text">{error}</p>}

          <button type="submit">Sign Up</button>

          <p className="auth-bottom-text">
            Already have an account? <Link to="/login">Log In</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;

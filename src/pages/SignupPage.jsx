// src/pages/SignupPage.jsx
import '../styles/Signup.css';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useState } from 'react';
import API from '../api';

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id.replace('signup-', '')]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await API.post('/auth/signup', form);
      setError('');
      setMessage(
        'Signup successful! Please check your email inbox to verify your account.'
      );
    } catch (err) {
      setMessage('');
      setError(err.response?.data?.error || 'Signup failed');
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
            value={form.username}
            onChange={handleChange}
            required
          />

          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="signup-password">Create New Password</label>
          <div className="password-input-wrapper">
            <input
              id="signup-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
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
          {message && <p className="success-text">{message}</p>}

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

// src/pages/LoginPage.jsx
import '../styles/Login.css';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.png';
import { useState } from 'react';
import API from '../api';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.id.replace('login-', '')]: e.target.value });
  };

  // Decode JWT payload (works even if backend doesn't send user object)
  const decodeToken = (token) => {
    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(
        atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
      );
      return decoded;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', form);

      const token = res.data.token;
      localStorage.setItem('token', token);

      // If backend sends { user }
      let user = res.data.user;

      // If backend sends ONLY token, decode user info from JWT
      if (!user) {
        const decoded = decodeToken(token);
        user = {
          username: decoded?.username || decoded?.name || decoded?.email || "User",
          email: decoded?.email,
          id: decoded?.id || decoded?._id,
        };
      }

      // Save user to localStorage
      localStorage.setItem('user', JSON.stringify(user));

      setError('');
      setMessage('Login successful. Redirecting...');
      setTimeout(() => navigate('/welcome'), 1200);
    } catch (err) {
      setMessage('');
      if (err.response?.status === 403) {
        setError('Please verify your email before logging in.');
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    }
  };

  return (
    <div className="login-wrapper">
      <div className="auth-header">
        <img src={logo} alt="Code Sync Logo" className="logo-img" />
        <span className="logo-text">CodeSync</span>
      </div>

      <div className="auth-box">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Login to your account to continue</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            required
          />

          <label htmlFor="login-password">Password</label>
          <div className="password-input-wrapper">
            <input
              id="login-password"
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

          {error && <p className="error-text">{error}</p>}
          {message && <p className="success-text">{message}</p>}

          <p className="forgot-password">
            <Link to="/forgot-password">Forgot Password?</Link>
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

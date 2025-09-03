import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ email should come from Forgot Password page (via location.state)
  const [email, setEmail] = useState(location.state?.email || "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // 🚨 Redirect if no email in state (user tried to access directly)
  useEffect(() => {
    if (!location.state?.email) {
      navigate("/forgot-password");
    }
  }, [location.state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
        { email, otp, newPassword }
      );
      setMessage(res.data.message);

      // redirect to login after successful reset
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="auth-box">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">Enter OTP and set your new password</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            readOnly // ✅ prevent editing email
          />

          <label>OTP</label>
          <input
            type="text"
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            required
          />

          <label>New Password</label>
          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((s) => !s)}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <label>Confirm Password</label>
          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((s) => !s)}
            >
              {showConfirmPassword ? "Hide" : "Show"}
            </button>
          </div>

          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary">
            Reset Password
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPasswordPage;

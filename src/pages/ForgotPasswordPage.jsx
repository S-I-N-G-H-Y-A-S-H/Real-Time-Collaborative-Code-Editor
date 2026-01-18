import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE}/api/auth/forgot-password`,
        { email }
      );
      setMessage(res.data.message);

      // ✅ After OTP is sent, navigate to Reset Password with email
      setTimeout(() => {
        navigate("/reset-password", { state: { email } });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="auth-box">
        <h1 className="auth-title">Forgot Password</h1>
        <p className="auth-subtitle">Enter your registered email</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {message && <p className="success-text">{message}</p>}
          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary">
            Send OTP
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;

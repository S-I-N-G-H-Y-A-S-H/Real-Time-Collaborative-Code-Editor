// src/components/Footer.jsx
import "../styles/Footer.css";

function Footer() {
  return (
    <div className="footer">
      <div className="footer-left">
        <span className="footer-text">
          CodeSync © {new Date().getFullYear()}
        </span>
      </div>

      <div className="footer-right">
        <span className="footer-text">
          
        </span>
      </div>
    </div>
  );
}

export default Footer;

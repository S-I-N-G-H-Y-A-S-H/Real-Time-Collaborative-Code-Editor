import '../styles/Footer.css';
import wifiIcon from '../assets/wifi-icon.png';
import notificationIcon from '../assets/notification-icon.png';

function Footer() {
    return (
        <div className="footer">
            <div className="footer-left">
                <img src={wifiIcon} alt="WiFi" className="footer-icon" />

            </div>

            <div className="footer-right">
                <img src={notificationIcon} alt="Notifications" className="footer-icon" />
            </div>
        </div>
    );
}

export default Footer;

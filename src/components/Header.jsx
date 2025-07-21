import logo from '../assets/logo.png';
import searchIcon from '../assets/search-icon.png';
import '../styles/Header.css';


function Header({ onSearchClick }) {
    return (
        <div className="header-wrapper">
            {/* Left Section: Logo + Menu */}
            <div className="left-section">
                <img src={logo} alt="Logo" className="logo-circle" />
                <div className="menu-container">
                    <span className="menu-item">File</span>
                    <span className="menu-item">Edit</span>
                    <span className="menu-item">View</span>
                    <span className="menu-item">Run</span>
                    <span className="menu-item">Terminal</span>
                    <span className="menu-item">Help</span>
                </div>
            </div>

            {/* Center Section: Search */}
            <div className="center-section">
                <div className="search-wrapper" onClick={onSearchClick}>
                    <img src={searchIcon} alt="Search" className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="search-input"
                        readOnly // Prevent keyboard entry
                    />
                </div>
            </div>

            {/* Right Section */}
            <div className="right-section">
                <button className="invite-btn">Invite</button>
                <button className="join-btn">Join</button>
            </div>
        </div>
    );
}

export default Header;

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import logo from '../assets/logo.png';
import newFileIcon from '../assets/new-file.png';
import openFileIcon from '../assets/open-file.png';
import openFolderIcon from '../assets/open-folder.png';
import '../styles/WelcomePage.css';

function WelcomePage() {
    return (
        <div className="welcome-wrapper">
            <Header />

            <div className="body-layout">
                <Sidebar />

                <div className="welcome-body">
                    {/* Left Section */}
                    <div className="welcome-left">
                        <h1 className="welcome-heading">
                            Welcome to Real-Time Collaborative Code Editor
                        </h1>

                        <div className="start-section">
                            <h3 style={{ color: '#74ff4e' }}>Start</h3>

                            <button className="action-btn">
                                <img src={newFileIcon} alt="New" className="action-icon" />
                                New File
                            </button>

                            <button className="action-btn">
                                <img src={openFileIcon} alt="Open File" className="action-icon" />
                                Open File
                            </button>

                            <button className="action-btn">
                                <img src={openFolderIcon} alt="Open Folder" className="action-icon" />
                                Open Folder
                            </button>
                        </div>
                    </div>

                    {/* Center Logo */}
                    <div className="welcome-logo-center">
                        <img src={logo} alt="Logo" className="translucent-logo" />
                    </div>

                    {/* Right Side Options */}
                    <div className="welcome-right">
                        <button className="invite-btn">Invite</button>
                        <button className="join-btn">Join</button>
                    </div>
                </div>
            </div>

            {/* ✅ Move footer here */}
            <Footer />
        </div>
    );
}

export default WelcomePage;

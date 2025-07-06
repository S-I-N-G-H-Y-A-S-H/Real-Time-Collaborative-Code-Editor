import file from '../assets/file-icon.png';
import search from '../assets/search-icon.png';
import extension from '../assets/extension-icon.png';
import profile from '../assets/profile-icon.png';
import settings from '../assets/settings-icon.png';
import sourceControl from '../assets/source-control-icon.png';
import runAndDebug from '../assets/run-and-debug-icon.png';

import '../styles/Sidebar.css';

function Sidebar() {
    return (
        <div className="sidebar">
            <div className="sidebar-section">
                <img src={file} alt="File Explorer" className="sidebar-icon" />
                <img src={search} alt="Search" className="sidebar-icon" />
                <img src={sourceControl} alt="Source Control" className="sidebar-icon" />
                <img src={runAndDebug} alt="Run and Debug" className="sidebar-icon" />
                <img src={extension} alt="Extensions" className="sidebar-icon" />
            </div>
            <div className="sidebar-section bottom">
                <img src={profile} alt="User Profile" className="sidebar-icon" />
                <img src={settings} alt="Settings" className="sidebar-icon" />
            </div>
        </div>
    );
}

export default Sidebar;

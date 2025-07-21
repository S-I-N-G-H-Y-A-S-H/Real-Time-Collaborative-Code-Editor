import { useFile } from '../context/FileContext';
import closeIcon from '../assets/close-tab.png';
import '../styles/Tabs.css';

function Tabs() {
    const { currentFile } = useFile();

    return (
        <div className="tab-bar">
            <div className="tab active-tab">
                <span className="tab-filename">{currentFile?.fileName}</span>
                <img
                    src={closeIcon}
                    alt="Close Tab"
                    className="close-tab-icon"
                    onClick={() => alert("Tab close logic coming soon")}
                />
            </div>
        </div>
    );
}

export default Tabs;

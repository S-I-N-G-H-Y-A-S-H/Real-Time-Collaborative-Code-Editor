import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFile } from '../context/FileContext';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import NewFileModal from '../components/NewFileModal';

import logo from '../assets/logo.png';
import newFileIcon from '../assets/new-file.png';
import openFileIcon from '../assets/open-file.png';
import openFolderIcon from '../assets/open-folder.png';

import '../styles/WelcomePage.css';

function WelcomePage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();
    const { setCurrentFile } = useFile();

    // 🔒 Redirect to login if no token
    useEffect(() => {
        
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
        }
        
    }, [navigate]);

    const handleNewFileClick = () => {
        setIsModalOpen(true);
    };

    const handleCreateNewFile = async (fileName) => {
        setIsModalOpen(false);

        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: fileName,
                types: [{
                    description: 'Code files',
                    accept: { 'text/plain': ['.js', '.py', '.txt', '.html', '.css', '.java'] },
                }],
            });

            const writable = await handle.createWritable();
            await writable.write(""); // write empty content
            await writable.close();

            const file = await handle.getFile();
            const content = await file.text();

            setCurrentFile({
                fileName: file.name,
                fileContent: content,
                fileHandle: handle,
            });

            navigate('/editor');
        } catch (err) {
            console.error("File creation cancelled or failed:", err);
        }
    };

    const handleOpenFile = async () => {
        try {
            const [fileHandle] = await window.showOpenFilePicker();
            const file = await fileHandle.getFile();
            const content = await file.text();

            setCurrentFile({
                fileName: file.name,
                fileContent: content,
                fileHandle: fileHandle,
            });

            navigate('/editor');
        } catch (err) {
            console.error("File open cancelled or failed:", err);
        }
    };

    const handleOpenFolder = async () => {
        try {
            const dirHandle = await window.showDirectoryPicker();
            const files = [];

            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    files.push(entry.name);
                }
            }

            alert(`Files in selected folder:\n${files.join('\n')}`);
        } catch (err) {
            console.error("Folder open cancelled or failed:", err);
        }
    };

    return (
        <div className="welcome-wrapper">
            <Header />

            <div className="body-layout">
                <Sidebar />

                <div className="welcome-body">
                    {/* Left Section */}
                    <div className="welcome-left">
                        <h1 className="welcome-heading">
                            Welcome to Code Sync
                        </h1>

                        <div className="start-section">
                            <h3 style={{ color: '#74ff4e' }}>Start</h3>

                            <button className="action-btn" onClick={handleNewFileClick}>
                                <img src={newFileIcon} alt="New File" className="action-icon" />
                                New File
                            </button>

                            <button className="action-btn" onClick={handleOpenFile}>
                                <img src={openFileIcon} alt="Open File" className="action-icon" />
                                Open File
                            </button>

                            <button className="action-btn" onClick={handleOpenFolder}>
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
                        {/*empty for now*/}
                    </div>
                </div>
            </div>

            <Footer />

            {/* Modal */}
            {isModalOpen && (
                <NewFileModal
                    onCreate={handleCreateNewFile}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}

export default WelcomePage;

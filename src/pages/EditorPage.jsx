import { useEffect, useState } from 'react';
import { useFile } from '../context/FileContext';
import Editor from '@monaco-editor/react';

import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import TerminalComponent from '../components/Terminal';
import Tabs from '../components/Tabs';

import '../styles/EditorPage.css';

function EditorPage() {
    const { currentFile } = useFile();
    const [code, setCode] = useState('');
    const [showTerminal, setShowTerminal] = useState(false);

    useEffect(() => {
        if (currentFile?.fileContent) {
            setCode(currentFile.fileContent);
        }
    }, [currentFile]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === '`') {
                e.preventDefault();
                setShowTerminal(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="editor-wrapper">
            <Header />

            <div className="body-layout">
                <Sidebar />

                <div className="editor-body">
                    <div className="editor-main">
                        {currentFile?.fileName ? (
                            <>
                                {/* Tab bar */}
                                <Tabs />

                                <div className="code-section" style={{ height: showTerminal ? 'calc(100% - 250px)' : '100%' }}>
                                    <Editor
                                        height="100%"
                                        theme="vs-dark"
                                        defaultLanguage="javascript"
                                        value={code}
                                        onChange={(newCode) => setCode(newCode)}
                                        options={{
                                            fontSize: 14,
                                            minimap: { enabled: false },
                                            scrollBeyondLastLine: false
                                        }}
                                    />
                                </div>

                                {showTerminal && (
                                    <TerminalComponent />
                                )}
                            </>
                        ) : (
                            <div className="no-file-message">
                                <h2>No file is currently open.</h2>
                                <p>Create or open a file.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default EditorPage;

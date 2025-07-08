import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer';
import TerminalComponent from '../components/Terminal';
import Editor from '@monaco-editor/react';
import '../styles/EditorPage.css';
import { useRef, useState, useEffect } from 'react';

function EditorPage() {
    const editorRef = useRef(null);
    const [showTerminal, setShowTerminal] = useState(true);

    const terminalHeight = 250; // height of terminal when visible
    const headerHeight = 60;
    const footerHeight = 30;

    // Mount Monaco reference
    const handleEditorMount = (editor, monaco) => {
        editorRef.current = editor;
        console.log('Monaco editor mounted:', editor);
    };

    // Command palette trigger
    const openCommandPalette = () => {
        if (editorRef.current) {
            editorRef.current.focus();
            editorRef.current.trigger('keyboard', 'editor.action.quickCommand', null);
        }
    };

    // Ctrl + ` to toggle terminal
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

    // Adjust editor height dynamically
    const editorHeight = `calc(100vh - ${headerHeight + footerHeight + (showTerminal ? terminalHeight : 0)}px)`;

    return (
        <div className="editor-wrapper">
            <Header onSearchClick={openCommandPalette} />

            <div className="editor-body">
                <Sidebar />

                <div className="editor-main">
                    <Editor
                        height={editorHeight}
                        defaultLanguage="javascript"
                        defaultValue="// Start coding here"
                        theme="vs-dark"
                        onMount={handleEditorMount}
                    />
                    {showTerminal && <TerminalComponent />}
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default EditorPage;

// src/pages/EditorPage.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useFile } from "../context/FileContext";
import { useSidebar } from "../context/SidebarContext";
import Editor from "@monaco-editor/react";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SidebarPanel from "../components/SidebarPanel";
import Footer from "../components/Footer";
import TerminalComponent from "../components/Terminal";
import Tabs from "../components/Tabs";

import "../styles/EditorPage.css";

import getLangInfo from "../utils/getLanguageFromFilename";

function EditorPage() {
  const {
    currentFile,
    setCurrentFile,
    updateCurrentFileContent,
    saveCurrentFile,
  } = useFile();
  const { isVisible } = useSidebar();
  const [code, setCode] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);

  // Reference to terminal execute function
  const terminalExecuteRef = useRef(null);

  // When currentFile changes, set code to its content
  useEffect(() => {
    if (currentFile) {
      setCode(currentFile.fileContent ?? "");
    } else {
      setCode("");
    }
  }, [currentFile]);

  // Run current file (Ctrl+F5 → terminal)
  const runCurrentFile = () => {
    if (!currentFile) return;

    // Always ensure terminal is open
    if (!showTerminal) {
      setShowTerminal(true);
      // Delay to allow Terminal to mount
      setTimeout(() => {
        if (terminalExecuteRef.current) {
          terminalExecuteRef.current(
            currentFile.fileName,
            currentFile.fileContent
          );
        }
      }, 200);
    } else {
      // Terminal already open → run immediately
      if (terminalExecuteRef.current) {
        terminalExecuteRef.current(
          currentFile.fileName,
          currentFile.fileContent
        );
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Toggle terminal with Ctrl+`
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setShowTerminal((prev) => !prev);
        return;
      }

      // Toggle sidebar with Ctrl+B (optional)
      if (e.ctrlKey && e.key.toLowerCase() === "b") {
        e.preventDefault();
        return;
      }

      // Save (Ctrl+S / Cmd+S)
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (modKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        e.stopPropagation();
        if (currentFile) {
          saveCurrentFile().then((ok) => {
            if (ok) {
              console.log("Saved", currentFile.fileName);
            } else {
              console.warn("Save failed for", currentFile.fileName);
            }
          });
        }
      }

      // Run (Ctrl+F5)
      if (e.ctrlKey && e.key === "F5") {
        e.preventDefault();
        runCurrentFile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFile, saveCurrentFile, showTerminal]);

  // Editor change
  const handleEditorChange = useCallback(
    (newCode) => {
      setCode(newCode ?? "");
      if (currentFile && updateCurrentFileContent) {
        updateCurrentFileContent(newCode ?? "", true);
      } else if (currentFile && setCurrentFile) {
        setCurrentFile({
          ...currentFile,
          fileContent: newCode ?? "",
          modified: true,
        });
      }
    },
    [currentFile, updateCurrentFileContent, setCurrentFile]
  );

  // Use Monaco mapping for syntax highlighting
  const monacoLanguage = currentFile?.fileName
    ? getLangInfo(currentFile.fileName).monacoLang
    : "plaintext";

  return (
    <div className="editor-wrapper">
      <Header />

      <div className="body-layout">
        <Sidebar />
        {isVisible && <SidebarPanel />}

        <div className="editor-body">
          <div className="editor-main">
            {currentFile?.fileName ? (
              <>
                <Tabs />

                <div
                  className="code-section"
                  style={{
                    height: showTerminal ? "calc(100% - 250px)" : "100%",
                  }}
                >
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language={monacoLanguage}
                    value={code}
                    onChange={handleEditorChange}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>

                {showTerminal && (
                  <TerminalComponent
                    refExecute={(fn) => (terminalExecuteRef.current = fn)}
                  />
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

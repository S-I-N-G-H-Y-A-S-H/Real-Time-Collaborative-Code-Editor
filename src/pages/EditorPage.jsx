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
    updateFileContent,   // ✅ correct fn
    saveFile,            // ✅ correct fn
  } = useFile();

  const { isVisible } = useSidebar();
  const [code, setCode] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);

  const terminalExecuteRef = useRef(null);

  useEffect(() => {
    if (currentFile) {
      setCode(currentFile.fileContent ?? "");
    } else {
      setCode("");
    }
  }, [currentFile]);

  const runCurrentFile = () => {
    if (!currentFile) return;

    if (!showTerminal) {
      setShowTerminal(true);
      setTimeout(() => {
        if (terminalExecuteRef.current) {
          terminalExecuteRef.current(
            currentFile.fileName,
            currentFile.fileContent
          );
        }
      }, 200);
    } else {
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
      // Toggle terminal
      if (e.ctrlKey && e.key === "`") {
        e.preventDefault();
        setShowTerminal((prev) => !prev);
        return;
      }

      // Save (Ctrl+S / Cmd+S)
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      if (modKey && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        e.stopPropagation();
        if (currentFile) {
          saveFile(currentFile).then((ok) => {
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
  }, [currentFile, saveFile, showTerminal]);

  // Editor change → mark dirty
  const handleEditorChange = useCallback(
    (newCode) => {
      setCode(newCode ?? "");
      if (currentFile) {
        updateFileContent(currentFile.fileHandle, newCode ?? "");
      }
    },
    [currentFile, updateFileContent]
  );

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

// src/pages/EditorPage.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

import { useFile } from "../context/FileContext";
import { useSidebar } from "../context/SidebarContext";
import { useEditor } from "../context/EditorContext";
import { useRoomSync } from "../context/RoomSyncContext";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SidebarPanel from "../components/SidebarPanel";
import Footer from "../components/Footer";
import TerminalComponent from "../components/Terminal";
import Tabs from "../components/Tabs";

import getLangInfo from "../utils/getLanguageFromFilename";

import "../styles/EditorPage.css";

function EditorPage() {
  const navigate = useNavigate();
  const location = useLocation();

  /* =========================
     CONTEXTS
     ========================= */

  const { currentFile, updateFileContent, saveFile } = useFile();
  const { isVisible } = useSidebar();
  const { setEditor } = useEditor();

  const { roomId, currentView } = useRoomSync();

  /* =========================
     LOCAL STATE
     ========================= */

  const [code, setCode] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);

  const editorRef = useRef(null);
  const terminalExecuteRef = useRef(null);
  const terminalResetRef = useRef(null);

  /* =========================
     VIEW GUARD (IMPORTANT)
     ========================= */

  // If server says editor is NOT active, force back to welcome
  useEffect(() => {
    if (!roomId) return;

    if (currentView !== "editor") {
      navigate("/welcome", { replace: true });
    }
  }, [currentView, roomId, navigate]);

  /* =========================
     FILE → EDITOR SYNC
     ========================= */

  useEffect(() => {
    if (currentFile) {
      setCode(currentFile.fileContent ?? "");
    } else {
      setCode("");
    }
  }, [currentFile]);

  /* =========================
     TERMINAL ACTIONS
     ========================= */

  const runCurrentFile = () => {
    if (!currentFile) return;

    if (!showTerminal) {
      setShowTerminal(true);
      setTimeout(() => {
        terminalExecuteRef.current?.(
          currentFile.fileName,
          currentFile.fileContent
        );
      }, 200);
    } else {
      terminalExecuteRef.current?.(
        currentFile.fileName,
        currentFile.fileContent
      );
    }
  };

  const newTerminal = () => {
    if (!showTerminal) {
      setShowTerminal(true);
    } else {
      terminalResetRef.current?.();
    }
  };

  /* =========================
     KEYBOARD SHORTCUTS
     ========================= */

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Toggle terminal (Ctrl+`)
      if (modKey && e.key === "`") {
        e.preventDefault();
        setShowTerminal((prev) => !prev);
        return;
      }

      // Save (Ctrl+S)
      if (modKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (currentFile) saveFile(currentFile);
        return;
      }

      // Run (Ctrl+F5)
      if (e.ctrlKey && e.key === "F5") {
        e.preventDefault();
        runCurrentFile();
        return;
      }

      // Command Palette (Ctrl+Shift+P)
      if (modKey && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        editorRef.current?.focus();
        editorRef.current?.trigger(
          "source",
          "editor.action.quickCommand"
        );
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFile, saveFile]);

  /* =========================
     EDITOR CHANGE
     ========================= */

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

  /* =========================
     SEARCH / COMMAND PALETTE
     ========================= */

  const handleSearchClick = () => {
    editorRef.current?.focus();
    editorRef.current?.trigger("source", "editor.action.quickCommand");
  };

  /* =========================
     RENDER
     ========================= */

  return (
    <div className="editor-wrapper">
      <Header
        onRunCode={runCurrentFile}
        onNewTerminal={newTerminal}
        onToggleTerminal={() => setShowTerminal((p) => !p)}
        onSearchClick={handleSearchClick}
      />

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
                    height: showTerminal
                      ? "calc(100% - 250px)"
                      : "100%",
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
                    onMount={(editorInstance) => {
                      setEditor(editorInstance);
                      editorRef.current = editorInstance;
                    }}
                  />
                </div>

                {showTerminal && (
                  <TerminalComponent
                    refExecute={(fn) => (terminalExecuteRef.current = fn)}
                    refReset={(fn) => (terminalResetRef.current = fn)}
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

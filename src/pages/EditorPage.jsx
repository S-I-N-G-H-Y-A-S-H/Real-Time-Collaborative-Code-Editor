// src/pages/EditorPage.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

import { useFile } from "../context/FileContext";
import { useProject } from "../context/ProjectContext";
import { useSidebar } from "../context/SidebarContext";
import { useEditor } from "../context/EditorContext";
import { useRoomSync } from "../context/RoomSyncContext";

import socketService from "../services/socketService"; // ✅ NEW

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

  /* =========================
     MODE DETECTION
     ========================= */

  const { roomId, currentView } = useRoomSync();
  const isCollaborative = !!roomId;

  /* =========================
     CONTEXTS
     ========================= */

  const fileCtx = useFile();
  const projectCtx = useProject();

  const { isVisible } = useSidebar();
  const { setEditor } = useEditor();

  /* =========================
     NORMALIZED FILE API
     ========================= */

  const currentFile = isCollaborative
    ? projectCtx.activeFile &&
      projectCtx.activeFilePath && {
        fileName: projectCtx.activeFilePath.split("/").pop(),
        filePath: projectCtx.activeFilePath,
        fileContent: projectCtx.activeFile.content,
      }
    : fileCtx.currentFile;

  const saveFile = isCollaborative
    ? () => projectCtx.saveFile?.(projectCtx.activeFilePath)
    : fileCtx.saveFile;

  /* =========================
     LOCAL STATE
     ========================= */

  const [code, setCode] = useState("");
  const [showTerminal, setShowTerminal] = useState(false);

  const editorRef = useRef(null);
  const terminalExecuteRef = useRef(null);
  const terminalResetRef = useRef(null);

  // ✅ Prevent infinite echo
  const isApplyingRemoteChange = useRef(false);

  /* =========================
     VIEW GUARD (COLLAB ONLY)
     ========================= */

  useEffect(() => {
    if (!isCollaborative) return;

    if (currentView !== "editor") {
      navigate("/welcome", { replace: true });
    }
  }, [isCollaborative, currentView, navigate]);

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
     REALTIME: RECEIVE REMOTE EDITS
     ========================= */

  useEffect(() => {
    if (!isCollaborative) return;

    const handleRemoteEdit = ({ filePath, content }) => {
      if (
        !editorRef.current ||
        filePath !== projectCtx.activeFilePath
      ) {
        return;
      }

      isApplyingRemoteChange.current = true;

      const model = editorRef.current.getModel();
      if (model) {
        editorRef.current.executeEdits("remote-edit", [
          {
            range: model.getFullModelRange(),
            text: content,
          },
        ]);
      }

      isApplyingRemoteChange.current = false;
    };

    socketService.onEditorContentUpdate(handleRemoteEdit);

    return () => {
      socketService.offEditorContentUpdate(handleRemoteEdit);
    };
  }, [isCollaborative, projectCtx.activeFilePath]);

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

      if (modKey && e.key === "`") {
        e.preventDefault();
        setShowTerminal((prev) => !prev);
      }

      if (modKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (currentFile) saveFile(currentFile);
      }

      if (e.ctrlKey && e.key === "F5") {
        e.preventDefault();
        runCurrentFile();
      }

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
     EDITOR CHANGE (LOCAL → SOCKET)
     ========================= */

  const handleEditorChange = useCallback(
    (newCode) => {
      if (!currentFile) return;

      setCode(newCode ?? "");

      if (isCollaborative) {
        if (isApplyingRemoteChange.current) return;

        projectCtx.updateFileContent(
          projectCtx.activeFilePath,
          newCode ?? ""
        );

        socketService.emitEditorContentChange({
          roomId,
          filePath: projectCtx.activeFilePath,
          content: newCode ?? "",
        });
      } else {
        fileCtx.updateFileContent(
          currentFile.fileHandle,
          newCode ?? ""
        );
      }
    },
    [
      currentFile,
      isCollaborative,
      projectCtx,
      fileCtx,
      roomId,
    ]
  );

  const monacoLanguage = currentFile?.fileName
    ? getLangInfo(currentFile.fileName).monacoLang
    : "plaintext";

  /* =========================
     SEARCH
     ========================= */

  const handleSearchClick = () => {
    editorRef.current?.focus();
    editorRef.current?.trigger(
      "source",
      "editor.action.quickCommand"
    );
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
                    refExecute={(fn) =>
                      (terminalExecuteRef.current = fn)
                    }
                    refReset={(fn) =>
                      (terminalResetRef.current = fn)
                    }
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
  
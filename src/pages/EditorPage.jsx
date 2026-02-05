// src/pages/EditorPage.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";

import { useFile } from "../context/FileContext";
import { useProject } from "../context/ProjectContext";
import { useSidebar } from "../context/SidebarContext";
import { useEditor } from "../context/EditorContext";
import { useRoomSync } from "../context/RoomSyncContext";

import socketService from "../services/socketService";

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

  const isApplyingRemoteChange = useRef(false);

  // 🧠 execution buffering (FIX)
  const terminalReadyRef = useRef(false);
  const pendingExecutionBuffer = useRef([]);

  /* =========================
     VIEW GUARD
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
    setCode(currentFile?.fileContent ?? "");
  }, [currentFile]);

  /* =========================
     REALTIME EDITOR SYNC
     ========================= */

  useEffect(() => {
    if (!isCollaborative) return;

    const handleRemoteEdit = ({ filePath, content }) => {
      if (!editorRef.current || filePath !== projectCtx.activeFilePath) return;

      isApplyingRemoteChange.current = true;
      const model = editorRef.current.getModel();

      if (model) {
        editorRef.current.executeEdits("remote-edit", [
          { range: model.getFullModelRange(), text: content },
        ]);
      }

      isApplyingRemoteChange.current = false;
    };

    socketService.onEditorContentUpdate(handleRemoteEdit);
    return () => socketService.offEditorContentUpdate();
  }, [isCollaborative, projectCtx.activeFilePath]);

  /* =========================
     EXECUTION OUTPUT SYNC (FIXED)
     ========================= */

  useEffect(() => {
    if (!isCollaborative) return;

    const handleExecutionOutput = (data) => {
      // ensure terminal opens
      if (!showTerminal) setShowTerminal(true);

      const push = (line) => {
        if (terminalReadyRef.current && window.__terminalPrint) {
          window.__terminalPrint(line);
        } else {
          pendingExecutionBuffer.current.push(line);
        }
      };

      if (data.type === "status") {
        push(data.message);
      }

      if (data.type === "result") {
        const { stdout, stderr, compileError } = data.payload;

        if (compileError) push("Compilation Error:");

        stdout?.split(/\r?\n/).forEach((l) => l && push(l));
        stderr?.split(/\r?\n/).forEach((l) => l && push(l));

        if (!stdout && !stderr) push("[No output]");
      }

      if (data.type === "error") {
        push(`Error: ${data.message}`);
      }
    };

    socketService.socket?.on("execution:output", handleExecutionOutput);
    return () =>
      socketService.socket?.off("execution:output", handleExecutionOutput);
  }, [isCollaborative, showTerminal]);

  /* =========================
     FLUSH BUFFER WHEN TERMINAL MOUNTS
     ========================= */

  useEffect(() => {
    if (!showTerminal) return;

    const interval = setInterval(() => {
      if (window.__terminalPrint) {
        terminalReadyRef.current = true;
        pendingExecutionBuffer.current.forEach((l) =>
          window.__terminalPrint(l)
        );
        pendingExecutionBuffer.current = [];
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [showTerminal]);

  /* =========================
     TERMINAL ACTIONS
     ========================= */

  const runCurrentFile = () => {
    if (!currentFile) return;
    setShowTerminal(true);

    if (isCollaborative) {
      socketService.socket?.emit("execution:run", {
        roomId,
        fileName: currentFile.fileName,
        code: currentFile.fileContent,
      });
    } else {
      terminalExecuteRef.current?.(
        currentFile.fileName,
        currentFile.fileContent
      );
    }
  };

  const newTerminal = () => {
    if (!showTerminal) setShowTerminal(true);
    else terminalResetRef.current?.();
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
        setShowTerminal((p) => !p);
      }

      if (modKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (isCollaborative && projectCtx.activeFilePath)
          projectCtx.saveFile(projectCtx.activeFilePath);
        else if (currentFile) fileCtx.saveFile(currentFile);
      }

      if (e.ctrlKey && e.key === "F5") {
        e.preventDefault();
        runCurrentFile();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentFile, isCollaborative]);

  /* =========================
     EDITOR CHANGE
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
        fileCtx.updateFileContent(currentFile.fileHandle, newCode ?? "");
      }
    },
    [currentFile, isCollaborative, projectCtx, fileCtx, roomId]
  );

  const monacoLanguage = currentFile?.fileName
    ? getLangInfo(currentFile.fileName).monacoLang
    : "plaintext";

  /* =========================
     RENDER
     ========================= */

  return (
    <div className="editor-wrapper">
      <Header
        onRunCode={runCurrentFile}
        onNewTerminal={newTerminal}
        onToggleTerminal={() => setShowTerminal((p) => !p)}
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
                    onMount={(e) => {
                      setEditor(e);
                      editorRef.current = e;
                    }}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
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

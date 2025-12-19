// src/components/Header.jsx
import { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import searchIcon from "../assets/search-icon.png";
import { useFile } from "../context/FileContext";
import { useEditor } from "../context/EditorContext";
import { useRoomSync } from "../context/RoomSyncContext";

import ParticipantsDropdown from "./ParticipantsDropdown";
import "../styles/Header.css";

function Header({
  onSearchClick,
  onRunCode,
  onNewTerminal,
  onToggleTerminal,
  onInviteClick,
  onJoinClick,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const headerRef = useRef(null);

  const {
    createNewFileAnywhere,
    openFileFromPicker,
    openFolder,
    saveFile,
    saveFileAs,
    currentFile,
  } = useFile();

  const { editor } = useEditor();
  const { participants } = useRoomSync(); // ✅ REAL participants

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenus = () => setOpenMenu(null);

  /* =========================
     FILE MENU ACTIONS
     ========================= */
  const handleNewFile = async () => {
    await createNewFileAnywhere("untitled.txt");
  };

  const handleOpenFile = async () => {
    await openFileFromPicker();
  };

  const handleOpenFolder = async () => {
    await openFolder();
  };

  const handleSave = async () => {
    if (currentFile) await saveFile(currentFile);
  };

  const handleSaveAs = async () => {
    if (currentFile) await saveFileAs(currentFile);
  };

  /* =========================
     EDIT MENU ACTIONS
     ========================= */
  const handleEditAction = async (action) => {
    if (!editor) return;

    switch (action) {
      case "undo":
        editor.trigger("source", "undo", null);
        break;
      case "redo":
        editor.trigger("source", "redo", null);
        break;
      case "cut": {
        const selection = editor.getSelection();
        const model = editor.getModel();
        if (selection && model) {
          const text = model.getValueInRange(selection);
          await navigator.clipboard.writeText(text);
          editor.executeEdits("cut", [
            { range: selection, text: "", forceMoveMarkers: true },
          ]);
        }
        break;
      }
      case "copy":
        document.execCommand("copy");
        break;
      case "paste": {
        const text = await navigator.clipboard.readText();
        if (text) editor.trigger("keyboard", "type", { text });
        break;
      }
      default:
        break;
    }
  };

  /* =========================
     GLOBAL CLOSE HANDLERS
     ========================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        closeMenus();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") closeMenus();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="header-wrapper" ref={headerRef}>
      {/* LEFT */}
      <div className="left-section">
        <img src={logo} alt="Logo" className="logo-circle" />

        <div className="menu-container">
          {/* File */}
          <div className="menu-item" onClick={() => toggleMenu("file")}>
            File
            {openMenu === "file" && (
              <div className="dropdown">
                <div className="dropdown-item" onClick={handleNewFile}>New File</div>
                <div className="dropdown-item" onClick={handleOpenFile}>Open File</div>
                <div className="dropdown-item" onClick={handleOpenFolder}>Open Folder</div>
                <div className="dropdown-item" onClick={handleSave}>Save</div>
                <div className="dropdown-item" onClick={handleSaveAs}>Save As</div>
              </div>
            )}
          </div>

          {/* Edit */}
          <div className="menu-item" onClick={() => toggleMenu("edit")}>
            Edit
            {openMenu === "edit" && (
              <div className="dropdown">
                <div className="dropdown-item" onClick={() => handleEditAction("undo")}>Undo</div>
                <div className="dropdown-item" onClick={() => handleEditAction("redo")}>Redo</div>
                <div className="dropdown-item" onClick={() => handleEditAction("cut")}>Cut</div>
                <div className="dropdown-item" onClick={() => handleEditAction("copy")}>Copy</div>
                <div className="dropdown-item" onClick={() => handleEditAction("paste")}>Paste</div>
              </div>
            )}
          </div>

          {/* View */}
          <div className="menu-item" onClick={() => toggleMenu("view")}>
            View
            {openMenu === "view" && (
              <div className="dropdown">
                <div
                  className="dropdown-item"
                  onClick={() => {
                    editor?.focus();
                    editor?.trigger("source", "editor.action.quickCommand");
                    closeMenus();
                  }}
                >
                  Command Palette
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    onToggleTerminal?.();
                    closeMenus();
                  }}
                >
                  Terminal
                </div>
              </div>
            )}
          </div>

          {/* Run */}
          <div className="menu-item" onClick={() => toggleMenu("run")}>
            Run
            {openMenu === "run" && (
              <div className="dropdown">
                <div className="dropdown-item" onClick={onRunCode}>Run Code</div>
              </div>
            )}
          </div>

          {/* Terminal */}
          <div className="menu-item" onClick={() => toggleMenu("terminal")}>
            Terminal
            {openMenu === "terminal" && (
              <div className="dropdown">
                <div className="dropdown-item" onClick={onNewTerminal}>New Terminal</div>
                <div className="dropdown-item" onClick={onRunCode}>Run Active File</div>
              </div>
            )}
          </div>

          {/* Help */}
          <div className="menu-item" onClick={() => toggleMenu("help")}>
            Help
            {openMenu === "help" && (
              <div className="dropdown">
                <div className="dropdown-item">Welcome</div>
                <div className="dropdown-item">Documentation</div>
                <div className="dropdown-item">Contact</div>
                <div className="dropdown-item">About</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CENTER */}
      <div className="center-section">
        <div className="search-wrapper" onClick={onSearchClick}>
          <img src={searchIcon} alt="Search" className="search-icon" />
          <input type="text" placeholder="Search" className="search-input" readOnly />
        </div>
      </div>

      {/* RIGHT */}
      <div className="right-section">
        <ParticipantsDropdown participants={participants} />

        <button className="invite-btn" onClick={onInviteClick}>Invite</button>
        <button className="join-btn" onClick={onJoinClick}>Join</button>
      </div>
    </div>
  );
}

export default Header;

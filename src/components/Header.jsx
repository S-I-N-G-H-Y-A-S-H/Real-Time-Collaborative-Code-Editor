// src/components/Header.jsx
import { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.png";
import searchIcon from "../assets/search-icon.png";
import { useFile } from "../context/FileContext";
import { useEditor } from "../context/EditorContext";
import "../styles/Header.css";

import ParticipantsDropdown from "./ParticipantsDropdown";

// design image you uploaded (local path) — transform this to a URL if you want to show it:
// /mnt/data/profile-making-design.jpg
const DESIGN_IMAGE = "/mnt/data/profile-making-design.jpg";

function Header({ onSearchClick, onRunCode, onNewTerminal, onToggleTerminal }) {
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

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenus = () => setOpenMenu(null);

  // File menu actions
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
    if (currentFile) {
      await saveFile(currentFile);
    }
  };

  const handleSaveAs = async () => {
    if (currentFile) {
      await saveFileAs(currentFile);
    }
  };

  // Edit menu actions
  const handleEditAction = async (action) => {
    if (!editor) return;

    switch (action) {
      case "undo":
        editor.trigger("source", "undo", null);
        break;
      case "redo":
        editor.trigger("source", "redo", null);
        break;
      case "cut":
        const selection = editor.getSelection();
        const model = editor.getModel();
        if (selection && model) {
          const text = model.getValueInRange(selection);

          try {
            await navigator.clipboard.writeText(text);
          } catch (err) {
            console.error("Clipboard write failed:", err);
          }

          editor.executeEdits("cut", [
            { range: selection, text: "", forceMoveMarkers: true },
          ]);
        }
        break;
      case "copy":
        document.execCommand("copy");
        break;
      case "paste":
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            editor.trigger("keyboard", "type", { text });
          }
        } catch (err) {
          console.error("Paste failed:", err);
        }
        break;
      default:
        break;
    }
  };

  // Menu actions
  const handleRunCode = () => {
    if (typeof onRunCode === "function") onRunCode();
    closeMenus();
  };

  const handleNewTerminal = () => {
    if (typeof onNewTerminal === "function") onNewTerminal();
    closeMenus();
  };

  // ✅ Close dropdown if clicked outside or press Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        closeMenus();
      }
    };

    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeMenus();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  // Example participants (replace with real-time participants later)
  const exampleParticipants = [
    // current user is automatically shown by ParticipantsDropdown (reads localStorage.user)
    { id: "p1", name: "Alice", isHost: false },
    { id: "p2", name: "Bob", isHost: false },
  ];

  return (
    <div className="header-wrapper" ref={headerRef}>
      {/* Left Section: Logo + Menu */}
      <div className="left-section">
        <img src={logo} alt="Logo" className="logo-circle" />
        <div className="menu-container">
          {/* File */}
          <div
            className="menu-item"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu("file");
            }}
          >
            File
            {openMenu === "file" && (
              <div className="dropdown">
                <div className="dropdown-item" onClick={handleNewFile}>
                  New File
                </div>
                <div className="dropdown-item" onClick={handleOpenFile}>
                  Open File
                </div>
                <div className="dropdown-item" onClick={handleOpenFolder}>
                  Open Folder
                </div>
                <div className="dropdown-item" onClick={handleSave}>
                  Save
                </div>
                <div className="dropdown-item" onClick={handleSaveAs}>
                  Save As
                </div>
              </div>
            )}
          </div>

          {/* Edit */}
          <div
            className="menu-item"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu("edit");
            }}
          >
            Edit
            {openMenu === "edit" && (
              <div className="dropdown">
                <div
                  className="dropdown-item"
                  onClick={() => handleEditAction("undo")}
                >
                  Undo
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => handleEditAction("redo")}
                >
                  Redo
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => handleEditAction("cut")}
                >
                  Cut
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => handleEditAction("copy")}
                >
                  Copy
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => handleEditAction("paste")}
                >
                  Paste
                </div>
              </div>
            )}
          </div>

          {/* View */}
          <div
            className="menu-item"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu("view");
            }}
          >
            View
            {openMenu === "view" && (
              <div className="dropdown">
                <div
                  className="dropdown-item"
                  onClick={() => {
                    if (editor) {
                      editor.focus();
                      editor.trigger("source", "editor.action.quickCommand");
                    }
                    closeMenus();
                  }}
                >
                  Command Palette
                </div>
                <div
                  className="dropdown-item"
                  onClick={() => {
                    if (typeof onToggleTerminal === "function") {
                      onToggleTerminal();
                    }
                    closeMenus();
                  }}
                >
                  Terminal
                </div>
              </div>
            )}
          </div>

          {/* Run */}
          <div
            className="menu-item"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu("run");
            }}
          >
            Run
            {openMenu === "run" && (
              <div className="dropdown">
                <div className="dropdown-item" onClick={handleRunCode}>
                  Run Code
                </div>
              </div>
            )}
          </div>

          {/* Terminal */}
          <div
            className="menu-item"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu("terminal");
            }}
          >
            Terminal
            {openMenu === "terminal" && (
              <div className="dropdown">
                <div className="dropdown-item" onClick={handleNewTerminal}>
                  New Terminal
                </div>
                <div className="dropdown-item" onClick={handleRunCode}>
                  Run Active File
                </div>
              </div>
            )}
          </div>

          {/* Help */}
          <div
            className="menu-item"
            onClick={(e) => {
              e.stopPropagation();
              toggleMenu("help");
            }}
          >
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

      {/* Center Section: Search */}
      <div className="center-section">
        <div
          className="search-wrapper"
          onClick={() => {
            if (typeof onSearchClick === "function") {
              onSearchClick();
            }
          }}
        >
          <img src={searchIcon} alt="Search" className="search-icon" />
          <input
            type="text"
            placeholder="Search"
            className="search-input"
            readOnly
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="right-section">
        {/* Participants dropdown (left of Invite / Join) */}
        <ParticipantsDropdown participants={exampleParticipants} />

        <button className="invite-btn">Invite</button>
        <button className="join-btn">Join</button>
      </div>
    </div>
  );
}

export default Header;

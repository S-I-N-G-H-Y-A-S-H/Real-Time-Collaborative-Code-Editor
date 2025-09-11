// src/components/Header.jsx
import { useState } from "react";
import logo from "../assets/logo.png";
import searchIcon from "../assets/search-icon.png";
import { useFile } from "../context/FileContext";
import "../styles/Header.css";

function Header({ onSearchClick }) {
  const [openMenu, setOpenMenu] = useState(null);

  const {
    createNewFileAnywhere,
    openFileFromPicker,
    openFolder,
    saveFile,
    saveFileAs,
    currentFile,
  } = useFile();

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

  return (
    <div className="header-wrapper" onClick={closeMenus}>
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
                <div className="dropdown-item">Undo</div>
                <div className="dropdown-item">Redo</div>
                <div className="dropdown-item">Cut</div>
                <div className="dropdown-item">Copy</div>
                <div className="dropdown-item">Paste</div>
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
                <div className="dropdown-item">Command Palette</div>
                <div className="dropdown-item">Terminal</div>
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
                <div className="dropdown-item">Run Code</div>
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
                <div className="dropdown-item">New Terminal</div>
                <div className="dropdown-item">Run Active File</div>
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
        <div className="search-wrapper" onClick={onSearchClick}>
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
        <button className="invite-btn">Invite</button>
        <button className="join-btn">Join</button>
      </div>
    </div>
  );
}

export default Header;

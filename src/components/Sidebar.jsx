// src/components/Sidebar.jsx
import { useSidebar } from "../context/SidebarContext";
import { useFile } from "../context/FileContext";
import { useNavigate } from "react-router-dom";

import file from "../assets/file-icon.png";
import search from "../assets/search-icon.png";
import extension from "../assets/extension-icon.png";
import profile from "../assets/profile-icon.png";
import settings from "../assets/settings-icon.png";
import sourceControl from "../assets/source-control-icon.png";
import runAndDebug from "../assets/run-and-debug-icon.png";
import folderIcon from "../assets/open-folder.png";

import collapseIcon from "../assets/collapseIcon.png";
import unCollapseIcon from "../assets/unCollapsed.png";
import newFileIcon from "../assets/newFile.png";
import newFolderIcon from "../assets/newFolder.png";
import refreshIcon from "../assets/refreshExplorer.png";

import { getFileIcon } from "../utils/fileIcons";

import "../styles/Sidebar.css";
import { useState } from "react";

function Sidebar() {
  const { activePanel, setActivePanel } = useSidebar();
  const {
    projectTree,
    openFolder,
    openFileFromTree,
    createNewFile,
    createNewFolder,
    refreshProjectTree,
    currentFile,
    rootFolderName,
    setSelectedFolder,
    selectedFolder,
    dirHandle,
  } = useFile();
  const navigate = useNavigate();

  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [rootCollapsed, setRootCollapsed] = useState(false);

  const sectionsTop = [
    { id: "explorer", icon: file, alt: "File Explorer" },
    { id: "search", icon: search, alt: "Search" },
    { id: "git", icon: sourceControl, alt: "Source Control" },
    { id: "debug", icon: runAndDebug, alt: "Run and Debug" },
    { id: "extensions", icon: extension, alt: "Extensions" },
  ];

  const sectionsBottom = [
    { id: "profile", icon: profile, alt: "User Profile" },
    { id: "settings", icon: settings, alt: "Settings" },
  ];

  const handleClick = (id) => {
    if (activePanel === id) {
      setActivePanel(null);
    } else {
      setActivePanel(id);
    }
  };

  const handleOpenFolder = async () => {
    await openFolder();
    navigate("/editor");
  };

  const toggleFolder = (path) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  // Recursive Renderer for Tree
  const renderTree = (nodes, parentPath = "") => {
    return nodes.map((node) => {
      const fullPath = `${parentPath}/${node.name}`;

      if (node.type === "file") {
        const isActive = currentFile?.fileName === node.name;
        const icon = getFileIcon(node.name);

        return (
          <div
            key={fullPath}
            className={`file-item ${isActive ? "active-file" : ""}`}
            onClick={() => {
              openFileFromTree(node.handle);
              setSelectedFolder(null); // reset folder selection when opening file
            }}
          >
            <img src={icon} alt={`${node.name} icon`} className="file-icon" />
            <span>{node.name}</span>
          </div>
        );
      }

      if (node.type === "folder") {
        const isCollapsed = collapsedFolders[fullPath] || false;
        const isSelected = selectedFolder === node.handle;

        return (
          <div key={fullPath} className="folder-item">
            <div
              className={`folder-header ${isSelected ? "selected-folder" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(fullPath);
                setSelectedFolder(node.handle);
              }}
            >
              <img
                src={isCollapsed ? unCollapseIcon : collapseIcon}
                alt={isCollapsed ? "Expand" : "Collapse"}
                className="folder-toggle-icon"
              />
              <span>{node.name}</span>
            </div>
            {!isCollapsed && node.children?.length > 0 && (
              <div className="folder-children">{renderTree(node.children, fullPath)}</div>
            )}
          </div>
        );
      }

      return null;
    });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        {sectionsTop.map((s) => (
          <img
            key={s.id}
            src={s.icon}
            alt={s.alt}
            className={`sidebar-icon ${activePanel === s.id ? "active" : ""}`}
            onClick={() => handleClick(s.id)}
          />
        ))}
      </div>
      <div className="sidebar-section bottom">
        {sectionsBottom.map((s) => (
          <img
            key={s.id}
            src={s.icon}
            alt={s.alt}
            className={`sidebar-icon ${activePanel === s.id ? "active" : ""}`}
            onClick={() => handleClick(s.id)}
          />
        ))}
      </div>

      {activePanel === "explorer" && (
        <div className="sidebar-expanded">
          {!dirHandle ? (
            <>
              <p className="no-folder-text">You have not yet opened a folder.</p>
              <button className="open-folder-btn" onClick={handleOpenFolder}>
                <img src={folderIcon} alt="Open Folder" className="btn-icon" />
                Open Folder
              </button>
            </>
          ) : (
            <>
              <div className="explorer-header">
                <img
                  src={rootCollapsed ? unCollapseIcon : collapseIcon}
                  alt={rootCollapsed ? "Expand Root" : "Collapse Root"}
                  className="explorer-icon"
                  onClick={() => {
                    setRootCollapsed(!rootCollapsed);
                    setSelectedFolder(dirHandle);
                  }}
                />
                <span className="project-name">{rootFolderName}</span>
                <div className="explorer-actions">
                  <img
                    src={newFileIcon}
                    alt="New File"
                    className="explorer-icon"
                    onClick={createNewFile}
                  />
                  <img
                    src={newFolderIcon}
                    alt="New Folder"
                    className="explorer-icon"
                    onClick={createNewFolder}
                  />
                  <img
                    src={refreshIcon}
                    alt="Refresh"
                    className="explorer-icon"
                    onClick={refreshProjectTree}
                  />
                </div>
              </div>

              {!rootCollapsed && (
                <div
                  className="project-tree"
                  onClick={() => {
                    setSelectedFolder(dirHandle);
                  }}
                >
                  {projectTree.length > 0 ? (
                    renderTree(projectTree)
                  ) : (
                    <p className="no-files-text">This folder is empty.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Sidebar;

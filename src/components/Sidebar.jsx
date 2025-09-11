// src/components/Sidebar.jsx
import { useSidebar } from "../context/SidebarContext";
import { useFile } from "../context/FileContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

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

import "../styles/Sidebar.css";
import NewItemModal from "./NewItemModal";
import ProjectTree from "./ProjectTree";

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
    dirHandle,
    renameItem,
    deleteItem,
  } = useFile();
  const navigate = useNavigate();

  const [rootCollapsed, setRootCollapsed] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

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

  const handleConfirm = async (name) => {
    if (modalType === "file") {
      await createNewFile(name, selectedItem); // ✅ use createNewFile (tree-specific)
    } else if (modalType === "folder") {
      await createNewFolder(name, selectedItem);
    }
    setModalType(null);
  };

  return (
    <div className="sidebar">
      {/* Top Section (icons) */}
      <div className="sidebar-section">
        {sectionsTop.map((s) => (
          <img
            key={s.id}
            src={s.icon}
            alt={s.alt}
            className={`sidebar-icon ${activePanel === s.id ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === s.id ? null : s.id)}
          />
        ))}
      </div>

      {/* Bottom Section (icons) */}
      <div className="sidebar-section bottom">
        {sectionsBottom.map((s) => (
          <img
            key={s.id}
            src={s.icon}
            alt={s.alt}
            className={`sidebar-icon ${activePanel === s.id ? "active" : ""}`}
            onClick={() => setActivePanel(activePanel === s.id ? null : s.id)}
          />
        ))}
      </div>

      {/* Explorer Panel */}
      {activePanel === "explorer" && (
        <div className="sidebar-expanded">
          {!dirHandle ? (
            <>
              <p className="no-folder-text">You have not yet opened a folder.</p>
              <button className="open-folder-btn" onClick={openFolder}>
                <img src={folderIcon} className="btn-icon" /> Open Folder
              </button>
            </>
          ) : (
            <>
              {/* Root Header */}
              <div className="explorer-header">
                <img
                  src={rootCollapsed ? unCollapseIcon : collapseIcon}
                  className="explorer-icon"
                  onClick={() => setRootCollapsed(!rootCollapsed)}
                />
                <span
                  className={`project-name ${
                    selectedItem?.type === "root" ? "selected" : ""
                  }`}
                  onClick={() =>
                    setSelectedItem({
                      type: "root",
                      path: rootFolderName,
                      name: rootFolderName,
                    })
                  }
                >
                  {rootFolderName}
                </span>
                <div className="explorer-actions">
                  <img
                    src={newFileIcon}
                    className="explorer-icon"
                    onClick={() => setModalType("file")}
                  />
                  <img
                    src={newFolderIcon}
                    className="explorer-icon"
                    onClick={() => setModalType("folder")}
                  />
                  <img
                    src={refreshIcon}
                    className="explorer-icon"
                    onClick={refreshProjectTree}
                  />
                </div>
              </div>

              {/* Tree */}
              {!rootCollapsed && (
                <ProjectTree
                  projectTree={projectTree}
                  currentFile={currentFile}
                  selectedItem={selectedItem}
                  setSelectedItem={setSelectedItem}
                  openFileFromTree={openFileFromTree}
                  renameItem={renameItem}
                  deleteItem={deleteItem}
                  rootFolderName={rootFolderName}
                  refreshProjectTree={refreshProjectTree}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* Modal for New File/Folder */}
      {modalType && (
        <NewItemModal
          type={modalType}
          onConfirm={handleConfirm}
          onCancel={() => setModalType(null)}
        />
      )}
    </div>
  );
}

export default Sidebar;

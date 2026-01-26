// src/components/Sidebar.jsx
import { useState, useMemo } from "react";
import { useSidebar } from "../context/SidebarContext";
import { useFile } from "../context/FileContext";
import { useProject } from "../context/ProjectContext";

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
import ProfileButton from "./ProfileButton";

function Sidebar() {
  const { activePanel, setActivePanel } = useSidebar();

  const fileCtx = useFile();
  const projectCtx = useProject();

  /**
   * 🔑 MODE DETECTION
   */
  const isCollaborative = Boolean(projectCtx.project?.id);

  /**
   * ======================
   * SIDEBAR SOURCE ADAPTER
   * ======================
   */
  const sidebarSource = useMemo(() => {
    if (isCollaborative) {
      return {
        // 🚀 COLLABORATIVE MODE (DB-backed, virtual folders)
        projectTree: projectCtx.project.tree || [],
        currentFile: projectCtx.activeFile,
        rootFolderName:
          projectCtx.project.name || "Collaborative Project",
        canOpenFolder: false,

        openFolder: () => {},
        openFile: (node) => projectCtx.openFile(node.path),

        createFile: async (name, selectedItem) => {
          let basePath = "";

          if (selectedItem?.type === "folder") {
            basePath = selectedItem.path;
          }

          const filePath = basePath
            ? `${basePath}/${name}`
            : name;

          await projectCtx.createFile(filePath);
        },

        // ✅ VIRTUAL FOLDER CREATION
        createFolder: async (name, selectedItem) => {
          let basePath = "";

          if (selectedItem?.type === "folder") {
            basePath = selectedItem.path;
          }

          const folderPath = basePath
            ? `${basePath}/${name}`
            : name;

          projectCtx.createVirtualFolder(folderPath);
        },

        renameItem: async (oldPath, newName, type) => {
        const normalizedOldPath = oldPath.startsWith("/")
          ? oldPath.slice(1)
          : oldPath;

        await projectCtx.renameItem(normalizedOldPath, newName, type);
      },

        deleteItem: async () => {},   // next step
        refreshTree: () => {},        // optional later
      };
    }

    // ✅ LOCAL FILESYSTEM MODE (unchanged)
    return {
      projectTree: fileCtx.projectTree,
      currentFile: fileCtx.currentFile,
      rootFolderName: fileCtx.rootFolderName,
      canOpenFolder: !fileCtx.dirHandle,

      openFolder: fileCtx.openFolder,
      openFile: (node) => fileCtx.openFileFromTree(node.handle),
      createFile: fileCtx.createNewFile,
      createFolder: fileCtx.createNewFolder,
      renameItem: fileCtx.renameItem,
      deleteItem: fileCtx.deleteItem,
      refreshTree: fileCtx.refreshProjectTree,
    };
  }, [isCollaborative, fileCtx, projectCtx]);

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
    { id: "settings", icon: settings, alt: "Settings" },
  ];

  const handleConfirm = async (name) => {
    if (modalType === "file") {
      await sidebarSource.createFile(name, selectedItem);
    } else if (modalType === "folder") {
      await sidebarSource.createFolder(name, selectedItem);
    }
    setModalType(null);
  };

  return (
    <div className="sidebar">
      {/* Top Icons */}
      <div className="sidebar-section">
        {sectionsTop.map((s) => (
          <img
            key={s.id}
            src={s.icon}
            alt={s.alt}
            className={`sidebar-icon ${
              activePanel === s.id ? "active" : ""
            }`}
            onClick={() =>
              setActivePanel(activePanel === s.id ? null : s.id)
            }
          />
        ))}
      </div>

      {/* Bottom Icons */}
      <div className="sidebar-section bottom">
        <ProfileButton icon={profile} />
        {sectionsBottom.map((s) => (
          <img
            key={s.id}
            src={s.icon}
            alt={s.alt}
            className={`sidebar-icon ${
              activePanel === s.id ? "active" : ""
            }`}
            onClick={() =>
              setActivePanel(activePanel === s.id ? null : s.id)
            }
          />
        ))}
      </div>

      {/* Explorer Panel */}
      {activePanel === "explorer" && (
        <div className="sidebar-expanded">
          {sidebarSource.canOpenFolder ? (
            <>
              <p className="no-folder-text">
                You have not yet opened a folder.
              </p>
              <button
                className="open-folder-btn"
                onClick={sidebarSource.openFolder}
              >
                <img src={folderIcon} className="btn-icon" /> Open Folder
              </button>
            </>
          ) : (
            <>
              <div className="explorer-header">
                <img
                  src={rootCollapsed ? unCollapseIcon : collapseIcon}
                  className="explorer-icon"
                  onClick={() => setRootCollapsed(!rootCollapsed)}
                />

                <span className="project-name">
                  {sidebarSource.rootFolderName}
                </span>

                <div className="explorer-actions">
                  <img
                    src={newFileIcon}
                    className="explorer-icon"
                    onClick={() => setModalType("file")}
                  />

                  {/* ✅ FOLDER ICON NOW ENABLED */}
                  <img
                    src={newFolderIcon}
                    className="explorer-icon"
                    onClick={() => setModalType("folder")}
                  />

                  <img
                    src={refreshIcon}
                    className="explorer-icon"
                    onClick={sidebarSource.refreshTree}
                  />
                </div>
              </div>

              {!rootCollapsed && (
                <ProjectTree
                  projectTree={sidebarSource.projectTree}
                  currentFile={sidebarSource.currentFile}
                  selectedItem={selectedItem}
                  setSelectedItem={setSelectedItem}
                  onOpenFile={sidebarSource.openFile}
                  onRenameItem={sidebarSource.renameItem}
                  onDeleteItem={sidebarSource.deleteItem}
                  rootFolderName={sidebarSource.rootFolderName}
                />
              )}
            </>
          )}
        </div>
      )}

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

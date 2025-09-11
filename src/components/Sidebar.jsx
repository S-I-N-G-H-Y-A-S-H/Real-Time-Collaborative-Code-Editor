// src/components/Sidebar.jsx
import { useSidebar } from "../context/SidebarContext";
import { useFile } from "../context/FileContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

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
import NewItemModal from "./NewItemModal";

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

  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [rootCollapsed, setRootCollapsed] = useState(false);
  const [modalType, setModalType] = useState(null);

  const [selectedItem, setSelectedItem] = useState(null);
  const [editingPath, setEditingPath] = useState(null);
  const [tempName, setTempName] = useState("");
  const [contextMenu, setContextMenu] = useState(null);

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

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedItem) return;
      if (e.key === "F2") {
        setEditingPath(selectedItem.path);
        setTempName(selectedItem.name);
      } else if (e.key === "Delete") {
        deleteItem(selectedItem.path, selectedItem.type);
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    const handleClickOutside = () => setContextMenu(null);
    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [selectedItem, deleteItem]);

  const toggleFolder = (path) => {
    setCollapsedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleConfirm = async (name) => {
    if (modalType === "file") {
      await createNewFile(name, selectedItem);
    } else if (modalType === "folder") {
      await createNewFolder(name, selectedItem);
    }
    setModalType(null);
  };

  const handleRenameSubmit = async (node, fullPath) => {
    const newName = tempName?.trim();
    if (!newName || newName === node.name) {
      setEditingPath(null);
      setTempName("");
      return;
    }
    const ok = await renameItem(fullPath, newName, node.type);
    if (ok) {
      setSelectedItem({ ...node, name: newName, path: fullPath.replace(node.name, newName) });
    }
    setEditingPath(null);
    setTempName("");
  };

  const handleContextMenu = (e, node, fullPath) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedItem({ ...node, path: fullPath });
    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      item: { ...node, path: fullPath },
    });
  };

  const renderTree = (nodes, parentPath = "") =>
    nodes.map((node) => {
      const fullPath = `${parentPath}/${node.name}`;

      if (node.type === "file") {
        const isActive = currentFile?.fileName === node.name;
        return (
          <div
            key={fullPath}
            className={`file-item ${isActive ? "active-file" : ""} ${
              selectedItem?.path === fullPath ? "selected" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem({ ...node, type: "file", path: fullPath });
              openFileFromTree(node.handle);
            }}
            onContextMenu={(e) => handleContextMenu(e, node, fullPath)}
          >
            {editingPath === fullPath ? (
              <input
                value={tempName}
                autoFocus
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => handleRenameSubmit(node, fullPath)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleRenameSubmit(node, fullPath);
                  if (e.key === "Escape") {
                    setEditingPath(null);
                    setTempName("");
                  }
                }}
              />
            ) : (
              <>
                <img src={getFileIcon(node.name)} className="file-icon" />
                <span>{node.name}</span>
              </>
            )}
          </div>
        );
      }

      if (node.type === "folder") {
        const isCollapsed = collapsedFolders[fullPath] || false;
        const isSelected = selectedItem?.path === fullPath;
        return (
          <div key={fullPath} className={`folder-item ${isSelected ? "selected" : ""}`}>
            <div
              className="folder-header"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedItem({ ...node, type: "folder", path: fullPath });
              }}
              onContextMenu={(e) => handleContextMenu(e, node, fullPath)}
            >
              <img
                src={isCollapsed ? unCollapseIcon : collapseIcon}
                className="folder-toggle-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(fullPath);
                }}
              />
              {editingPath === fullPath ? (
                <input
                  value={tempName}
                  autoFocus
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => handleRenameSubmit(node, fullPath)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRenameSubmit(node, fullPath);
                    if (e.key === "Escape") {
                      setEditingPath(null);
                      setTempName("");
                    }
                  }}
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    toggleFolder(fullPath);
                  }}
                >
                  {node.name}
                </span>
              )}
            </div>
            {!isCollapsed && node.children?.length > 0 && (
              <div className="folder-children">{renderTree(node.children, fullPath)}</div>
            )}
          </div>
        );
      }
    });

  return (
    <div className="sidebar">
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
              <div className="explorer-header">
                <img
                  src={rootCollapsed ? unCollapseIcon : collapseIcon}
                  className="explorer-icon"
                  onClick={() => setRootCollapsed(!rootCollapsed)}
                />
                <span
                  className={`project-name ${selectedItem?.type === "root" ? "selected" : ""}`}
                  onClick={() => setSelectedItem({ type: "root", path: rootFolderName, name: rootFolderName })}
                >
                  {rootFolderName}
                </span>
                <div className="explorer-actions">
                  <img src={newFileIcon} className="explorer-icon" onClick={() => setModalType("file")} />
                  <img src={newFolderIcon} className="explorer-icon" onClick={() => setModalType("folder")} />
                  <img src={refreshIcon} className="explorer-icon" onClick={refreshProjectTree} />
                </div>
              </div>
              {!rootCollapsed && (
                <div
                  className="project-tree"
                  onClick={(e) => {
                    if (e.target.classList.contains("project-tree")) {
                      setSelectedItem({ type: "root", path: rootFolderName, name: rootFolderName });
                    }
                  }}
                >
                  {renderTree(projectTree)}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {modalType && <NewItemModal type={modalType} onConfirm={handleConfirm} onCancel={() => setModalType(null)} />}

      {contextMenu && (
        <ul className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <li
            onClick={() => {
              setEditingPath(contextMenu.item.path);
              setTempName(contextMenu.item.name);
              setContextMenu(null);
            }}
          >
            Rename <span className="shortcut">F2</span>
          </li>
          <li
            onClick={() => {
              deleteItem(contextMenu.item.path, contextMenu.item.type);
              setContextMenu(null);
            }}
          >
            Delete <span className="shortcut">Del</span>
          </li>
        </ul>
      )}
    </div>
  );
}

export default Sidebar;

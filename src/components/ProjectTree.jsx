// src/components/ProjectTree.jsx
import { useState, useEffect } from "react";
import { getFileIcon } from "../utils/fileIcons";

import collapseIcon from "../assets/collapseIcon.png";
import unCollapseIcon from "../assets/unCollapsed.png";

import "../styles/Sidebar.css";

function ProjectTree({
  projectTree,
  currentFile,
  selectedItem,
  setSelectedItem,
  openFileFromTree,
  renameItem,
  deleteItem,
  rootFolderName,
}) {
  const [collapsedFolders, setCollapsedFolders] = useState({});
  const [editingPath, setEditingPath] = useState(null);
  const [tempName, setTempName] = useState("");
  const [contextMenu, setContextMenu] = useState(null);

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

  const handleRenameSubmit = async (node, fullPath) => {
    const newName = tempName?.trim();
    if (!newName || newName === node.name) {
      setEditingPath(null);
      setTempName("");
      return;
    }
    const ok = await renameItem(fullPath, newName, node.type);
    if (ok) {
      setSelectedItem({
        ...node,
        name: newName,
        path: fullPath.replace(node.name, newName),
      });
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

  const renderTree = (nodes = [], parentPath = "") =>
    nodes.map((node) => {
      const fullPath = `${parentPath}/${node.name}`;

      if (node.type === "file") {
        const isActive = currentFile?.fileName === node.name;
        return (
          <div
            key={fullPath}
            className={`file-item ${isActive ? "active-file" : ""} ${
              selectedItem?.path === fullPath && editingPath !== fullPath
                ? "selected"
                : ""
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
          <div
            key={fullPath}
            className={`folder-item ${
              isSelected && editingPath !== fullPath ? "selected" : ""
            }`}
          >
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
            {!isCollapsed &&
              Array.isArray(node.children) &&
              node.children.length > 0 && (
                <div className="folder-children">
                  {renderTree(node.children, fullPath)}
                </div>
              )}
          </div>
        );
      }

      return null;
    });

  return (
    <>
      <div
        className="project-tree"
        onClick={(e) => {
          if (e.target.classList.contains("project-tree")) {
            setSelectedItem({
              type: "root",
              path: rootFolderName,
              name: rootFolderName,
            });
          }
        }}
      >
        {Array.isArray(projectTree) && renderTree(projectTree)}
      </div>

      {contextMenu && (
        <ul
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
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
    </>
  );
}

export default ProjectTree;

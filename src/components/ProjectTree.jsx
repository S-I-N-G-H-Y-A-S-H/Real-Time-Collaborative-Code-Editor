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
  onOpenFile,
  onRenameItem,
  onDeleteItem,
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
      }

      if (e.key === "Delete") {
        onDeleteItem(selectedItem);
        setSelectedItem(null);
      }
    };

    const handleClickOutside = () => setContextMenu(null);

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("click", handleClickOutside);
    };
  }, [selectedItem, onDeleteItem]);

  const toggleFolder = (path) => {
    setCollapsedFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const submitRename = async (node, fullPath) => {
    const newName = tempName.trim();
    if (!newName || newName === node.name) {
      setEditingPath(null);
      setTempName("");
      return;
    }

    await onRenameItem(fullPath, newName, node.type);

    setSelectedItem({
      ...node,
      name: newName,
      path: fullPath.replace(node.name, newName),
    });

    setEditingPath(null);
    setTempName("");
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
              selectedItem?.path === fullPath ? "selected" : ""
            }`}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem({ ...node, path: fullPath });
              onOpenFile(node);
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setSelectedItem({ ...node, path: fullPath });
              setContextMenu({ x: e.pageX, y: e.pageY, item: node, path: fullPath });
            }}
          >
            {editingPath === fullPath ? (
              <input
                autoFocus
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={() => submitRename(node, fullPath)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename(node, fullPath);
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
        const isCollapsed = collapsedFolders[fullPath];

        return (
          <div key={fullPath} className="folder-item">
            <div
              className={`folder-header ${
                selectedItem?.path === fullPath ? "selected" : ""
              }`}
              onClick={() => setSelectedItem({ ...node, path: fullPath })}
              onContextMenu={(e) => {
                e.preventDefault();
                setSelectedItem({ ...node, path: fullPath });
                setContextMenu({ x: e.pageX, y: e.pageY, item: node, path: fullPath });
              }}
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
                  autoFocus
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  onBlur={() => submitRename(node, fullPath)}
                />
              ) : (
                <span>{node.name}</span>
              )}
            </div>

            {!isCollapsed && node.children && (
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
              setEditingPath(contextMenu.path);
              setTempName(contextMenu.item.name);
              setContextMenu(null);
            }}
          >
            Rename <span className="shortcut">F2</span>
          </li>
          <li
            onClick={() => {
              onDeleteItem({ ...contextMenu.item, path: contextMenu.path });
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

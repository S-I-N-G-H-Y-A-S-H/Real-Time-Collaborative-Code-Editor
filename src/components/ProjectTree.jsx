// src/components/ProjectTree.jsx
import { useState, useEffect } from "react";
import { useFile } from "../context/FileContext";
import { getFileIcon } from "../utils/fileIcons";
import collapseIcon from "../assets/collapseIcon.png";
import unCollapseIcon from "../assets/unCollapsed.png";
import "../styles/ProjectTree.css";

function ProjectTree() {
  const { projectTree, openFileFromTree, renameItem, deleteItem } = useFile();
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingPath, setEditingPath] = useState(null);
  const [tempName, setTempName] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedItem) return;
      if (e.key === "F2") {
        setEditingPath(selectedItem.path);
        setTempName(selectedItem.name);
      } else if (e.key === "Delete") {
        deleteItem(selectedItem.handle);
        setSelectedItem(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, deleteItem]);

  const toggleCollapse = (path) => {
    setCollapsed((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const handleRenameSubmit = (item) => {
    if (tempName.trim()) {
      renameItem(item.handle, tempName.trim());
    }
    setEditingPath(null);
  };

  const handleContextMenu = (e, item) => {
    e.preventDefault();
    setSelectedItem(item);
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const renderNode = (item, parentPath = "") => {
    const fullPath = `${parentPath}/${item.name}`;
    const isCollapsed = collapsed[fullPath];

    return (
      <div
        key={fullPath}
        className={`tree-node ${selectedItem?.path === fullPath ? "selected" : ""}`}
        onClick={() => setSelectedItem({ ...item, path: fullPath })}
        onContextMenu={(e) => handleContextMenu(e, { ...item, path: fullPath })}
      >
        <div className="tree-item">
          {item.type === "folder" && (
            <img
              src={isCollapsed ? collapseIcon : unCollapseIcon}
              alt="toggle"
              className="collapse-icon"
              onClick={() => toggleCollapse(fullPath)}
            />
          )}

          {editingPath === fullPath ? (
            <input
              value={tempName}
              autoFocus
              onChange={(e) => setTempName(e.target.value)}
              onBlur={() => handleRenameSubmit(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit(item);
                if (e.key === "Escape") setEditingPath(null);
              }}
            />
          ) : (
            <span
              className="tree-label"
              onDoubleClick={() => {
                if (item.type === "file") {
                  openFileFromTree(item.handle);
                } else {
                  toggleCollapse(fullPath);
                }
              }}
            >
              {item.type === "file" && (
                <img src={getFileIcon(item.name)} alt="file" className="file-icon" />
              )}
              {item.name}
            </span>
          )}
        </div>

        {item.type === "folder" && !isCollapsed && (
          <div className="tree-children">
            {item.children?.map((c) => renderNode(c, fullPath))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="project-tree">
      {projectTree.map((item) => renderNode(item))}

      {contextMenu && (
        <ul
          className="context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onMouseLeave={() => setContextMenu(null)}
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
              deleteItem(contextMenu.item.handle);
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

export default ProjectTree;

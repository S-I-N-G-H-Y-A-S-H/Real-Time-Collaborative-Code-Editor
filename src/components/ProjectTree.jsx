// src/components/ProjectTree.jsx
import { useFile } from "../context/FileContext";
import "../styles/ProjectTree.css";


function ProjectTree() {
  const { dirHandle } = useFile();

  return (
    <div className="project-tree">
      {/* Header Section */}
      <div className="project-tree-header">
        <div className="project-tree-header-left">
          {/* Collapse Button */}
          <img
            src="../assets/collapseIcon.png" 
            alt="Collapse"
            className="tree-icon"
          />

          {/* Folder Name */}
          <span className="project-folder-name">
            {dirHandle ? dirHandle.name : "No Folder Opened"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="project-tree-actions">
          <img
            src="../assests/newFile.png" 
            alt="New File"
            className="tree-icon"
          />
          <img
            src="../assests/newFolder.png"//
            alt="New Folder"
            className="tree-icon"
          />
          <img
            src="../assets/refreshExplorer.png" // 
            alt="Refresh"
            className="tree-icon"
          />
        </div>
      </div>

      {/* Placeholder for the file/folder tree */}
      <div className="project-tree-body">
        <p style={{ color: "#bbb", fontSize: "14px" }}>
          Project files will be listed here...
        </p>
      </div>
    </div>
  );
}

export default ProjectTree;

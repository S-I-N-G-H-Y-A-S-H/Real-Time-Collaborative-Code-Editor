// src/components/ProjectTree.jsx
import "../styles/ProjectTree.css";

function ProjectTree() {
  return (
    <div className="project-tree">
      <div className="project-tree-header">
        <div className="project-tree-header-left">
          <span className="project-folder-name">Explorer</span>
        </div>
      </div>

      <div className="project-tree-body">
        <p style={{ color: "#bbb", fontSize: "14px" }}>
          Project files will be listed here...
        </p>
      </div>
    </div>
  );
}

export default ProjectTree;

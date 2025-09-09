import { useSidebar } from "../context/SidebarContext";
import ProjectTree from "./ProjectTree"; // ✅ import your new component
import "../styles/SidebarPanel.css";

function SidebarPanel() {
  const { activePanel } = useSidebar();

  if (!activePanel) return null; // nothing selected

  return (
    <div className="sidebar-panel">
      {activePanel === "explorer" && <ProjectTree />} {/* ✅ show project tree */}
      {activePanel === "search" && <div>🔍 Search feature coming soon...</div>}
      {activePanel === "git" && <div>🌿 Git integration coming soon...</div>}
      {activePanel === "debug" && <div>🐞 Debug tools coming soon...</div>}
      {activePanel === "extensions" && <div>🧩 Extensions marketplace coming soon...</div>}
    </div>
  );
}

export default SidebarPanel;

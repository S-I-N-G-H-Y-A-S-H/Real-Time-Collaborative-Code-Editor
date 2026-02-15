import { useSidebar } from "../context/SidebarContext";
import "../styles/SidebarPanel.css";

function SidebarPanel() {
  const { activePanel } = useSidebar();

  if (activePanel !== "explorer") return null;

  return <div className="sidebar-panel" />;
}

export default SidebarPanel;

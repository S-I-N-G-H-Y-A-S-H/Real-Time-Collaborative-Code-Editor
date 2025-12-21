// src/pages/WelcomePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useFile } from "../context/FileContext";
import { useSidebar } from "../context/SidebarContext";
import { useRoomSync } from "../context/RoomSyncContext";
import { useProject } from "../context/ProjectContext";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SidebarPanel from "../components/SidebarPanel";
import Footer from "../components/Footer";
import InviteJoinModal from "../components/InviteJoinModal";

import logo from "../assets/logo.png";
import openFolderIcon from "../assets/open-folder.png";
import newFileIcon from "../assets/new-file.png";
import openFileIcon from "../assets/open-file.png";

import "../styles/WelcomePage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const HOST_ROOM_KEY = "codesync_hostRoomId";

function WelcomePage() {
  const navigate = useNavigate();

  /* =========================
     CONTEXTS
     ========================= */
  const { openFolder } = useFile();
  const { isVisible } = useSidebar();
  const { roomId, isHost, currentView, joinRoom, syncViewAsHost } =
    useRoomSync();
  const { createProject } = useProject();

  /* =========================
     LOCAL STATE
     ========================= */
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const [hostRoomId, setHostRoomId] = useState(null);
  const [creatingRoom, setCreatingRoom] = useState(false);

  const [showCreateProjectModal, setShowCreateProjectModal] =
    useState(false);
  const [showOpenProjectModal, setShowOpenProjectModal] =
    useState(false);

  const [projectName, setProjectName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  /* =========================
     AUTH GUARD
     ========================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  /* =========================
     RESTORE HOST ROOM
     ========================= */
  useEffect(() => {
    const saved = localStorage.getItem(HOST_ROOM_KEY);
    if (saved) setHostRoomId(saved);
  }, []);

  useEffect(() => {
    if (hostRoomId) localStorage.setItem(HOST_ROOM_KEY, hostRoomId);
    else localStorage.removeItem(HOST_ROOM_KEY);
  }, [hostRoomId]);

  /* =========================
     VIEW SYNC
     ========================= */
  useEffect(() => {
    if (currentView === "editor") {
      navigate("/editor", { replace: true });
    }
  }, [currentView, navigate]);

  /* =========================
     ACTIONS
     ========================= */

  // Open Local Project
  const handleOpenLocalProject = async () => {
    try {
      await openFolder();
      if (roomId && isHost) syncViewAsHost("editor");
      else navigate("/editor");
    } catch (err) {
      console.error(err);
    }
  };

  // Create Collaborative Project
  const handleCreateCollaborativeProject = () => {
    setProjectName("");
    setShowCreateProjectModal(true);
  };

  // 🔑 FIXED: roomId passed to createProject
  const handleConfirmCreateProject = async () => {
    if (!projectName.trim()) return;

    const created = await createProject(projectName.trim(), roomId);
    if (!created) return;

    setShowCreateProjectModal(false);

    if (roomId && isHost) {
      syncViewAsHost("editor");
    } else {
      navigate("/editor");
    }
  };

  // Open Collaborative Project (UI only for now)
  const handleOpenCollaborativeProject = () => {
    setSelectedProjectId(null);
    setShowOpenProjectModal(true);
  };

  /* =========================
     ROOM / INVITE
     ========================= */
  async function createRoomOnServer(name = "Shared Session") {
    try {
      setCreatingRoom(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token || "",
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();
      if (!res.ok) return null;
      return data.roomId || data.room?._id || null;
    } finally {
      setCreatingRoom(false);
    }
  }

  const handleInviteClick = async () => {
    if (hostRoomId) {
      joinRoom(hostRoomId);
      setIsInviteOpen(true);
      return;
    }

    const rid = await createRoomOnServer();
    if (rid) {
      setHostRoomId(rid);
      joinRoom(rid);
      setIsInviteOpen(true);
    }
  };

  const handleJoinClick = () => setIsJoinOpen(true);

  /* =========================
     MOCK PROJECT LIST
     ========================= */
  const mockProjects = ["Sample Project 1", "Sample Project 2"];

  /* =========================
     RENDER
     ========================= */
  return (
    <div className="welcome-wrapper">
      <Header onInviteClick={handleInviteClick} onJoinClick={handleJoinClick} />

      <div className="body-layout">
        <Sidebar />
        {isVisible && <SidebarPanel />}

        <div className="welcome-body">
          <div className="welcome-left">
            <h1 className="welcome-heading">Welcome to Code Sync</h1>

            <div className="start-section">
              <h3 style={{ color: "#74ff4e" }}>Start</h3>

              <button className="action-btn" onClick={handleOpenLocalProject}>
                <img src={openFolderIcon} className="action-icon" />
                Open Local Project
              </button>

              <button
                className="action-btn"
                onClick={handleCreateCollaborativeProject}
              >
                <img src={newFileIcon} className="action-icon" />
                Create Collaborative Project
              </button>

              <button
                className="action-btn"
                onClick={handleOpenCollaborativeProject}
              >
                <img src={openFileIcon} className="action-icon" />
                Open Collaborative Project
              </button>
            </div>
          </div>

          <div className="welcome-logo-center">
            <img src={logo} className="translucent-logo" />
          </div>

          <div className="welcome-right" />
        </div>
      </div>

      <Footer />

      {/* Invite / Join */}
      <InviteJoinModal
        isOpen={isInviteOpen}
        mode="invite"
        roomId={hostRoomId}
        onClose={() => setIsInviteOpen(false)}
      />
      <InviteJoinModal
        isOpen={isJoinOpen}
        mode="join"
        onClose={() => setIsJoinOpen(false)}
      />

      {/* ===== Create Collaborative Project Modal ===== */}
      {showCreateProjectModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateProjectModal(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Create Collaborative Project</h3>

            <input
              type="text"
              placeholder="Project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              autoFocus
            />

            <div className="modal-actions">
              <button onClick={handleConfirmCreateProject}>Create</button>
              <button onClick={() => setShowCreateProjectModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Open Collaborative Project Modal (UI only) ===== */}
      {showOpenProjectModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowOpenProjectModal(false)}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Open Collaborative Project</h3>

            <div className="project-list">
              {mockProjects.map((project) => (
                <div
                  key={project}
                  className={`project-list-item ${
                    selectedProjectId === project ? "selected" : ""
                  }`}
                  onClick={() => setSelectedProjectId(project)}
                  onDoubleClick={() => {
                    setShowOpenProjectModal(false);
                    navigate("/editor");
                  }}
                >
                  {project}
                </div>
              ))}
            </div>

            <div className="modal-actions">
              <button onClick={() => setShowOpenProjectModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WelcomePage;

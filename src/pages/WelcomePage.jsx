// src/pages/WelcomePage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useFile } from "../context/FileContext";
import { useSidebar } from "../context/SidebarContext";
import { useRoomSync } from "../context/RoomSyncContext";

import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import SidebarPanel from "../components/SidebarPanel";
import Footer from "../components/Footer";
import NewFileModal from "../components/NewFileModal";
import InviteJoinModal from "../components/InviteJoinModal";

import logo from "../assets/logo.png";
import newFileIcon from "../assets/new-file.png";
import openFileIcon from "../assets/open-file.png";
import openFolderIcon from "../assets/open-folder.png";

import { createFile, openFile } from "../services/FileSystem";

import "../styles/WelcomePage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";
const HOST_ROOM_KEY = "codesync_hostRoomId";

function WelcomePage() {
  const navigate = useNavigate();

  /* =========================
     CONTEXTS
     ========================= */

  const { openFolder, openFileFromTree } = useFile();
  const { isVisible } = useSidebar();

  const {
    roomId,
    isHost,
    currentView,
    joinRoom,
    syncViewAsHost,
  } = useRoomSync();

  /* =========================
     LOCAL STATE
     ========================= */

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);

  const [hostRoomId, setHostRoomId] = useState(null);
  const [creatingRoom, setCreatingRoom] = useState(false);

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
    if (hostRoomId) {
      localStorage.setItem(HOST_ROOM_KEY, hostRoomId);
    } else {
      localStorage.removeItem(HOST_ROOM_KEY);
    }
  }, [hostRoomId]);

  /* =========================
     VIEW SYNC (CRITICAL)
     ========================= */

  // If host switches to editor, everyone follows
  useEffect(() => {
    if (currentView === "editor") {
      navigate("/editor", { replace: true });
    }
  }, [currentView, navigate]);

  /* =========================
     FILE / FOLDER ACTIONS
     ========================= */

  const handleNewFileClick = () => setIsModalOpen(true);

  const handleCreateNewFile = async (fileName) => {
    setIsModalOpen(false);
    try {
      const fileData = await createFile(fileName);
      if (fileData?.fileHandle) {
        await openFileFromTree(fileData.fileHandle);
      }

      if (roomId && isHost) {
        syncViewAsHost("editor");
      } else {
        navigate("/editor");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenFile = async () => {
    try {
      const fileData = await openFile();
      if (fileData?.fileHandle) {
        await openFileFromTree(fileData.fileHandle);
      }

      if (roomId && isHost) {
        syncViewAsHost("editor");
      } else {
        navigate("/editor");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await openFolder();

      if (roomId && isHost) {
        syncViewAsHost("editor");
      } else {
        navigate("/editor");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchClick = () => {
    if (roomId && isHost) {
      syncViewAsHost("editor");
    }
    navigate("/editor", { state: { openPalette: true } });
  };

  /* =========================
     ROOM / INVITE LOGIC
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
    } catch {
      return null;
    } finally {
      setCreatingRoom(false);
    }
  }

  // Host clicks Invite
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
     RENDER
     ========================= */

  return (
    <div className="welcome-wrapper">
      <Header
        onSearchClick={handleSearchClick}
        onInviteClick={handleInviteClick}
        onJoinClick={handleJoinClick}
      />

      <div className="body-layout">
        <Sidebar />
        {isVisible && <SidebarPanel />}

        <div className="welcome-body">
          <div className="welcome-left">
            <h1 className="welcome-heading">Welcome to Code Sync</h1>

            <div className="start-section">
              <h3 style={{ color: "#74ff4e" }}>Start</h3>

              <button className="action-btn" onClick={handleNewFileClick}>
                <img src={newFileIcon} alt="" className="action-icon" />
                New File
              </button>

              <button className="action-btn" onClick={handleOpenFile}>
                <img src={openFileIcon} alt="" className="action-icon" />
                Open File
              </button>

              <button className="action-btn" onClick={handleOpenFolder}>
                <img src={openFolderIcon} alt="" className="action-icon" />
                Open Folder
              </button>
            </div>
          </div>

          <div className="welcome-logo-center">
            <img src={logo} alt="Logo" className="translucent-logo" />
          </div>

          <div className="welcome-right" />
        </div>
      </div>

      <Footer />

      {isModalOpen && (
        <NewFileModal
          onCreate={handleCreateNewFile}
          onClose={() => setIsModalOpen(false)}
        />
      )}

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
    </div>
  );
}

export default WelcomePage;
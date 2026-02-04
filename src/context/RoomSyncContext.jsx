// src/context/RoomSyncContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import socketService from "../services/socketService";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

const RoomSyncContext = createContext(null);

export function RoomSyncProvider({ children }) {
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Shared app view: "welcome" | "editor"
  const [currentView, setCurrentView] = useState("welcome");

  // Participants
  const [participants, setParticipants] = useState([]);

  // 🔑 Active collaborative project
  const [activeProjectId, setActiveProjectId] = useState(null);

  // 🆕 FILE SYNC PAYLOAD
  const [filesUpdate, setFilesUpdate] = useState(null);

  /* =========================
     SOCKET LISTENERS
     ========================= */

  useEffect(() => {
    // View sync
    socketService.onViewSynced((payload) => {
      if (payload?.page) {
        setCurrentView(payload.page);
      }
    });

    // Participants
    socketService.onParticipantsUpdate((data) => {
      if (Array.isArray(data?.participants)) {
        setParticipants(data.participants);
      }
    });

    // Project activated
    socketService.onProjectActivated((payload) => {
      if (!payload?.projectId) return;

      setActiveProjectId(payload.projectId);
      setCurrentView("editor");
    });

    // 🆕 Files updated (create / rename / delete)
    socketService.onFilesUpdated((payload) => {
      if (
        payload?.projectId &&
        Array.isArray(payload?.files)
      ) {
        setFilesUpdate(payload);
      }
    });

    return () => {
      socketService.offViewSynced();
      socketService.offParticipantsUpdate();
      socketService.offProjectActivated();
      socketService.offFilesUpdated();
    };
  }, []);

  /* =========================
     🔁 FALLBACK FIX (EARLY JOIN)
     ========================= */

  useEffect(() => {
    if (
      roomId &&
      currentView === "editor" &&
      !activeProjectId
    ) {
      (async () => {
        try {
          const token = localStorage.getItem("token");

          const res = await fetch(`${API_BASE}/rooms/join`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ roomId }),
          });

          const data = await res.json();

          if (data?.room?.activeProjectId) {
            setActiveProjectId(data.room.activeProjectId);
          }
        } catch (err) {
          console.error("Room fallback fetch failed:", err);
        }
      })();
    }
  }, [roomId, currentView, activeProjectId]);

  /* =========================
     API
     ========================= */

  const joinRoom = (
    rid,
    host = false,
    projectId = null,
    view = "welcome"
  ) => {
    socketService.joinRoom({ roomId: rid });

    setRoomId(rid);
    setIsHost(host);
    setActiveProjectId(projectId);
    setCurrentView(view);
  };

  const leaveRoom = () => {
    socketService.leaveRoom();

    setRoomId(null);
    setIsHost(false);
    setCurrentView("welcome");
    setParticipants([]);
    setActiveProjectId(null);
    setFilesUpdate(null);
  };

  const syncViewAsHost = (page) => {
    if (!roomId || !isHost) return;

    socketService.syncView({ roomId, page });
    setCurrentView(page);
  };

  return (
    <RoomSyncContext.Provider
      value={{
        roomId,
        isHost,
        currentView,
        participants,
        activeProjectId,
        inRoom: !!roomId,

        // 🆕 expose file updates
        filesUpdate,

        joinRoom,
        leaveRoom,
        syncViewAsHost,
      }}
    >
      {children}
    </RoomSyncContext.Provider>
  );
}

export function useRoomSync() {
  const ctx = useContext(RoomSyncContext);
  if (!ctx) {
    throw new Error("useRoomSync must be used inside RoomSyncProvider");
  }
  return ctx;
}

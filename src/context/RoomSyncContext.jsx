// src/context/RoomSyncContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import socketService from "../services/socketService";

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

  /* =========================
     SOCKET LISTENERS
     ========================= */

  useEffect(() => {
    socketService.onViewSynced((payload) => {
      if (payload?.page) {
        setCurrentView(payload.page);
      }
    });

    socketService.onParticipantsUpdate((data) => {
      if (Array.isArray(data?.participants)) {
        setParticipants(data.participants);
      }
    });

    return () => {
      socketService.offViewSynced();
      socketService.offParticipantsUpdate();
    };
  }, []);

  /* =========================
     API
     ========================= */

  /**
   * Join a room
   * Used by BOTH host and guest
   */
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
    setCurrentView(view); // 🔑 FIX
  };

  const leaveRoom = () => {
    socketService.leaveRoom();

    setRoomId(null);
    setIsHost(false);
    setCurrentView("welcome");
    setParticipants([]);
    setActiveProjectId(null);
  };

  /**
   * Host reports a view change
   */
  const syncViewAsHost = (page) => {
    if (!roomId || !isHost) return;

    socketService.syncView({
      roomId,
      page,
    });

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

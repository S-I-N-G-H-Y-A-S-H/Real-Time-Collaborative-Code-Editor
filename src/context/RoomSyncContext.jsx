// src/context/RoomSyncContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import socketService from "../services/socketService";

const RoomSyncContext = createContext(null);

export function RoomSyncProvider({ children }) {
  const [roomId, setRoomId] = useState(null);
  const [isHost, setIsHost] = useState(false);

  // Shared app view: "welcome" | "editor"
  const [currentView, setCurrentView] = useState("welcome");

  // ✅ REAL PARTICIPANTS STATE
  const [participants, setParticipants] = useState([]);

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

    // Participants sync
    socketService.onParticipantsUpdate((data) => {
      if (data?.participants && Array.isArray(data.participants)) {
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

  const joinRoom = (rid, host = false) => {
    socketService.joinRoom({ roomId: rid });
    setRoomId(rid);
    setIsHost(host);
  };

  const leaveRoom = () => {
    socketService.leaveRoom();
    setRoomId(null);
    setIsHost(false);
    setCurrentView("welcome");
    setParticipants([]); // clear participants on leave
  };

  /**
   * Host reports a view change
   * Guests just listen
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
        participants, // ✅ EXPOSED HERE
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

/* =========================
   Hook
   ========================= */

export function useRoomSync() {
  const ctx = useContext(RoomSyncContext);
  if (!ctx) {
    throw new Error("useRoomSync must be used inside RoomSyncProvider");
  }
  return ctx;
}

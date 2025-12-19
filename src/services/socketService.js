// frontend/src/services/socketService.js
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

class SocketService {
  constructor() {
    this.socket = null;
    this.currentRoomId = null;

    this.participantsHandler = null;
    this.viewHandler = null;
  }

  /* =========================
     CONNECTION
     ========================= */

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        autoConnect: false,
        transports: ["websocket"],
      });
    }

    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  /* =========================
     ROOM
     ========================= */

  joinRoom({ roomId }) {
    if (!roomId) return;

    this.connect();
    this.currentRoomId = roomId;

    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username") || "Unknown";

    this.socket.emit("auth-join", {
      token,
      roomId,
      username,
    });
  }

  leaveRoom() {
    if (!this.socket) return;

    this.socket.emit("leave-room");
    this.currentRoomId = null;
  }

  /* =========================
     PARTICIPANTS
     ========================= */

  onParticipantsUpdate(callback) {
    if (!callback) return;

    this.connect();

    if (this.participantsHandler) {
      this.socket.off("participants-updated", this.participantsHandler);
    }

    this.participantsHandler = callback;
    this.socket.on("participants-updated", callback);
  }

  offParticipantsUpdate() {
    if (!this.socket || !this.participantsHandler) return;

    this.socket.off("participants-updated", this.participantsHandler);
    this.participantsHandler = null;
  }

  /* =========================
     VIEW SYNC (NEW)
     ========================= */

  /**
   * Host tells server which page is active
   * page = "welcome" | "editor"
   */
  syncView({ roomId, page }) {
    if (!this.socket || !roomId || !page) return;

    this.socket.emit("sync-view", {
      roomId,
      page,
    });
  }

  /**
   * Everyone listens for view changes
   */
  onViewSynced(callback) {
    if (!callback) return;

    this.connect();

    if (this.viewHandler) {
      this.socket.off("view-synced", this.viewHandler);
    }

    this.viewHandler = callback;
    this.socket.on("view-synced", callback);
  }

  offViewSynced() {
    if (!this.socket || !this.viewHandler) return;

    this.socket.off("view-synced", this.viewHandler);
    this.viewHandler = null;
  }

  /* =========================
     CLEANUP
     ========================= */

  disconnect() {
    if (!this.socket) return;

    this.leaveRoom();
    this.socket.disconnect();

    this.socket = null;
    this.currentRoomId = null;
    this.participantsHandler = null;
    this.viewHandler = null;
  }
}

export default new SocketService();
  
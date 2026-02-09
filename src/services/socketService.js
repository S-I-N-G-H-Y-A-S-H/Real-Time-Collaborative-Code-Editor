// frontend/src/services/socketService.js
import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

class SocketService {
  constructor() {
    this.socket = null;
    this.currentRoomId = null;

    // handlers
    this.participantsHandler = null;
    this.viewHandler = null;
    this.projectActivatedHandler = null;
    this.filesUpdatedHandler = null;

    // editor sync
    this.editorContentHandler = null;

    // 🆕 execution sync
    this.executionOutputHandler = null;

      // 🆕 tab sync
    this.tabOpenHandler = null;
    this.tabCloseHandler = null;

    // 🆕 file dirty sync
    this.fileDirtyHandler = null;
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
      this.socket.off(
        "participants-updated",
        this.participantsHandler
      );
    }

    this.participantsHandler = callback;
    this.socket.on("participants-updated", callback);
  }

  offParticipantsUpdate() {
    if (!this.socket || !this.participantsHandler) return;

    this.socket.off(
      "participants-updated",
      this.participantsHandler
    );
    this.participantsHandler = null;
  }

  /* =========================
     VIEW SYNC
     ========================= */

  syncView({ roomId, page }) {
    if (!this.socket || !roomId || !page) return;

    this.socket.emit("sync-view", { roomId, page });
  }

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
     PROJECT ACTIVATION
     ========================= */

  onProjectActivated(callback) {
    if (!callback) return;

    this.connect();

    if (this.projectActivatedHandler) {
      this.socket.off(
        "project:activated",
        this.projectActivatedHandler
      );
    }

    this.projectActivatedHandler = callback;
    this.socket.on("project:activated", callback);
  }

  offProjectActivated() {
    if (!this.socket || !this.projectActivatedHandler) return;

    this.socket.off(
      "project:activated",
      this.projectActivatedHandler
    );
    this.projectActivatedHandler = null;
  }

  /* =========================
     FILE SYNC
     ========================= */

  onFilesUpdated(callback) {
    if (!callback) return;

    this.connect();

    if (this.filesUpdatedHandler) {
      this.socket.off("files:updated", this.filesUpdatedHandler);
    }

    this.filesUpdatedHandler = callback;
    this.socket.on("files:updated", callback);
  }

  offFilesUpdated() {
    if (!this.socket || !this.filesUpdatedHandler) return;

    this.socket.off("files:updated", this.filesUpdatedHandler);
    this.filesUpdatedHandler = null;
  }

  /* =========================
     EDITOR REALTIME SYNC
     ========================= */

  emitEditorContentChange({ roomId, filePath, content }) {
    if (!this.socket || !roomId || !filePath) return;

    this.socket.emit("editor:content-change", {
      roomId,
      filePath,
      content,
    });
  }

  onEditorContentUpdate(callback) {
    if (!callback) return;

    this.connect();

    if (this.editorContentHandler) {
      this.socket.off(
        "editor:content-update",
        this.editorContentHandler
      );
    }

    this.editorContentHandler = callback;
    this.socket.on("editor:content-update", callback);
  }

  offEditorContentUpdate() {
    if (!this.socket || !this.editorContentHandler) return;

    this.socket.off(
      "editor:content-update",
      this.editorContentHandler
    );
    this.editorContentHandler = null;
  }

  /* =========================
   🆕 TAB SYNC
   ========================= */

  emitTabOpen({ roomId, filePath }) {
    if (!this.socket || !roomId || !filePath) return;

    this.socket.emit("tabs:open", {
      roomId,
      filePath,
    });
  }

  emitTabClose({ roomId, filePath }) {
    if (!this.socket || !roomId || !filePath) return;

    this.socket.emit("tabs:close", {
      roomId,
      filePath,
    });
  }

  onTabOpen(callback) {
  if (!callback) return;

  this.connect();

  if (this.tabOpenHandler) {
    this.socket.off("tabs:open", this.tabOpenHandler);
  }

  this.tabOpenHandler = callback;
  this.socket.on("tabs:open", callback);
}

offTabOpen() {
  if (!this.socket || !this.tabOpenHandler) return;

  this.socket.off("tabs:open", this.tabOpenHandler);
  this.tabOpenHandler = null;
}

onTabClose(callback) {
  if (!callback) return;

  this.connect();

  if (this.tabCloseHandler) {
    this.socket.off("tabs:close", this.tabCloseHandler);
  }

  this.tabCloseHandler = callback;
  this.socket.on("tabs:close", callback);
}

offTabClose() {
  if (!this.socket || !this.tabCloseHandler) return;

  this.socket.off("tabs:close", this.tabCloseHandler);
  this.tabCloseHandler = null;
}

onFileDirty(callback) {
  if (!callback) return;

  this.connect();

  if (this.fileDirtyHandler) {
    this.socket.off("file:dirty", this.fileDirtyHandler);
  }

  this.fileDirtyHandler = callback;
  this.socket.on("file:dirty", callback);
}

offFileDirty() {
  if (!this.socket || !this.fileDirtyHandler) return;

  this.socket.off("file:dirty", this.fileDirtyHandler);
  this.fileDirtyHandler = null;
}


emitFileDirty({ roomId, filePath, dirty }) {
  if (!this.socket || !roomId || !filePath) return;

  this.socket.emit("file:dirty", {
    roomId,
    filePath,
    dirty,
  });
}




  /* =========================
     🆕 EXECUTION SYNC
     ========================= */

  emitExecutionRun({ roomId, fileName, code }) {
    if (!this.socket || !roomId || !fileName) return;

    this.socket.emit("execution:run", {
      roomId,
      fileName,
      code,
    });
  }

  onExecutionOutput(callback) {
    if (!callback) return;

    this.connect();

    if (this.executionOutputHandler) {
      this.socket.off(
        "execution:output",
        this.executionOutputHandler
      );
    }

    this.executionOutputHandler = callback;
    this.socket.on("execution:output", callback);
  }

  offExecutionOutput() {
    if (!this.socket || !this.executionOutputHandler) return;

    this.socket.off(
      "execution:output",
      this.executionOutputHandler
    );
    this.executionOutputHandler = null;
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
    this.projectActivatedHandler = null;
    this.filesUpdatedHandler = null;
    this.editorContentHandler = null;
    this.executionOutputHandler = null;
    this.tabOpenHandler = null;
    this.tabCloseHandler = null;

  }
}

export default new SocketService();

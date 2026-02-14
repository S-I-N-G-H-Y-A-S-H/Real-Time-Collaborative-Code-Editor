// src/components/ParticipantsDropdown.jsx
import { useEffect, useRef, useState } from "react";
import { useRoomSync } from "../context/RoomSyncContext";
import socketService from "../services/socketService";
import "../styles/ParticipantsDropdown.css";

export default function ParticipantsDropdown({ maxShown = 6 }) {
  const { participants, isHost, roomId } = useRoomSync();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const currentUser =
    JSON.parse(localStorage.getItem("user") || "{}") || {};

  /* =========================
     CLOSE ON OUTSIDE CLICK
     ========================= */
  useEffect(() => {
    const close = (e) =>
      wrapperRef.current &&
      !wrapperRef.current.contains(e.target) &&
      setOpen(false);

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  /* =========================
     PERMISSION CHANGE
     ========================= */
  const handlePermissionChange = (targetUserId, permission) => {
    if (!isHost || !roomId) return;

    socketService.socket?.emit("participant:permission-change", {
      roomId,
      targetUserId,
      permission, // "read" | "write"
    });
  };

  const shown = participants.slice(0, maxShown);
  const moreCount = participants.length - shown.length;

  return (
    <div className="participants-wrapper" ref={wrapperRef}>
      <button
        className="participants-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        👥
        <span className="participants-count">
          {participants.length}
        </span>
        <span className={`participants-caret ${open ? "open" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="participants-dropdown">
          <div className="participants-title">Participants</div>

          <div className="participants-list">
            {shown.map((p) => {
              const name = p.username || "Unknown";
              const isYou = p.userId === currentUser._id;

              return (
                <div key={p.userId} className="participant-item">
                  {/* LEFT SIDE */}
                  <div className="participant-left">
                    <div className="participant-avatar">
                      {name[0]?.toUpperCase()}
                    </div>

                    <div className="participant-name">
                      {name}

                      {isYou && (
                        <span className="participant-you">
                          {" "}
                          — you
                        </span>
                      )}

                      {p.isHost && (
                        <span className="participant-host">
                          {" "}
                          (host)
                        </span>
                      )}

                      {/* 🔑 PERMISSION CONTROLS */}
                      {!p.isHost && (
                        <div className="permission-controls">
                          <label>
                            <input
                              type="checkbox"
                              checked={p.permission !== "write"}
                              disabled
                            />
                            R
                          </label>

                          <label>
                            <input
                              type="checkbox"
                              checked={p.permission === "write"}
                              disabled={!isHost}
                              onChange={() =>
                                handlePermissionChange(
                                  p.userId,
                                  p.permission === "write"
                                    ? "read"
                                    : "write"
                                )
                              }
                            />
                            W
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* STATUS DOT RIGHT */}
                  <span
                    className={`status-dot ${
                      p.online ? "online" : "offline"
                    }`}
                  />
                </div>
              );
            })}

            {moreCount > 0 && (
              <div className="participant-more">
                And {moreCount} more...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

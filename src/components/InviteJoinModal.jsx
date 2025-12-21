import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRoomSync } from "../context/RoomSyncContext";
import "../styles/InviteJoinModal.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function InviteJoinModal({
  isOpen,
  mode = "join", // "invite" | "join"
  roomId: initialRoomId = null,
  onClose = () => {},
}) {
  const navigate = useNavigate();
  const { joinRoom } = useRoomSync();

  const [roomId, setRoomId] = useState(initialRoomId);
  const [inviteCode, setInviteCode] = useState("");
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /* ===============================
     INVITE MODE – host
     =============================== */
  useEffect(() => {
    if (!isOpen || mode !== "invite") return;

    async function fetchInvite() {
      try {
        setLoading(true);
        setError("");

        const token = localStorage.getItem("token");

        let rid = roomId;
        if (!rid) {
          const res = await fetch(`${API_BASE}/rooms`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error);

          rid = data.roomId;
          setRoomId(rid);
        }

        const inviteRes = await fetch(`${API_BASE}/rooms/${rid}/invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const inviteData = await inviteRes.json();
        if (!inviteRes.ok) throw new Error(inviteData.error);

        setInviteCode(inviteData.inviteCode);

        // HOST joins (no project yet)
        joinRoom(rid, true, null, "welcome");
      } catch (err) {
        setError(err.message || "Failed to create invite");
      } finally {
        setLoading(false);
      }
    }

    fetchInvite();
  }, [isOpen, mode]);

  /* ===============================
     JOIN MODE – guest
     =============================== */
  async function handleJoinWithCode() {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE}/rooms/join`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ inviteCode: joinCodeInput.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const { room } = data;

      // 🔑 FIX — pass EVERYTHING
      joinRoom(
        room.roomId,
        false,                     // guest
        room.activeProjectId,      // 🔑 project id
        room.currentView || "welcome"
      );

      onClose();

      if (room.currentView === "editor") {
        navigate("/editor", { replace: true });
      }
    } catch (err) {
      setError(err.message || "Failed to join room");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {mode === "invite" ? (
          <>
            <h3>Invite participants</h3>

            <label>Room Code</label>
            <input readOnly value={inviteCode} />

            {error && <p style={{ color: "salmon" }}>{error}</p>}

            <div className="modal-buttons">
              <button
                className="create-btn"
                onClick={() => navigator.clipboard.writeText(inviteCode)}
                disabled={!inviteCode}
              >
                Copy
              </button>
              <button className="cancel-btn" onClick={onClose}>
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <h3>Join a room</h3>

            <input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="Enter invite code"
            />

            <button
              className="create-btn"
              onClick={handleJoinWithCode}
              disabled={loading || !joinCodeInput.trim()}
            >
              Join
            </button>

            {error && <p style={{ color: "salmon" }}>{error}</p>}

            <button className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

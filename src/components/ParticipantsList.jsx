import { useRoomSync } from "../context/RoomSyncContext";
import "../styles/ParticipantsDropdown.css";

export default function ParticipantsList() {
  const { participants } = useRoomSync();

  const selfUsername = localStorage.getItem("username");

  return (
    <div className="participants-dropdown">
      <div className="participants-title">Participants</div>

      <div className="participants-list">
        {participants.length === 0 ? (
          <div className="participant-item" style={{ opacity: 0.6 }}>
            No participants
          </div>
        ) : (
          participants.map((p) => {
            const isYou = p.username === selfUsername;

            return (
              <div key={p.userId} className="participant-item">
                {/* Avatar */}
                <div className="participant-avatar">
                  {(p.username || "?")[0].toUpperCase()}
                </div>

                {/* Name */}
                <div className="participant-name">
                  {p.username || "Unknown"}

                  {isYou && (
                    <span className="participant-you">— you</span>
                  )}

                  {p.isHost && (
                    <span className="participant-host">⭐ host</span>
                  )}
                </div>

                {/* Status dot */}
                <span
                  className={`status-dot ${
                    p.online ? "online" : "offline"
                  }`}
                  title={p.online ? "Online" : "Offline"}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// src/components/ParticipantsDropdown.jsx
import { useEffect, useRef, useState } from "react";
import "../styles/ParticipantsDropdown.css";

export default function ParticipantsDropdown({ participants = [], maxShown = 6 }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const currentUser =
    JSON.parse(localStorage.getItem("user") || "{}") || {};

  useEffect(() => {
    const close = (e) =>
      wrapperRef.current &&
      !wrapperRef.current.contains(e.target) &&
      setOpen(false);

    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const shown = participants.slice(0, maxShown);
  const moreCount = participants.length - shown.length;

  return (
    <div className="participants-wrapper" ref={wrapperRef}>
      <button
        className="participants-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        👥
        <span className="participants-count">{participants.length}</span>
        <span className={`participants-caret ${open ? "open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="participants-dropdown">
          <div className="participants-title">Participants</div>

          <div className="participants-list">
            {shown.map((p) => {
              const name = p.username || p.name || "Unknown";
              const isYou = p.userId === currentUser._id;

              return (
                <div key={p.userId} className="participant-item">
                  <div className="participant-avatar">
                    {name[0]?.toUpperCase()}
                  </div>

                  <div className="participant-name">
                    {name}
                    {isYou && <span className="participant-you"> — you</span>}
                    {p.isHost && (
                      <span className="participant-host"> (host)</span>
                    )}
                  </div>
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

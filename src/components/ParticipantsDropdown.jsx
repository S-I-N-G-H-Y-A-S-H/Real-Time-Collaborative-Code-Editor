// src/components/ParticipantsDropdown.jsx
import React, { useEffect, useRef, useState } from "react";
import "../styles/ParticipantsDropdown.css";

/**
 * ParticipantsDropdown
 *
 * Props:
 * - participants: optional array of { id, name, isHost } (other participants)
 * - maxShown: optional number of participants to show before "and N more"
 *
 * This component reads localStorage.user to show the current logged-in user first.
 * Later you should pass a real participants array from your realtime socket logic.
 */
export default function ParticipantsDropdown({ participants = [], maxShown = 6 }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef();

  const [currentUser, setCurrentUser] = useState({ name: "You" });

  useEffect(() => {
    // try to read the saved user from localStorage (login flow stores it)
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const u = JSON.parse(raw);
        // normalize object
        setCurrentUser({
          id: u.id || u._id || u.sub || null,
          name: u.name || u.username || u.email || "You",
        });
        return;
      }
    } catch (e) {
      // ignore parse errors
    }
    setCurrentUser({ name: "You" });
  }, []);

  // close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Ensure current user appears first, and don't duplicate if participants already includes them
  const filteredOthers = (participants || []).filter((p) => {
    // try compare by id or name
    if (!p) return false;
    if (p.id && currentUser.id) return p.id !== currentUser.id;
    return (p.name || p.username) !== currentUser.name;
  });

  // items to show
  const itemsToShow = [ { id: currentUser.id ?? "you", name: currentUser.name, isYou: true }, ...filteredOthers ];

  const shown = itemsToShow.slice(0, maxShown);
  const moreCount = Math.max(0, itemsToShow.length - shown.length);

  return (
    <div className="participants-wrapper" ref={wrapperRef}>
      <button
        className="participants-toggle"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        aria-haspopup="true"
        title="Participants"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="participants-icon" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
        </svg>
        <span className="participants-count">{itemsToShow.length}</span>
        <span className={`participants-caret ${open ? "open" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="participants-dropdown">
          <div className="participants-title">Participants</div>

          <div className="participants-list">
            {shown.map((p, idx) => (
              <div className="participant-item" key={p.id ?? idx}>
                <div className="participant-avatar">{(p.name || "U").slice(0,1).toUpperCase()}</div>
                <div className="participant-meta">
                  <div className="participant-name">
                    {p.name}
                    {p.isYou && <span className="participant-you"> — you</span>}
                    {p.isHost && <span className="participant-host"> • host</span>}
                  </div>
                </div>
              </div>
            ))}

            {moreCount > 0 && <div className="participant-more">And {moreCount} more...</div>}
          </div>
        </div>
      )}
    </div>
  );
}

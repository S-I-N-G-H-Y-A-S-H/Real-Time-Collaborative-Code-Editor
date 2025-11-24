// src/components/ProfileButton.jsx
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import "../styles/ProfileButton.css";

export default function ProfileButton({ icon, userProp }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState(null);
  const toggleRef = useRef(null);
  const navigate = useNavigate();

  // load user from prop / localStorage / token
  useEffect(() => {
    if (userProp) {
      setUser(userProp);
      return;
    }
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        setUser(JSON.parse(raw));
        return;
      }
      const token = localStorage.getItem("token");
      if (token) {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
          setUser({ name: payload.name || payload.username || payload.email || "You", email: payload.email });
          return;
        }
      }
    } catch (e) {
      // ignore
    }
    setUser({ name: "You" });
  }, [userProp]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (!toggleRef.current) return;
      if (!toggleRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // compute dropdown position when opened
  useEffect(() => {
    if (!open) {
      setDropdownStyle(null);
      return;
    }
    const toggle = toggleRef.current;
    if (!toggle) return;

    const rect = toggle.getBoundingClientRect();
    const margin = 8;
    const preferredLeft = rect.right + margin;
    const preferredTop = rect.top + window.scrollY; // keep vertical align to button top

    // temporary create style and measure width after render; we'll adjust after portal mount
    setDropdownStyle({ left: preferredLeft, top: preferredTop, visibility: "hidden" });
  }, [open]);

  // After portal content mounts, compute overflow and adjust left if needed
  // We use a microtask to allow the portal DOM to render then measure.
  useEffect(() => {
    if (!open) return;
    // small delay to allow portal DOM to be in document
    const id = setTimeout(() => {
      const el = document.querySelector(".profile-dropdown-portal");
      if (!el || !toggleRef.current) return;

      const rect = el.getBoundingClientRect();
      const toggRect = toggleRef.current.getBoundingClientRect();

      // If overflowing right, place to left of sidebar toggle
      if (rect.right > window.innerWidth) {
        const newLeft = toggRect.left - rect.width - 8;
        setDropdownStyle((s) => ({ ...s, left: newLeft, visibility: "visible" }));
      } else {
        // ensure visible and accurate top
        setDropdownStyle((s) => ({ ...s, top: toggRect.top + window.scrollY, visibility: "visible" }));
      }
    }, 0);
    return () => clearTimeout(id);
  }, [open]);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Add any socket cleanup here if needed
    navigate("/login");
  }

  const displayName = user?.name || user?.username || "You";

  // the portal content
  const dropdown = open ? (
    <div
      className="profile-dropdown-portal"
      style={{
        position: "absolute",
        top: dropdownStyle?.top ?? 0,
        left: dropdownStyle?.left ?? 0,
        minWidth: 200,
        zIndex: 9999,
        visibility: dropdownStyle?.visibility ?? "visible",
      }}
    >
      <div className="profile-info">
        <div className="profile-name">{displayName}</div>
        {user?.email && <div className="profile-email">{user.email}</div>}
      </div>

      <div className="profile-actions">
        <button className="btn-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="profile-btn-wrapper" ref={toggleRef}>
        <button
          className="profile-toggle-img"
          onClick={() => setOpen((s) => !s)}
          title={displayName}
          aria-haspopup="true"
          aria-expanded={open}
        >
          <img src={icon} alt="profile" className="profile-icon-img" />
        </button>
      </div>

      {dropdown ? ReactDOM.createPortal(dropdown, document.body) : null}
    </>
  );
}

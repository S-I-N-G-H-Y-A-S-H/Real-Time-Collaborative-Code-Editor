// src/components/NewItemModal.jsx
import { useState, useEffect } from "react";
import "../styles/NewItemModal.css";

function NewItemModal({ type, onConfirm, onCancel }) {
  const [name, setName] = useState("");

  useEffect(() => {
    setName(""); // reset when modal opens
  }, [type]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onConfirm(name.trim());
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3 className="modal-title">
          {type === "file" ? "New File" : "New Folder"}
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              type === "file" ? "Enter file name (with extension)" : "Enter folder name"
            }
            className="modal-input"
          />
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="modal-btn cancel">
              Cancel
            </button>
            <button type="submit" className="modal-btn confirm">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NewItemModal;

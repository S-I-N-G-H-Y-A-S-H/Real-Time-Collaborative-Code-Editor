import React, { useState } from 'react';
import '../styles/NewFileModal.css';

function NewFileModal({ onCreate, onClose }) {
    const [fileName, setFileName] = useState('');

    const handleCreate = () => {
        if (fileName.trim() === '') return;
        onCreate(fileName.trim()); // stays the same
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2>Create New File</h2>
                <input
                    type="text"
                    placeholder="Enter file name (e.g., main.js)"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                />
                <div className="modal-buttons">
                    <button className="create-btn" onClick={handleCreate}>Create</button>
                    <button className="cancel-btn" onClick={onClose}>Cancel</button>
                </div>
            </div>
        </div>
    );
}

export default NewFileModal;

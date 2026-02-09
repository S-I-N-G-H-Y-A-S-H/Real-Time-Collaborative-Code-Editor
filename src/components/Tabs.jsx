// src/components/Tabs.jsx
import { useRef, useEffect } from "react";
import "../styles/Tabs.css";
import closeIcon from "../assets/close-tab.png";
import dirtyIcon from "../assets/dirty-dot.png";
import { getFileIcon } from "../utils/fileIcons";

import { useFile } from "../context/FileContext";
import { useProject } from "../context/ProjectContext";
import { useRoomSync } from "../context/RoomSyncContext";

function Tabs() {
  const { roomId } = useRoomSync();
  const isCollaborative = !!roomId;

  // local (single-user)
  const fileCtx = useFile();

  // collaborative
  const projectCtx = useProject();

  // unified state
  const openFiles = isCollaborative
    ? projectCtx.openFiles
    : fileCtx.openFiles;

  const activeFile = isCollaborative
    ? projectCtx.activeFile
    : fileCtx.currentFile;

  // unified actions
  const openTab = isCollaborative
    ? (file) => projectCtx.openFileWithTab(file.path)
    : (file) => fileCtx.setCurrentFile(file);

  const closeTab = isCollaborative
    ? (file) => projectCtx.closeFileTab(file.path)
    : (file) => fileCtx.closeFile(file.fileHandle);

  const viewportRef = useRef(null);

  /* =========================
     TAB SCROLL / DRAG
     ========================= */
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let isDragging = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      startX = e.pageX - viewport.offsetLeft;
      scrollLeft = viewport.scrollLeft;
      viewport.classList.add("dragging");
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const walk = x - startX;
      viewport.scrollLeft = scrollLeft - walk;
    };

    const stopDrag = () => {
      isDragging = false;
      viewport.classList.remove("dragging");
    };

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        viewport.scrollLeft += e.deltaY;
      }
    };

    viewport.addEventListener("mousedown", onMouseDown);
    viewport.addEventListener("mousemove", onMouseMove);
    viewport.addEventListener("mouseup", stopDrag);
    viewport.addEventListener("mouseleave", stopDrag);
    viewport.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      viewport.removeEventListener("mousedown", onMouseDown);
      viewport.removeEventListener("mousemove", onMouseMove);
      viewport.removeEventListener("mouseup", stopDrag);
      viewport.removeEventListener("mouseleave", stopDrag);
      viewport.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div className="tab-bar-viewport" ref={viewportRef}>
      <div className="tab-list">
        {openFiles.map((file) => {
          const isActive = isCollaborative
            ? activeFile?.path === file.path
            : activeFile?.fileHandle === file.fileHandle;

          return (
            <div
              key={file.path || file.fileHandle}
              className={`tab ${isActive ? "active-tab" : ""}`}
              onClick={() => openTab(file)}
              title={file.fileName}
            >
              <img
                src={getFileIcon(file.fileName)}
                alt="File Icon"
                className="tab-file-icon"
              />

              <span className="tab-filename">{file.fileName}</span>

              {file.modified && (
                <img
                  src={dirtyIcon}
                  alt="Unsaved changes"
                  className="dirty-icon"
                />
              )}

              <img
                src={closeIcon}
                alt="Close Tab"
                className="close-tab-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(file);
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Tabs;

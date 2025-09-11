// src/components/Tabs.jsx
import { useFile } from "../context/FileContext";
import closeIcon from "../assets/close-tab.png";
import dirtyIcon from "../assets/dirty-dot.png"; // real dirty icon
import "../styles/Tabs.css";
import { getFileIcon } from "../utils/fileIcons";
import { useRef, useEffect } from "react";

function Tabs() {
  const { currentFile, setCurrentFile, openFiles, closeFile } = useFile();
  const viewportRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let isDragging = false;
    let startX;
    let scrollLeft;

    const onMouseDown = (e) => {
      if (e.button !== 0) return; // left click only
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

    const onMouseUp = () => {
      isDragging = false;
      viewport.classList.remove("dragging");
    };

    const onWheel = (e) => {
      // always scroll horizontally
      if (Math.abs(e.deltaY) > 0) {
        e.preventDefault();
        viewport.scrollLeft += e.deltaY;
      }
    };

    viewport.addEventListener("mousedown", onMouseDown);
    viewport.addEventListener("mousemove", onMouseMove);
    viewport.addEventListener("mouseup", onMouseUp);
    viewport.addEventListener("mouseleave", onMouseUp);
    viewport.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      viewport.removeEventListener("mousedown", onMouseDown);
      viewport.removeEventListener("mousemove", onMouseMove);
      viewport.removeEventListener("mouseup", onMouseUp);
      viewport.removeEventListener("mouseleave", onMouseUp);
      viewport.removeEventListener("wheel", onWheel);
    };
  }, []);

  return (
    <div className="tab-bar-viewport" ref={viewportRef}>
      <div className="tab-list">
        {openFiles.map((file) => (
          <div
            key={file.fileName}
            className={`tab ${
              currentFile?.fileName === file.fileName ? "active-tab" : ""
            }`}
            onClick={() => setCurrentFile(file)}
            title={file.fileName}
          >
            <img
              src={getFileIcon(file.fileName)}
              alt="File Icon"
              className="tab-file-icon"
            />
            <span className="tab-filename">{file.fileName}</span>

            {/* Show dirty icon when modified */}
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
                closeFile(file.fileName);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Tabs;

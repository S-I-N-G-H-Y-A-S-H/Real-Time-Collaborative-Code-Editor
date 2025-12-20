// src/context/ProjectContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { useRoomSync } from "./RoomSyncContext";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

/* =========================
   CONTEXT
   ========================= */

const ProjectContext = createContext(null);

/* =========================
   PROVIDER
   ========================= */

export function ProjectProvider({ children }) {
  const { roomId } = useRoomSync();

  /* =========================
     STATE
     ========================= */

  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [files, setFiles] = useState([]); // [{ path, content, ... }]
  const [activeFilePath, setActiveFilePath] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =========================
     HELPERS
     ========================= */

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      Authorization: `Bearer ${token}`,
    };
  };

  /* =========================
     LOAD PROJECT
     ========================= */

  async function loadProject(pid) {
    if (!pid) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/projects/${pid}`, {
        headers: {
          ...getAuthHeader(),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load project");

      setProjectId(data.project._id);
      setProjectName(data.project.name);
      setFiles(data.project.files || []);

      // auto-open first file if exists
      if (data.project.files?.length > 0) {
        setActiveFilePath(data.project.files[0].path);
      } else {
        setActiveFilePath(null);
      }
    } catch (err) {
      console.error("loadProject error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     FILE OPERATIONS (LOCAL STATE ONLY)
     ========================= */

  function openFile(path) {
    setActiveFilePath(path);
  }

  function getActiveFile() {
    return files.find((f) => f.path === activeFilePath) || null;
  }

  function updateFileContent(path, newContent) {
    setFiles((prev) =>
      prev.map((f) =>
        f.path === path ? { ...f, content: newContent } : f
      )
    );
  }

  /* =========================
     CREATE FILE (DB)
     ========================= */

  async function createFile(path) {
    if (!projectId) return;

    try {
      const res = await fetch(
        `${API_BASE}/projects/${projectId}/files`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ path }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setFiles(data.files);
      setActiveFilePath(path);
    } catch (err) {
      console.error("createFile error:", err);
    }
  }

  /* =========================
     SAVE FILE (DB)
     ========================= */

  async function saveFile(path) {
    if (!projectId) return;

    const file = files.find((f) => f.path === path);
    if (!file) return;

    try {
      await fetch(
        `${API_BASE}/projects/${projectId}/files/content`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            path,
            content: file.content,
          }),
        }
      );
    } catch (err) {
      console.error("saveFile error:", err);
    }
  }

  /* =========================
     RESET (LEAVE ROOM)
     ========================= */

  useEffect(() => {
    if (!roomId) {
      setProjectId(null);
      setProjectName("");
      setFiles([]);
      setActiveFilePath(null);
    }
  }, [roomId]);

  /* =========================
     CONTEXT VALUE
     ========================= */

  return (
    <ProjectContext.Provider
      value={{
        // state
        projectId,
        projectName,
        files,
        activeFilePath,
        activeFile: getActiveFile(),
        loading,
        error,

        // actions
        loadProject,
        openFile,
        updateFileContent,
        createFile,
        saveFile,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

/* =========================
   HOOK
   ========================= */

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used inside ProjectProvider");
  }
  return ctx;
}

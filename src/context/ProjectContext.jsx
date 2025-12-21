// src/context/ProjectContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
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
  const { roomId, activeProjectId } = useRoomSync();

  /* =========================
     PROJECT STATE
     ========================= */

  const [project, setProject] = useState({
    id: null,
    name: "",
    tree: [],
  });

  /* =========================
     FILE STATE
     ========================= */

  const [filesByPath, setFilesByPath] = useState({});
  const [activeFilePath, setActiveFilePath] = useState(null);

  /* =========================
     UI STATE
     ========================= */

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

  function normalizeFiles(files = []) {
    const map = {};
    files.forEach((f) => {
      map[f.path] = f;
    });
    return map;
  }

  /* =========================
     CREATE PROJECT (DB)
     ========================= */

  async function createProject(name) {
    if (!name) return null;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          name,
          roomId: roomId || null, // 🔑 FIX: ALWAYS SEND ROOM ID
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      const p = data.project;

      setProject({
        id: p._id,
        name: p.name,
        tree: [],
      });

      setFilesByPath(normalizeFiles(p.files || []));
      setActiveFilePath(null);

      return p;
    } catch (err) {
      console.error("createProject error:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     LOAD PROJECT (DB)
     ========================= */

  async function loadProject(projectId) {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        headers: {
          ...getAuthHeader(),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load project");

      const { project: p } = data;

      setProject({
        id: p._id,
        name: p.name,
        tree: p.tree || [],
      });

      setFilesByPath(normalizeFiles(p.files || []));
      setActiveFilePath(p.files?.[0]?.path || null);
    } catch (err) {
      console.error("loadProject error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     🔑 AUTO LOAD PROJECT FOR GUESTS
     ========================= */

  useEffect(() => {
    if (
      roomId &&
      activeProjectId &&
      project.id !== activeProjectId
    ) {
      loadProject(activeProjectId);
    }
  }, [roomId, activeProjectId]);

  /* =========================
     FILE ACTIONS (UI)
     ========================= */

  function openFile(path) {
    setActiveFilePath(path);
  }

  function updateFileContent(path, content) {
    setFilesByPath((prev) => ({
      ...prev,
      [path]: {
        ...prev[path],
        content,
      },
    }));
  }

  /* =========================
     FILE ACTIONS (DB)
     ========================= */

  async function createFile(path) {
    if (!project.id) return;

    try {
      const res = await fetch(
        `${API_BASE}/projects/${project.id}/files`,
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

      setFilesByPath(normalizeFiles(data.files));
      setActiveFilePath(path);
    } catch (err) {
      console.error("createFile error:", err);
    }
  }

  async function saveFile(path) {
    if (!project.id) return;

    const file = filesByPath[path];
    if (!file) return;

    try {
      await fetch(
        `${API_BASE}/projects/${project.id}/files/content`,
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
     DERIVED STATE
     ========================= */

  const activeFile = useMemo(() => {
    return filesByPath[activeFilePath] || null;
  }, [filesByPath, activeFilePath]);

  /* =========================
     RESET ON ROOM LEAVE
     ========================= */

  useEffect(() => {
    if (!roomId) {
      setProject({ id: null, name: "", tree: [] });
      setFilesByPath({});
      setActiveFilePath(null);
      setLoading(false);
      setError(null);
    }
  }, [roomId]);

  /* =========================
     CONTEXT VALUE
     ========================= */

  return (
    <ProjectContext.Provider
      value={{
        project,
        filesByPath,
        activeFilePath,
        activeFile,
        loading,
        error,

        createProject,
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

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

const ProjectContext = createContext(null);

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
     FILE STATE (FLAT)
     ========================= */

  const [filesByPath, setFilesByPath] = useState({});
  const [activeFilePath, setActiveFilePath] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =========================
     HELPERS
     ========================= */

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  };

  function normalizeFiles(files = []) {
    const map = {};
    files.forEach((f) => {
      map[f.path] = f;
    });
    return map;
  }

  /* =========================
     🌳 VIRTUAL TREE BUILDER
     ========================= */

  function buildVirtualTree(filesMap) {
    const root = [];

    Object.keys(filesMap).forEach((fullPath) => {
      const parts = fullPath.split("/").filter(Boolean);
      let current = root;

      parts.forEach((part, index) => {
        const isFile = index === parts.length - 1;
        let node = current.find((n) => n.name === part);

        if (!node) {
          node = {
            name: part,
            path: parts.slice(0, index + 1).join("/"),
            type: isFile ? "file" : "folder",
            ...(isFile ? {} : { children: [] }),
          };
          current.push(node);
        }

        if (!isFile) {
          current = node.children;
        }
      });
    });

    return root;
  }

  /* =========================
     CREATE PROJECT
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
        body: JSON.stringify({ name, roomId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const filesMap = normalizeFiles(data.project.files || []);

      setFilesByPath(filesMap);
      setProject({
        id: data.project._id,
        name: data.project.name,
        tree: buildVirtualTree(filesMap),
      });

      setActiveFilePath(null);
      return data.project;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     LOAD PROJECT
     ========================= */

  async function loadProject(projectId) {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        headers: getAuthHeader(),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const filesMap = normalizeFiles(data.project.files || []);

      setFilesByPath(filesMap);
      setProject({
        id: data.project._id,
        name: data.project.name,
        tree: buildVirtualTree(filesMap),
      });

      setActiveFilePath(data.project.files?.[0]?.path || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  /* =========================
     AUTO LOAD FOR GUESTS
     ========================= */

  useEffect(() => {
    if (roomId && activeProjectId && project.id !== activeProjectId) {
      loadProject(activeProjectId);
    }
  }, [roomId, activeProjectId]);

  /* =========================
     FILE ACTIONS
     ========================= */

  function openFile(path) {
    setActiveFilePath(path);
  }

  function updateFileContent(path, content) {
    setFilesByPath((prev) => ({
      ...prev,
      [path]: { ...prev[path], content },
    }));
  }

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

      const filesMap = normalizeFiles(data.files);
      setFilesByPath(filesMap);
      setProject((p) => ({
        ...p,
        tree: buildVirtualTree(filesMap),
      }));
      setActiveFilePath(path);
    } catch (err) {
      console.error("createFile error:", err);
    }
  }

  /* =========================
     DERIVED
     ========================= */

  const activeFile = useMemo(
    () => filesByPath[activeFilePath] || null,
    [filesByPath, activeFilePath]
  );

  /* =========================
     RESET
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
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error("useProject must be used inside ProjectProvider");
  }
  return ctx;
}

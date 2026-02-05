// src/context/ProjectContext.jsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { useRoomSync } from "./RoomSyncContext";
import socketService from "../services/socketService";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000";

const ProjectContext = createContext(null);

/* =========================
   🔒 PATH NORMALIZER
   ========================= */
function normalizePath(path = "") {
  return path.replace(/^\/+/, "").replace(/^\.\/+/, "");
}

export function ProjectProvider({ children }) {
  const { roomId, activeProjectId, filesUpdate } = useRoomSync();

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
     🧠 VIRTUAL FOLDERS
     ========================= */

  const [virtualFolders, setVirtualFolders] = useState(new Set());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =========================
     🔁 SOCKET META
     ========================= */

  const selfSocketIdRef = useRef(null);

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
      const normalized = normalizePath(f.path);
      map[normalized] = {
        ...f,
        path: normalized,
      };
    });
    return map;
  }

  /* =========================
     🌳 TREE BUILDER
     ========================= */

  function buildVirtualTree(filesMap, foldersSet) {
    const root = [];

    function ensureFolder(path) {
      const parts = path.split("/").filter(Boolean);
      let current = root;

      parts.forEach((part, index) => {
        let node = current.find((n) => n.name === part);

        if (!node) {
          node = {
            name: part,
            path: parts.slice(0, index + 1).join("/"),
            type: "folder",
            virtual: true,
            children: [],
          };
          current.push(node);
        }

        current = node.children;
      });
    }

    foldersSet.forEach(ensureFolder);

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

        if (!isFile) current = node.children;
      });
    });

    return root;
  }

  function rebuildTree(files = filesByPath, folders = virtualFolders) {
    setProject((p) => ({
      ...p,
      tree: buildVirtualTree(files, folders),
    }));
  }

  /* =========================
     CREATE / LOAD PROJECT
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
      setVirtualFolders(new Set());
      setProject({
        id: data.project._id,
        name: data.project.name,
        tree: buildVirtualTree(filesMap, new Set()),
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
      setVirtualFolders(new Set());
      setProject({
        id: data.project._id,
        name: data.project.name,
        tree: buildVirtualTree(filesMap, new Set()),
      });

      const first = data.project.files?.[0]?.path;
      setActiveFilePath(first ? normalizePath(first) : null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (roomId && activeProjectId && project.id !== activeProjectId) {
      loadProject(activeProjectId);
    }
  }, [roomId, activeProjectId]);

  /* =========================================================
     🔁 FILE STRUCTURE SYNC (CREATE / RENAME / DELETE)
     ========================================================= */

  useEffect(() => {
    if (!filesUpdate || filesUpdate.projectId !== project.id) return;

    const filesMap = normalizeFiles(filesUpdate.files);
    setFilesByPath(filesMap);
    rebuildTree(filesMap);

    if (
      activeFilePath &&
      !filesMap[normalizePath(activeFilePath)]
    ) {
      setActiveFilePath(null);
    }
  }, [filesUpdate]);

  /* =========================================================
     🆕 REALTIME EDITOR CONTENT SYNC
     ========================================================= */

  useEffect(() => {
    socketService.connect();

    selfSocketIdRef.current = socketService.socket?.id;

    socketService.socket?.on(
      "editor:content-update",
      ({ filePath, content, from }) => {
        if (!filePath || from === selfSocketIdRef.current) return;

        const normalized = normalizePath(filePath);

        setFilesByPath((prev) => {
          if (!prev[normalized]) return prev;
          return {
            ...prev,
            [normalized]: {
              ...prev[normalized],
              content,
            },
          };
        });
      }
    );

    return () => {
      socketService.socket?.off("editor:content-update");
    };
  }, []);

  /* =========================
     FILE ACTIONS
     ========================= */

  function openFile(path) {
    setActiveFilePath(normalizePath(path));
  }

  function updateFileContent(path, content) {
    const normalized = normalizePath(path);

    setFilesByPath((prev) => ({
      ...prev,
      [normalized]: { ...prev[normalized], content },
    }));

    if (roomId && project.id) {
      socketService.socket?.emit("editor:content-change", {
        roomId,
        projectId: project.id,
        filePath: normalized,
        content,
      });
    }
  }

    /* =========================
     💾 SAVE FILE (CTRL + S)
     ========================= */

  async function saveFile(path) {
    if (!project.id || !roomId || !path) return;

    const normalized = normalizePath(path);
    const file = filesByPath[normalized];
    if (!file) return;

    try {
      const res = await fetch(
        `${API_BASE}/projects/${project.id}/files/content`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            path: normalized,
            content: file.content,
            roomId,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
    } catch (err) {
      console.error("saveFile error:", err);
    }
  }



  async function createFile(path) {
    if (!project.id || !roomId) return;

    const normalized = normalizePath(path);

    try {
      const res = await fetch(
        `${API_BASE}/projects/${project.id}/files`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ path: normalized, roomId }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const filesMap = normalizeFiles(data.files);
      setFilesByPath(filesMap);
      rebuildTree(filesMap);
      setActiveFilePath(normalized);
    } catch (err) {
      console.error("createFile error:", err);
    }
  }

  async function renameItem(oldPath, newName, type) {
    if (type !== "file" || !project.id || !roomId) return;

    const oldNorm = normalizePath(oldPath);
    const base = oldNorm.split("/").slice(0, -1).join("/");
    const newNorm = normalizePath(base ? `${base}/${newName}` : newName);

    try {
      const res = await fetch(
        `${API_BASE}/projects/${project.id}/files/rename`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({
            oldPath: oldNorm,
            newPath: newNorm,
            roomId,
          }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const filesMap = normalizeFiles(data.files);
      setFilesByPath(filesMap);
      rebuildTree(filesMap);

      if (activeFilePath === oldNorm) {
        setActiveFilePath(newNorm);
      }
    } catch (err) {
      console.error("renameFile error:", err);
    }
  }

  async function deleteItem(path, type) {
    if (!project.id || !roomId) return;

    const normalized = normalizePath(path);

    if (type === "folder") {
      setVirtualFolders((prev) => {
        const next = new Set(
          [...prev].filter(
            (p) => p !== normalized && !p.startsWith(normalized + "/")
          )
        );
        rebuildTree(filesByPath, next);
        return next;
      });
      return;
    }

    try {
      const res = await fetch(
        `${API_BASE}/projects/${project.id}/files`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
          body: JSON.stringify({ path: normalized, roomId }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const filesMap = normalizeFiles(data.files);
      setFilesByPath(filesMap);
      rebuildTree(filesMap);

      if (activeFilePath === normalized) {
        setActiveFilePath(null);
      }
    } catch (err) {
      console.error("delete error:", err);
    }
  }
    /* =========================
     🧠 VIRTUAL FOLDER ACTIONS
     ========================= */

  function createVirtualFolder(path) {
    const normalized = normalizePath(path);
    setVirtualFolders((prev) => {
      const next = new Set(prev);
      next.add(normalized);
      rebuildTree(filesByPath, next);
      return next;
    });
  }

  function renameVirtualFolder(oldPath, newPath) {
    const oldNorm = normalizePath(oldPath);
    const newNorm = normalizePath(newPath);

    setVirtualFolders((prev) => {
      const next = new Set();
      prev.forEach((p) => {
        if (p === oldNorm || p.startsWith(oldNorm + "/")) {
          next.add(newNorm + p.slice(oldNorm.length));
        } else {
          next.add(p);
        }
      });
      rebuildTree(filesByPath, next);
      return next;
    });
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
      setVirtualFolders(new Set());
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
        saveFile,

        createFile,
        renameItem,
        deleteItem,

        createVirtualFolder,
        renameVirtualFolder,
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

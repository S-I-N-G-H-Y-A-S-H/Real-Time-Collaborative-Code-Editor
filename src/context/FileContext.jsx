// src/context/FileContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { openFolder as openFolderAPI } from "../services/FileSystem";
import { getLanguageFromFilename } from "../utils/languageMap";

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [projectTree, setProjectTree] = useState([]);
  const [dirHandle, setDirHandle] = useState(null);
  const [rootFolderName, setRootFolderName] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);

  // Build project tree
  const buildTree = async (directoryHandle) => {
    const tree = [];
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === "file") {
        tree.push({ name: entry.name, type: "file", handle: entry });
      } else if (entry.kind === "directory") {
        const children = await buildTree(entry);
        tree.push({ name: entry.name, type: "folder", handle: entry, children });
      }
    }
    return tree;
  };

  const openFolder = async () => {
    const { dirHandle } = await openFolderAPI();
    if (!dirHandle) return;
    setDirHandle(dirHandle);
    setRootFolderName(dirHandle.name);
    const tree = await buildTree(dirHandle);
    setProjectTree(tree);
    setSelectedFolder(null);
  };

  const refreshProjectTree = async () => {
    if (!dirHandle) return;
    const tree = await buildTree(dirHandle);
    setProjectTree(tree);
  };

  const getFolderHandleByPath = async (path) => {
    if (!dirHandle) return null;
    const parts = (path || "").split("/").filter(Boolean);
    let handle = dirHandle;
    for (const part of parts) {
      handle = await handle.getDirectoryHandle(part);
    }
    return handle;
  };

  const copyDirectory = async (oldHandle, newHandle) => {
    for await (const entry of oldHandle.values()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        const newFH = await newHandle.getFileHandle(entry.name, { create: true });
        const writable = await newFH.createWritable();
        await writable.write(file);
        await writable.close();
      } else if (entry.kind === "directory") {
        const childNew = await newHandle.getDirectoryHandle(entry.name, { create: true });
        await copyDirectory(entry, childNew);
      }
    }
  };

  // Create new file
  const createNewFile = async (fileName, selectedItem = null) => {
    if (!dirHandle || !fileName) return;

    let parent;
    if (selectedItem?.type === "folder") {
      parent = selectedItem.handle;
    } else if (selectedItem?.type === "file") {
      const parts = selectedItem.path.split("/").filter(Boolean);
      const parentPath = parts.slice(0, -1).join("/");
      parent = parentPath ? await getFolderHandleByPath(parentPath) : dirHandle;
    } else {
      parent = selectedFolder || dirHandle;
    }

    try {
      const handle = await parent.getFileHandle(fileName, { create: true });
      if (fileName.endsWith(".java") && handle.createWritable) {
        const className = fileName.replace(".java", "");
        const boilerplate = `public class ${className} {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`;
        const writable = await handle.createWritable();
        await writable.write(boilerplate);
        await writable.close();
      }
      await refreshProjectTree();
    } catch (err) {
      console.error("Error creating file:", err);
    }
  };

  // Create new folder
  const createNewFolder = async (folderName, selectedItem = null) => {
    if (!dirHandle || !folderName) return;

    let parent;
    if (selectedItem?.type === "folder") {
      parent = selectedItem.handle;
    } else if (selectedItem?.type === "file") {
      const parts = selectedItem.path.split("/").filter(Boolean);
      const parentPath = parts.slice(0, -1).join("/");
      parent = parentPath ? await getFolderHandleByPath(parentPath) : dirHandle;
    } else {
      parent = selectedFolder || dirHandle;
    }

    try {
      await parent.getDirectoryHandle(folderName, { create: true });
      await refreshProjectTree();
    } catch (err) {
      console.error("Error creating folder:", err);
    }
  };

  // Delete item (safer)
  const deleteItem = async (path, type, askConfirm = true) => {
    if (!dirHandle || !path) return false;

    const parts = path.split("/").filter(Boolean);
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");
    const parentHandle = parentPath ? await getFolderHandleByPath(parentPath) : dirHandle;

    if (askConfirm) {
      const ok = window.confirm(`Delete "${name}"?`);
      if (!ok) return false;
    }

    try {
      // Ensure entry exists first
      if (type === "folder") {
        await parentHandle.getDirectoryHandle(name);
      } else {
        await parentHandle.getFileHandle(name);
      }

      await parentHandle.removeEntry(name, { recursive: type === "folder" });
      await refreshProjectTree();
      return true;
    } catch (err) {
      console.error("Delete failed:", err);
      return false;
    }
  };

  // Rename item
  const renameItem = async (path, newName, type) => {
    if (!dirHandle || !path || !newName) return false;

    const parts = path.split("/").filter(Boolean);
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");
    const parentHandle = parentPath ? await getFolderHandleByPath(parentPath) : dirHandle;

    try {
      if (type === "file") {
        const oldHandle = await parentHandle.getFileHandle(name);
        const file = await oldHandle.getFile();
        const newHandle = await parentHandle.getFileHandle(newName, { create: true });
        const writable = await newHandle.createWritable();
        await writable.write(file);
        await writable.close();
        await deleteItem(path, "file", false);
      } else if (type === "folder") {
        const oldDir = await parentHandle.getDirectoryHandle(name);
        const newDir = await parentHandle.getDirectoryHandle(newName, { create: true });
        await copyDirectory(oldDir, newDir);
        await deleteItem(path, "folder", false);
      }
      await refreshProjectTree();
      return true;
    } catch (err) {
      console.error("Rename failed:", err);
      return false;
    }
  };

  // Open file
  const openFileFromTree = async (fileHandle) => {
    if (!fileHandle) return;
    try {
      const file = await fileHandle.getFile();
      const content = await file.text();
      const language = getLanguageFromFilename(fileHandle.name);
      const openedFile = {
        fileName: fileHandle.name,
        fileContent: content,
        fileHandle,
        modified: false,
        language,
      };
      setOpenFiles((prev) => {
        const exists = prev.find((f) => f.fileHandle === fileHandle);
        if (!exists) return [...prev, openedFile];
        return prev;
      });
      setCurrentFile(openedFile);
    } catch (err) {
      console.error("Error opening file:", err);
    }
  };

  // Update file content (mark as modified)
  const updateFileContent = (fileHandle, newContent) => {
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.fileHandle === fileHandle ? { ...f, fileContent: newContent, modified: true } : f
      )
    );
    if (currentFile?.fileHandle === fileHandle) {
      setCurrentFile((prev) => ({ ...prev, fileContent: newContent, modified: true }));
    }
  };

  // Save file to disk
  const saveFile = async (file) => {
    if (!file || !file.fileHandle) return false;
    try {
      const writable = await file.fileHandle.createWritable();
      await writable.write(file.fileContent);
      await writable.close();

      // mark as clean
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.fileHandle === file.fileHandle ? { ...f, modified: false } : f
        )
      );
      if (currentFile?.fileHandle === file.fileHandle) {
        setCurrentFile((prev) => ({ ...prev, modified: false }));
      }
      return true;
    } catch (err) {
      console.error("Error saving file:", err);
      return false;
    }
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    const handleSaveShortcut = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (currentFile) {
          saveFile(currentFile);
        }
      }
    };
    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [currentFile]);

  return (
    <FileContext.Provider
      value={{
        currentFile,
        setCurrentFile,
        openFiles,
        setOpenFiles,
        projectTree,
        rootFolderName,
        dirHandle,
        selectedFolder,
        setSelectedFolder,
        openFolder,
        refreshProjectTree,
        createNewFile,
        createNewFolder,
        deleteItem,
        renameItem,
        openFileFromTree,
        getFolderHandleByPath,
        updateFileContent,
        saveFile,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFile = () => useContext(FileContext);

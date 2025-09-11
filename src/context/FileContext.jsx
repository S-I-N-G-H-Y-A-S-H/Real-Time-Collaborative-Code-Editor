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

  const [shouldRedirectToEditor, setShouldRedirectToEditor] = useState(false);

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
    if (!dirHandle) return false;
    setDirHandle(dirHandle);
    setRootFolderName(dirHandle.name);
    const tree = await buildTree(dirHandle);
    setProjectTree(tree);
    setSelectedFolder(null);

    setShouldRedirectToEditor(true);
    return true;
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

  // ✅ New File Anywhere (File menu → Save As dialog)
  const createNewFileAnywhere = async (fileName = "untitled.txt") => {
    try {
      const newHandle = await window.showSaveFilePicker({
        suggestedName: fileName,
      });
      const writable = await newHandle.createWritable();
      await writable.write("");
      await writable.close();

      const file = await newHandle.getFile();
      const text = await file.text();
      const language = getLanguageFromFilename(file.name);

      const openedFile = {
        fileName: file.name,
        fileContent: text,
        fileHandle: newHandle,
        modified: false,
        language,
      };

      setOpenFiles((prev) => [...prev, openedFile]);
      setCurrentFile(openedFile);
      setShouldRedirectToEditor(true);
      return true;
    } catch (err) {
      console.error("Error creating new file anywhere:", err);
      return false;
    }
  };

  // ✅ Create File inside project tree (button next to folder)
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
      await refreshProjectTree();

      const file = await handle.getFile();
      const text = await file.text();
      const language = getLanguageFromFilename(file.name);

      const openedFile = {
        fileName: fileName,
        fileContent: text,
        fileHandle: handle,
        modified: false,
        language,
      };

      setOpenFiles((prev) => [...prev, openedFile]);
      setCurrentFile(openedFile);
    } catch (err) {
      console.error("Error creating file:", err);
    }
  };

  // ✅ Close file (fixes tab close button)
  const closeFile = (fileHandle) => {
    setOpenFiles((prev) => prev.filter((f) => f.fileHandle !== fileHandle));
    if (currentFile?.fileHandle === fileHandle) {
      const remaining = openFiles.filter((f) => f.fileHandle !== fileHandle);
      setCurrentFile(remaining.length > 0 ? remaining[0] : null);
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

  // Delete item
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

  // Open file from tree
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

  // Open file via picker
  const openFileFromPicker = async () => {
    try {
      const [fileHandle] = await window.showOpenFilePicker();
      const file = await fileHandle.getFile();
      const content = await file.text();
      const language = getLanguageFromFilename(file.name);

      const openedFile = {
        fileName: file.name,
        fileContent: content,
        fileHandle,
        modified: false,
        language,
      };

      setOpenFiles((prev) => [...prev, openedFile]);
      setCurrentFile(openedFile);
      setShouldRedirectToEditor(true);
      return true;
    } catch (err) {
      console.error("Open file cancelled or failed:", err);
      return false;
    }
  };

  // Update file content
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

  // Save file
  const saveFile = async (file) => {
    if (!file || !file.fileHandle) return false;
    try {
      const writable = await file.fileHandle.createWritable();
      await writable.write(file.fileContent);
      await writable.close();
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

  // Save As
  const saveFileAs = async (file) => {
    if (!file) return false;
    try {
      const newHandle = await window.showSaveFilePicker({
        suggestedName: file.fileName,
      });
      const writable = await newHandle.createWritable();
      await writable.write(file.fileContent);
      await writable.close();
      const updatedFile = { ...file, fileHandle: newHandle, modified: false };
      setCurrentFile(updatedFile);
      setOpenFiles((prev) =>
        prev.map((f) => (f.fileHandle === file.fileHandle ? updatedFile : f))
      );
      return true;
    } catch (err) {
      console.error("Save As cancelled or failed:", err);
      return false;
    }
  };

  // Keyboard shortcut
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
        createNewFileAnywhere, // for Header menu
        createNewFile,         // for Project Tree "+"
        createNewFolder,
        deleteItem,
        renameItem,
        closeFile,             // ✅ fix for tab cross
        openFileFromTree,
        openFileFromPicker,
        getFolderHandleByPath,
        updateFileContent,
        saveFile,
        saveFileAs,
        shouldRedirectToEditor,
        setShouldRedirectToEditor,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFile = () => useContext(FileContext);

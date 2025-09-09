// src/context/FileContext.jsx
import { createContext, useContext, useState } from "react";
import { openFolder as openFolderAPI } from "../services/FileSystem";

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [currentFile, setCurrentFile] = useState(null);
  const [openFiles, setOpenFiles] = useState([]);
  const [projectTree, setProjectTree] = useState([]);
  const [dirHandle, setDirHandle] = useState(null);
  const [rootFolderName, setRootFolderName] = useState(""); // 🔽 NEW state

  // 🔽 Recursive function to build project tree
  const buildTree = async (directoryHandle) => {
    const tree = [];

    for await (const entry of directoryHandle.values()) {
      if (entry.kind === "file") {
        tree.push({ name: entry.name, type: "file", handle: entry });
      } else if (entry.kind === "directory") {
        const children = await buildTree(entry);
        tree.push({
          name: entry.name,
          type: "folder",
          handle: entry,
          children,
        });
      }
    }

    return tree;
  };

  // Open a folder and build project tree
  const openFolder = async () => {
    const { dirHandle } = await openFolderAPI();
    setDirHandle(dirHandle);

    // save root folder name
    setRootFolderName(dirHandle.name);

    const tree = await buildTree(dirHandle);
    setProjectTree(tree);
  };

  // Refresh project tree
  const refreshProjectTree = async () => {
    if (!dirHandle) return;
    const tree = await buildTree(dirHandle);
    setProjectTree(tree);
  };

  // Create new file in root folder
  const createNewFile = async () => {
    if (!dirHandle) return;
    const fileName = prompt("Enter new file name (with extension):");
    if (!fileName) return;

    try {
      await dirHandle.getFileHandle(fileName, { create: true });
      await refreshProjectTree();
    } catch (err) {
      console.error("Error creating file:", err);
    }
  };

  // Create new folder in root folder
  const createNewFolder = async () => {
    if (!dirHandle) return;
    const folderName = prompt("Enter new folder name:");
    if (!folderName) return;

    try {
      await dirHandle.getDirectoryHandle(folderName, { create: true });
      await refreshProjectTree();
    } catch (err) {
      console.error("Error creating folder:", err);
    }
  };

  // Open file from tree and add to tabs
  const openFileFromTree = async (fileHandle) => {
    if (!fileHandle) return;

    const file = await fileHandle.getFile();
    const content = await file.text();

    const openedFile = { fileName: fileHandle.name, fileContent: content, fileHandle };

    setOpenFiles((prev) => {
      const exists = prev.find((f) => f.fileName === fileHandle.name);
      if (!exists) return [...prev, openedFile];
      return prev;
    });

    setCurrentFile(openedFile);
  };

  // Close a file tab safely
  const closeFile = (fileName) => {
    setOpenFiles((prev) => {
      const updated = prev.filter((f) => f.fileName !== fileName);
      if (currentFile?.fileName === fileName) {
        setCurrentFile(updated.length > 0 ? updated[updated.length - 1] : null);
      }
      return updated;
    });
  };

  return (
    <FileContext.Provider
      value={{
        currentFile,
        setCurrentFile,
        openFiles,
        closeFile,
        projectTree,
        rootFolderName, // 🔽 expose root folder name
        openFolder,
        openFileFromTree,
        createNewFile,
        createNewFolder,
        refreshProjectTree,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFile = () => useContext(FileContext);

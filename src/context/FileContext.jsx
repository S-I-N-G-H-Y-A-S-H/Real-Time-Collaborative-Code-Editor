// src/context/FileContext.jsx
import { createContext, useContext, useState } from "react";
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

  // Build tree
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

  // Open folder
  const openFolder = async () => {
    const { dirHandle } = await openFolderAPI();
    if (!dirHandle) return;
    setDirHandle(dirHandle);
    setRootFolderName(dirHandle.name);
    const tree = await buildTree(dirHandle);
    setProjectTree(tree);
    setSelectedFolder(null);
  };

  // Refresh tree
  const refreshProjectTree = async () => {
    if (!dirHandle) return;
    const tree = await buildTree(dirHandle);
    setProjectTree(tree);
  };

  // ✅ Create new file (with provided name)
  const createNewFile = async (fileName) => {
    if (!dirHandle || !fileName) return;
    const parent = selectedFolder || dirHandle;
    try {
      await parent.getFileHandle(fileName, { create: true });
      await refreshProjectTree();
    } catch (err) {
      console.error("Error creating file:", err);
    }
  };

  // ✅ Create new folder (with provided name)
  const createNewFolder = async (folderName) => {
    if (!dirHandle || !folderName) return;
    const parent = selectedFolder || dirHandle;
    try {
      await parent.getDirectoryHandle(folderName, { create: true });
      await refreshProjectTree();
    } catch (err) {
      console.error("Error creating folder:", err);
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
        const exists = prev.find((f) => f.fileName === fileHandle.name);
        if (!exists) return [...prev, openedFile];
        return prev;
      });
      setCurrentFile(openedFile);
    } catch (err) {
      console.error("Error opening file:", err);
    }
  };

  // Close tab
  const closeFile = (fileName) => {
    setOpenFiles((prev) => {
      const updated = prev.filter((f) => f.fileName !== fileName);
      if (currentFile?.fileName === fileName) {
        setCurrentFile(updated.length > 0 ? updated[updated.length - 1] : null);
      }
      return updated;
    });
  };

  // Update content
  const updateCurrentFileContent = (newContent, modified = true) => {
    if (!currentFile) return;
    const updated = {
      ...currentFile,
      fileContent: newContent ?? "",
      modified,
      language: getLanguageFromFilename(currentFile.fileName),
    };
    setCurrentFile(updated);
    setOpenFiles((prev) =>
      prev.map((f) =>
        f.fileName === updated.fileName ? { ...f, ...updated } : f
      )
    );
  };

  // Save file
  const saveFile = async (fileName) => {
    const file = openFiles.find((f) => f.fileName === fileName) || currentFile;
    if (!file) return false;
    try {
      if (file.fileHandle && typeof file.fileHandle.createWritable === "function") {
        const writable = await file.fileHandle.createWritable();
        await writable.write(file.fileContent ?? "");
        await writable.close();
      } else {
        localStorage.setItem(
          `codefile:${file.fileName}`,
          JSON.stringify({
            name: file.fileName,
            content: file.fileContent,
            savedAt: new Date().toISOString(),
          })
        );
      }
      const updatedFile = { ...file, modified: false };
      setOpenFiles((prev) =>
        prev.map((f) =>
          f.fileName === updatedFile.fileName ? { ...f, modified: false } : f
        )
      );
      if (currentFile?.fileName === updatedFile.fileName) {
        setCurrentFile({ ...currentFile, modified: false });
      }
      return true;
    } catch (err) {
      console.error("Save failed for", fileName, err);
      return false;
    }
  };

  const saveCurrentFile = async () => {
    if (!currentFile) return false;
    return await saveFile(currentFile.fileName);
  };

  return (
    <FileContext.Provider
      value={{
        currentFile,
        setCurrentFile,
        openFiles,
        closeFile,
        projectTree,
        rootFolderName,
        dirHandle,
        selectedFolder,
        setSelectedFolder,
        openFolder,
        openFileFromTree,
        createNewFile,
        createNewFolder,
        refreshProjectTree,
        updateCurrentFileContent,
        saveFile,
        saveCurrentFile,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

export const useFile = () => useContext(FileContext);

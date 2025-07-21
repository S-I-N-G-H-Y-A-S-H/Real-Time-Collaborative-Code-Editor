import { createContext, useContext, useState } from 'react';

// Default structure of a file
const initialFileState = {
  fileName: '',
  fileContent: '',
  fileHandle: null,
};

const FileContext = createContext();

export const FileProvider = ({ children }) => {
  const [currentFile, setCurrentFile] = useState(initialFileState);

  return (
    <FileContext.Provider value={{ currentFile, setCurrentFile }}>
      {children}
    </FileContext.Provider>
  );
};

export const useFile = () => useContext(FileContext);

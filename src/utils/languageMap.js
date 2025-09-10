// src/utils/languageMap.js
// Generated from RapidAPI Judge0 Extra CE languages.json

export const languageMap = {
  py: {
    id: 27, // Python 3.9 (PyPy 7.3.12)
    name: "Python 3.9 (PyPy 7.3.12)",
    runCmd: "python {file}",
  },
  java: {
    id: 4, // Java (OpenJDK 14.0.1)
    name: "Java (OpenJDK 14.0.1)",
    runCmd: "javac {file} && java {main}",
  },
  c: {
    id: 1, // C (Clang 10.0.1)
    name: "C (Clang 10.0.1)",
    runCmd: "clang {file} -o a.out && ./a.out",
  },
  cpp: {
    id: 2, // C++ (Clang 10.0.1)
    name: "C++ (Clang 10.0.1)",
    runCmd: "clang++ {file} -o a.out && ./a.out",
  },

  // HTML handled locally
  html: { id: null, name: "HTML", runCmd: "open {file}" },
};

/**
 * Get Judge0 language info from filename.
 * @param {string} filename
 * @returns {Object|null} { id, name, runCmd }
 */
export function getLanguageFromFilename(filename) {
  if (!filename || !filename.includes(".")) return null;
  const ext = filename.split(".").pop().toLowerCase();
  return languageMap[ext] || null;
}

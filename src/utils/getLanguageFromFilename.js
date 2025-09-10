// src/utils/getLanguageFromFilename.js
// Detect Monaco Editor language + execution server language from file extension or special filename.

const extToLang = {
  // JS / TS
  js: { monaco: "javascript", exec: "js" },
  jsx: { monaco: "javascript", exec: "js" },
  ts: { monaco: "typescript", exec: "js" }, // exec maps to node/js
  tsx: { monaco: "typescript", exec: "js" },

  // Web
  html: { monaco: "html", exec: null }, // cannot execute
  htm: { monaco: "html", exec: null },
  css: { monaco: "css", exec: null },
  scss: { monaco: "scss", exec: null },
  less: { monaco: "less", exec: null },

  // Common languages
  java: { monaco: "java", exec: "java" },
  py: { monaco: "python", exec: "python" },
  rb: { monaco: "ruby", exec: null }, // not supported yet
  php: { monaco: "php", exec: null },
  go: { monaco: "go", exec: null },
  rs: { monaco: "rust", exec: null },
  c: { monaco: "c", exec: "cpp" }, // treat as C++ for execution
  cpp: { monaco: "cpp", exec: "cpp" },
  h: { monaco: "cpp", exec: "cpp" },
  cs: { monaco: "csharp", exec: null },
  swift: { monaco: "swift", exec: null },
  kt: { monaco: "kotlin", exec: null },
  kotlin: { monaco: "kotlin", exec: null },

  // Shell / scripts
  sh: { monaco: "shell", exec: null },
  bash: { monaco: "shell", exec: null },
  zsh: { monaco: "shell", exec: null },
  ps1: { monaco: "powershell", exec: null },

  // Data / markup
  json: { monaco: "json", exec: null },
  md: { monaco: "markdown", exec: null },
  markdown: { monaco: "markdown", exec: null },
  yaml: { monaco: "yaml", exec: null },
  yml: { monaco: "yaml", exec: null },
  toml: { monaco: "toml", exec: null },
  xml: { monaco: "xml", exec: null },

  // Specials
  dockerfile: { monaco: "dockerfile", exec: null },
  makefile: { monaco: "makefile", exec: null },
};

/**
 * Map a filename to both Monaco and execution server language strings.
 * @param {string} filename
 * @returns {{ monacoLang: string, execLang: string|null, name: string }}
 */
export default function getLanguageFromFilename(filename) {
  if (!filename || typeof filename !== "string") {
    return { monacoLang: "plaintext", execLang: null, name: "Plaintext" };
  }
  const lower = filename.toLowerCase().trim();

  // Handle special names with no extension
  if (lower === "makefile") return { monacoLang: "makefile", execLang: null, name: "Makefile" };
  if (lower === "dockerfile") return { monacoLang: "dockerfile", execLang: null, name: "Dockerfile" };

  if (!lower.includes(".")) {
    return { monacoLang: "plaintext", execLang: null, name: "Plaintext" };
  }

  const ext = lower.split(".").pop();
  const mapping = extToLang[ext];

  if (!mapping) {
    return { monacoLang: "plaintext", execLang: null, name: "Plaintext" };
  }

  return {
    monacoLang: mapping.monaco,
    execLang: mapping.exec,
    name: mapping.monaco.charAt(0).toUpperCase() + mapping.monaco.slice(1),
  };
}

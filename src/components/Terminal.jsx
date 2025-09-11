// src/components/Terminal.jsx
import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import "../styles/Terminal.css";

import { runCode } from "../api/execution";
import getLanguageFromFilename from "../utils/getLanguageFromFilename";
import { useFile } from "../context/FileContext";

function TerminalComponent({ refExecute }) {
  const terminalRef = useRef(null);
  const xterm = useRef(null);
  const fitAddon = useRef(null);
  const inputBuffer = useRef("");

  const { currentFile } = useFile();

  const printLine = (text = "") => {
    xterm.current?.writeln(text);
  };

  const executeFile = async (filename, source) => {
    const langInfo = getLanguageFromFilename(filename);

    if (!langInfo || !langInfo.execLang) {
      printLine(`⚠️ This file type cannot be executed: ${filename}`);
      return;
    }

    try {
      printLine(`\r\n[Running ${filename} in ${langInfo.name}]`);

      const result = await runCode(langInfo.execLang, source, "");

      if (result.error) {
        printLine(`Error: ${result.error}`);
        return;
      }
      if (result.compileError) {
        printLine("Compilation Error:");
        if (result.stderr) printLine(result.stderr);
        if (result.stdout) printLine(result.stdout);
        return;
      }
      if (result.timedOut) {
        printLine("Execution timed out.");
      }

      if (result.stdout) {
        printLine("Output:");
        result.stdout.split(/\r?\n/).forEach((line) => {
          if (line.trim().length > 0) {
            printLine(line);
          }
        });
      }

      if (result.stderr) {
        printLine("Errors:");
        result.stderr.split(/\r?\n/).forEach((line) => {
          if (line.trim().length > 0) {
            printLine(line);
          }
        });
      }

      if (!result.stdout && !result.stderr) {
        printLine("[No output]");
      }
    } catch (err) {
      printLine(`Execution failed: ${err.message}`);
    }
  };

  // Expose executeFile to parent (EditorPage or Header)
  useEffect(() => {
    if (typeof refExecute === "function") {
      refExecute(executeFile);
    }

    // ✅ Expose globally so Header can call it
    window.__executeFile = executeFile;
  }, [refExecute]);

  useEffect(() => {
    const initTerminal = () => {
      if (!terminalRef.current || xterm.current) return;

      xterm.current = new Terminal({
        cursorBlink: true,
        fontFamily: "monospace",
        fontSize: 14,
        theme: {
          background: "#1e1e1e",
          foreground: "#ffffff",
        },
        scrollback: 1000,
      });

      fitAddon.current = new FitAddon();
      xterm.current.loadAddon(fitAddon.current);
      xterm.current.open(terminalRef.current);
      fitAddon.current.fit();

      xterm.current.focus();

      xterm.current.writeln("Welcome to the terminal!");
      xterm.current.write(">");

      xterm.current.onData((data) => {
        const char = data.charCodeAt(0);

        if (char === 13) {
          // ENTER
          const command = inputBuffer.current.trim();
          xterm.current.write("\r\n");

          if (
            command.startsWith("python") ||
            command.startsWith("gcc") ||
            command.startsWith("g++") ||
            command.startsWith("javac")
          ) {
            if (currentFile) {
              executeFile(currentFile.fileName, currentFile.fileContent);
            } else {
              printLine("No active file open.");
            }
          } else if (command) {
            printLine(`Unknown command: ${command}`);
          }

          inputBuffer.current = "";
          xterm.current.write(">");
        } else if (char === 127) {
          // BACKSPACE
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            xterm.current.write("\b \b");
          }
        } else {
          inputBuffer.current += data;
          xterm.current.write(data);
        }
      });

      const handleResize = () => fitAddon.current?.fit();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        xterm.current?.dispose();
        fitAddon.current = null;
        xterm.current = null;
      };
    };

    setTimeout(initTerminal, 0);
  }, [currentFile]);

  return <div ref={terminalRef} className="terminal-container" />;
}

export default TerminalComponent;

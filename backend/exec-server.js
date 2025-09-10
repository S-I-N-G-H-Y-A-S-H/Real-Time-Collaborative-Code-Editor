// backend/exec-server.js
import express from "express";
import cors from "cors";
import fsPromises from "fs/promises";
import os from "os";
import path from "path";
import { exec, spawnSync } from "child_process";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

function commandExists(cmd) {
  try {
    const isWin = process.platform === "win32";
    const checker = isWin ? "where" : "which";
    const res = spawnSync(checker, [cmd], { encoding: "utf8" });
    return res.status === 0;
  } catch {
    return false;
  }
}

function getRuntimeStatus() {
  return {
    python: commandExists("python3") || commandExists("python"),
    node: commandExists("node"),
    gpp: commandExists("g++"),
    javac: commandExists("javac"),
    java: commandExists("java"),
  };
}

function runShellCommand(
  command,
  {
    cwd = undefined,
    timeout = 5000,
    stdin = undefined,
    maxBuffer = 10 * 1024 * 1024,
  } = {}
) {
  return new Promise((resolve) => {
    const child = exec(
      command,
      { cwd, timeout, maxBuffer, shell: true },
      (error, stdout, stderr) => {
        resolve({ error, stdout: stdout ?? "", stderr: stderr ?? "" });
      }
    );
    if (stdin && child.stdin) {
      child.stdin.write(String(stdin));
      child.stdin.end();
    }
  });
}

app.get("/check", (req, res) => {
  res.json(getRuntimeStatus());
});

app.post("/run", async (req, res) => {
  try {
    const { language, code = "", stdin = "", timeout = 5000 } = req.body;
    if (!language) return res.status(400).json({ error: "language required" });

    const status = getRuntimeStatus();
    const tempDir = await fsPromises.mkdtemp(path.join(os.tmpdir(), "exec-"));
    const isWin = process.platform === "win32";

    let srcFile,
      compileNeeded = false,
      compileCmd = null,
      runCmd = null,
      exeName = null,
      className = null;

    if (language === "python") {
      let pythonCmd = null;
      if (isWin) {
        // ✅ Fix: prefer "python" on Windows (python3 alias is broken)
        pythonCmd = commandExists("python") ? "python" : null;
      } else {
        pythonCmd = commandExists("python3")
          ? "python3"
          : commandExists("python")
          ? "python"
          : null;
      }

      if (!pythonCmd) {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
        return res
          .status(400)
          .json({ error: "Python not found. Install python3 or python." });
      }

      srcFile = "main.py";
      await fsPromises.writeFile(path.join(tempDir, srcFile), code);
      runCmd = `${pythonCmd} ${srcFile}`;
    } else if (language === "js" || language === "javascript") {
      if (!status.node) {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
        return res.status(400).json({ error: "Node.js not found." });
      }
      srcFile = "main.js";
      await fsPromises.writeFile(path.join(tempDir, srcFile), code);
      runCmd = `node ${srcFile}`;
    } else if (language === "cpp" || language === "c++") {
      if (!status.gpp) {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
        return res
          .status(400)
          .json({ error: "g++ not found. Install MSYS2/MinGW or gcc." });
      }
      srcFile = "main.cpp";
      exeName = isWin ? "a.exe" : "a.out";
      await fsPromises.writeFile(path.join(tempDir, srcFile), code);
      compileNeeded = true;
      compileCmd = `g++ ${srcFile} -o ${exeName}`;
      runCmd = `"${path.join(tempDir, exeName)}"`;
    } else if (language === "java") {
      if (!status.javac || !status.java) {
        await fsPromises.rm(tempDir, { recursive: true, force: true });
        return res.status(400).json({ error: "JDK not found (javac/java)." });
      }
      className = "Main";
      srcFile = `${className}.java`;
      await fsPromises.writeFile(path.join(tempDir, srcFile), code);
      compileNeeded = true;
      compileCmd = `javac ${srcFile}`;
      runCmd = `java -cp . ${className}`;
    } else {
      await fsPromises.rm(tempDir, { recursive: true, force: true });
      return res.status(400).json({ error: "Unsupported language." });
    }

    if (compileNeeded) {
      const compRes = await runShellCommand(compileCmd, {
        cwd: tempDir,
        timeout,
      });
      if (compRes.error) {
        const timedOut =
          compRes.error.killed ||
          compRes.error.signal === "SIGTERM" ||
          compRes.error.code === "ETIMEDOUT";
        await fsPromises.rm(tempDir, { recursive: true, force: true });
        return res.json({
          compileError: true,
          stdout: compRes.stdout,
          stderr: compRes.stderr,
          timedOut: !!timedOut,
          message: "Compilation failed",
        });
      }
    }

    const runRes = await runShellCommand(runCmd, {
      cwd: tempDir,
      timeout,
      stdin,
    });
    const timedOut = !!(runRes.error && runRes.error.killed);
    const result = {
      compileError: false,
      stdout: runRes.stdout,
      stderr: runRes.stderr,
      timedOut,
    };

    try {
      await fsPromises.rm(tempDir, { recursive: true, force: true });
    } catch (_) {}

    return res.json(result);
  } catch (err) {
    console.error("Exec-server error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

const port = process.env.EXEC_PORT || 3000;
app.listen(port, () => {
  console.log(`Exec server listening on http://localhost:${port}`);
  console.log("Runtimes:", getRuntimeStatus());
});

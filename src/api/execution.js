export async function runCode(language, code, stdin = "", timeoutMs = 5000) {
  try {
    const res = await fetch("http://localhost:3000/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ language, code, stdin, timeout: timeoutMs }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || `Exec server returned ${res.status}`);
    }
    return await res.json(); // { compileError, stdout, stderr, timedOut }
  } catch (err) {
    return { error: err.message || String(err) };
  }
}

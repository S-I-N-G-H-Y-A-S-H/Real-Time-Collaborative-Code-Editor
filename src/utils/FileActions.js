// src/utils/FileActions.js
export async function createNewFileWithPrompt() {
  const fileName = prompt("Enter file name (with extension):", "main.js");
  if (!fileName) return;

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [{
        description: 'Code files',
        accept: { 'text/plain': ['.js', '.py', '.txt', '.html', '.css', '.java'] },
      }],
    });

    const writable = await handle.createWritable();
    await writable.write(""); // Write empty content
    await writable.close();
    alert(`File "${fileName}" created successfully!`);

  } catch (err) {
    console.error("File creation cancelled or failed:", err);
  }
}

export async function openFileFromDisk() {
  try {
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const content = await file.text();
    alert(`Opened file: ${file.name}\nContent Preview:\n${content.slice(0, 100)}...`);
    // You can pass this content to the editor now
  } catch (err) {
    console.error("File open cancelled or failed:", err);
  }
}

export async function openFolderFromDisk() {
  try {
    const dirHandle = await window.showDirectoryPicker();
    const files = [];

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        files.push(entry.name);
      }
    }

    alert(`Files in selected folder:\n${files.join('\n')}`);
    // You can store the file handles for later use
  } catch (err) {
    console.error("Folder open cancelled or failed:", err);
  }
}


export async function createFile(fileName) {
  const handle = await window.showSaveFilePicker({
    suggestedName: fileName,
    types: [{
      description: 'Code files',
      accept: { 'text/plain': ['.js', '.py', '.txt', '.html', '.css', '.java'] },
    }],
  });

  const writable = await handle.createWritable();
  await writable.write("");
  await writable.close();

  const file = await handle.getFile();
  const content = await file.text();

  return { fileName: file.name, fileContent: content, fileHandle: handle };
}

export async function openFile() {
  const [fileHandle] = await window.showOpenFilePicker();
  const file = await fileHandle.getFile();
  const content = await file.text();

  return { fileName: file.name, fileContent: content, fileHandle };
}

export async function openFolder() {
  const dirHandle = await window.showDirectoryPicker();
  const files = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") files.push(entry.name);
  }
  return { dirHandle, files };
}

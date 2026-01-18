// utils/buildProjectTree.js
export function buildProjectTree(files = []) {
  const root = [];

  const findOrCreateFolder = (children, name, fullPath) => {
    let folder = children.find(
      (n) => n.type === "folder" && n.name === name
    );

    if (!folder) {
      folder = {
        name,
        type: "folder",
        path: fullPath,
        children: [],
      };
      children.push(folder);
    }

    return folder;
  };

  files.forEach((file) => {
    const parts = file.path.split("/").filter(Boolean);
    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath
        ? `${currentPath}/${part}`
        : part;

      const isLast = index === parts.length - 1;

      if (isLast) {
        // file
        currentLevel.push({
          name: part,
          type: "file",
          path: currentPath,
        });
      } else {
        // folder
        const folder = findOrCreateFolder(
          currentLevel,
          part,
          currentPath
        );
        currentLevel = folder.children;
      }
    });
  });

  return root;
}

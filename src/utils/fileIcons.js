// src/utils/fileIcons.js

import jsIcon from "../assets/ExtensionIcons/js.png";
import cssIcon from "../assets/ExtensionIcons/css.png";
import htmlIcon from "../assets/ExtensionIcons/html.png";
import pythonIcon from "../assets/ExtensionIcons/python.png";
import cIcon from "../assets/ExtensionIcons/c.png";
import cppIcon from "../assets/ExtensionIcons/cpp.png";
import csharpIcon from "../assets/ExtensionIcons/csharp.png";
import javaIcon from "../assets/ExtensionIcons/java.png";
import reactIcon from "../assets/ExtensionIcons/react.png";
import mdIcon from "../assets/ExtensionIcons/md.png";
import jsonIcon from "../assets/ExtensionIcons/json.png";
import tsIcon from "../assets/ExtensionIcons/typeScript.png";
import defaultFileIcon from "../assets/ExtensionIcons/defaultFile-icon.png";

// ⬅ Add more icons as you need

export function getFileIcon(filename) {
  if (!filename) return defaultFileIcon;

  const ext = filename.split(".").pop().toLowerCase();

  switch (ext) {
    case "js":
      return jsIcon;
    case "html":
      return htmlIcon;
    case "css":
      return cssIcon;
    case "py":
      return pythonIcon;
    case "c":
      return cIcon;
    case "cpp":
      return cppIcon;
    case "cs":
      return csharpIcon;
    case "java":
      return javaIcon;
    case "jsx":
      return reactIcon;
    case "md":
      return mdIcon;
    case "ts":
      return tsIcon;
    case "json":
      return jsonIcon;
    default:
      return defaultFileIcon;
  }
}

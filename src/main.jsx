import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/index.css";

import { FileProvider } from "./context/FileContext";
import { SidebarProvider } from "./context/SidebarContext"; // ✅ new

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FileProvider>
      <SidebarProvider> {/*wrap here*/}
        <App />
      </SidebarProvider>
    </FileProvider>
  </React.StrictMode>
);

// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { FileProvider } from "./context/FileContext";
import { SidebarProvider } from "./context/SidebarContext";
import { EditorProvider } from "./context/EditorContext";
import { RoomSyncProvider } from "./context/RoomSyncContext";
import { ProjectProvider } from "./context/ProjectContext"; // ✅ ADD THIS

import WelcomePage from "./pages/WelcomePage";
import EditorPage from "./pages/EditorPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

/**
 * Simple auth guard
 */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <FileProvider>
        <SidebarProvider>
          <EditorProvider>
            <RoomSyncProvider>
              {/* ✅ ALWAYS MOUNT PROJECT PROVIDER */}
              <ProjectProvider>
                <Routes>
                  {/* Auth */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />

                  {/* App */}
                  <Route
                    path="/welcome"
                    element={
                      <ProtectedRoute>
                        <WelcomePage />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/editor"
                    element={
                      <ProtectedRoute>
                        <EditorPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Default */}
                  <Route
                    path="*"
                    element={<Navigate to="/welcome" replace />}
                  />
                </Routes>
              </ProjectProvider>
            </RoomSyncProvider>
          </EditorProvider>
        </SidebarProvider>
      </FileProvider>
    </BrowserRouter>
  );
}

export default App;

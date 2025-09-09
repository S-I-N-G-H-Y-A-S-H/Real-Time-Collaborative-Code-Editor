import { createContext, useContext, useState } from "react";

const SidebarContext = createContext();

export function SidebarProvider({ children }) {
    const [isVisible, setIsVisible] = useState(true); // sidebar toggle
    const [activePanel, setActivePanel] = useState(null); // which panel is open

    const toggleSidebar = () => setIsVisible((prev) => !prev);

    return (
        <SidebarContext.Provider
            value={{ isVisible, toggleSidebar, activePanel, setActivePanel }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    return useContext(SidebarContext);
}

import { createContext, useState, useContext } from "react";

const SessionContext = createContext();

export function SessionProvider({ children }) {
    const [sessionExpired, setSessionExpired] = useState(false);

    const handleSessionExpired = () => {
        setSessionExpired(true);
    };

    const resetSession = () => {
        setSessionExpired(false);
    };

    return (
        <SessionContext.Provider value={{ sessionExpired, handleSessionExpired, resetSession }}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    return useContext(SessionContext);
}

// Global reference for use outside React components (like in servicesApi.js)
let globalSessionHandler = null;

export const setGlobalSessionHandler = (handler) => {
    globalSessionHandler = handler;
};

export const triggerSessionExpired = () => {
    if (globalSessionHandler) {
        globalSessionHandler();
    }
};
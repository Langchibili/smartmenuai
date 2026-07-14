
"use client";
import { Box } from "@mui/material";
import { createContext, useContext, useState, useCallback } from "react";

const ToastContext = createContext({ toast: () => { } });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  const typeStyles = {
    success: { bg: "rgba(34,197,94,0.12)", color: "#22c55e", border: "rgba(34,197,94,0.3)" },
    error: { bg: "rgba(239,68,68,0.12)", color: "#ef4444", border: "rgba(239,68,68,0.3)" },
    info: { bg: "rgba(212,133,10,0.12)", color: "#D4850A", border: "rgba(212,133,10,0.3)" },
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Box component="div" sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 1, maxWidth: "320px" }}>
        {toasts.map(t => {
          const s = typeStyles[t.type] || typeStyles.info;
          return (
            <Box key={t.id} sx={{
              px: 2.5, py: 1.5, borderRadius: "14px", fontSize: "0.875rem", fontWeight: 500,
              background: s.bg, color: s.color, border: `1px solid ${s.border}`,
              backdropFilter: "blur(8px)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              animation: "slideUp 0.3s ease-out",
              "@keyframes slideUp": { from: { opacity: 0, transform: "translateY(10px)" }, to: { opacity: 1, transform: "translateY(0)" } },
            }}>
              {t.message}
            </Box>
          );
        })}
      </Box>
    </ToastContext.Provider>
  );
}



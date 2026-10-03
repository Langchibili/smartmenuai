
"use client";
import { Box } from "@mui/material";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { subscribeBusinessActivity } from "@/lib/socket";

const ToastContext = createContext({ toast: () => { } });
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const { business } = useAuth();

  const toast = useCallback((message, type = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => subscribeBusinessActivity((event, payload) => {
    if (event === "orders_event") {
      toast(
        payload?.type === "create"
          ? `New order received${payload.data?.table_number ? ` for Table ${payload.data.table_number}` : ""}`
          : `Order ${payload.data?.order_number || ""} ${payload.data?.status || "updated"}`.trim(),
        "info"
      );
    } else if (event === "waiter_calls_event") {
      if (payload?.type === "create") {
        toast(
          `Waiter requested${payload.data?.table_number ? ` at Table ${payload.data.table_number}` : ""}${payload.data?.message ? `: ${payload.data.message}` : ""}`,
          "info"
        );
      } else if (payload?.type === "acknowledged") {
        toast("A waiter call is being handled", "info");
      }
    } else if (event === "table_status_updated" && payload?.status) {
      toast(
        `Table ${payload.table_number || ""} is now ${payload.status}`.trim(),
        "info"
      );
    } else if (event === "notification:new") {
      toast(payload?.title || payload?.message || "You have a new notification", "info");
    }
  }, business?.id), [business?.id, toast]);

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

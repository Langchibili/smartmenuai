
"use client";
import { Alert, Box, Snackbar } from "@mui/material";
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
    setToasts(prev => [...prev.slice(-2), { id, message, type }]);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => subscribeBusinessActivity((event, payload) => {
    if (event === "orders_event") {
      toast(
        payload?.type === "create"
          ? `New order received${payload.data?.table_number ? ` for Table ${payload.data.table_number}` : ""}`
          : `Order ${payload.data?.numeric_order_number || payload.data?.order_number || ""} ${payload.data?.status || "updated"}`.trim(),
        "info"
      );
    } else if (event === "waiter_calls_event") {
      if (payload?.type === "create") {
        const isBillRequest = payload.data?.request_type === "bill";
        toast(
          `${isBillRequest ? "Bill requested" : "Waiter requested"}${payload.data?.table_number ? ` at Table ${payload.data.table_number}` : ""}${payload.data?.message ? `: ${payload.data.message}` : ""}`,
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

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <Box aria-live="polite" aria-atomic="false">
        {toasts.map((t, index) => (
          <Snackbar
            key={t.id}
            open
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            autoHideDuration={3500}
            onClose={() => dismiss(t.id)}
            sx={{
              bottom: `${24 + index * 76}px !important`,
              maxWidth: "min(420px, calc(100vw - 32px))",
              right: { xs: 16, sm: 24 },
            }}
          >
            <Alert
              severity={t.type === "success" || t.type === "error" || t.type === "warning" ? t.type : "info"}
              variant="filled"
              onClose={() => dismiss(t.id)}
              sx={{ width: "100%" }}
            >
              {t.message}
            </Alert>
          </Snackbar>
        ))}
      </Box>
    </ToastContext.Provider>
  );
}

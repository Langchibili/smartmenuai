"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  Chip,
  Grid,
  CircularProgress,
  alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { waiterCallApi, orderApi } from "@/lib/api";
import { formatRelativeTime, formatCurrency, orderStatusLabel } from "@/lib/utils";
import { useToast } from "@/components/ui/toast-provider";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND = "#D4850A";
const BRAND_DARK = "#A0622A";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const ERROR = "#ef4444";
const WARNING = "#f59e0b";

// ─── Table status colours ─────────────────────────────────────────────────────
const TABLE_STATUS_STYLE = {
  available: { bg: alpha(GREEN, 0.08), border: alpha(GREEN, 0.2), dot: GREEN },
  occupied: { bg: alpha(BRAND, 0.1), border: alpha(BRAND, 0.25), dot: BRAND },
  ordering: { bg: alpha(BLUE, 0.08), border: alpha(BLUE, 0.2), dot: BLUE },
  needs_waiter: { bg: alpha(ERROR, 0.12), border: alpha(ERROR, 0.35), dot: ERROR },
  bill_requested: { bg: alpha(WARNING, 0.08), border: alpha(WARNING, 0.2), dot: WARNING },
};

export default function WaiterDashboard() {
  const { employee, business } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);

  const load = useCallback(async () => {
    if (!employee?.id || !business?.id) return;
    try {
      const res = await waiterCallApi.getWaiterDashboard(employee.id, business.id);
      setData(res);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [employee?.id, business?.id]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setInterval(load, 15_000); return () => clearInterval(t); }, [load]);

  const toggleAvailability = async () => {
    if (!employee?.id) return;
    try {
      await waiterCallApi.toggleAvailability(employee.id, !available);
      setAvailable(v => !v);
      toast(!available ? "You're now available" : "You're now off shift", "success");
    } catch (e) { toast(e.message, "error"); }
  };

  const acknowledgeCall = async (callId) => {
    try {
      await waiterCallApi.acknowledgeCall(callId, employee?.id);
      toast("Call acknowledged", "success");
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  const advanceOrder = async (orderId, currentStatus) => {
    const NEXT = { accepted: "preparing", preparing: "served" };
    const next = NEXT[currentStatus];
    if (!next) return;
    try {
      await orderApi.updateOrderStatus(orderId, next, employee?.id);
      toast(`Order marked ${next}`, "success");
      load();
    } catch (e) { toast(e.message, "error"); }
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Stack spacing={2}>
          {[...Array(3)].map((_, i) => (
            <Box key={i} sx={{ height: 96, borderRadius: "14px", bgcolor: "rgba(45,18,0,0.6)" }} />
          ))}
        </Stack>
      </Box>
    );
  }

  const currency = business?.currency ?? "USD";
  const activeCalls = (data?.activeCalls ?? []).filter((c) => c.status === "pending");
  const myOrders = data?.activeOrders ?? [];
  const tables = data?.assignedTables ?? [];

  return (
    <Box sx={{ pb: 10, maxWidth: "640px", mx: "auto" }}>
      {/* Header */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          px: 2,
          pt: 2.5,
          pb: 2,
          background: alpha("#0D0400", 0.95),
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(212,133,10,0.1)",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: TEXT_P, fontSize: "1.25rem" }}>
              Hi, {employee?.full_name?.split(" ")[0]} 👋
            </Typography>
            <Typography variant="caption" sx={{ color: TEXT_M }}>
              {activeCalls.length > 0
                ? `🔔 ${activeCalls.length} table${activeCalls.length > 1 ? "s" : ""} calling`
                : "All quiet"}
            </Typography>
          </Box>

          {/* Availability toggle */}
          <Button
            onClick={toggleAvailability}
            size="small"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2,
              py: 1,
              borderRadius: "12px",
              border: "1px solid",
              fontWeight: 600,
              fontSize: "0.85rem",
              background: available ? alpha(GREEN, 0.1) : alpha(ERROR, 0.08),
              borderColor: available ? alpha(GREEN, 0.3) : alpha(ERROR, 0.25),
              color: available ? GREEN : ERROR,
              transition: "all 0.2s",
              "&:hover": {
                background: available ? alpha(GREEN, 0.15) : alpha(ERROR, 0.12),
              },
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: available ? GREEN : ERROR,
                boxShadow: available ? `0 0 6px ${GREEN}` : "none",
              }}
            />
            {available ? "Available" : "Off shift"}
          </Button>
        </Stack>
      </Box>

      {/* Body */}
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 3 }}>
        {/* Active waiter calls */}
        {activeCalls.length > 0 && (
          <Box>
            <Typography sx={{ fontWeight: 600, color: BRAND, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem", mb: 1.5 }}>
              🔔 Waiter calls ({activeCalls.length})
            </Typography>
            <Stack spacing={1.5}>
              {activeCalls.map((call) => (
                <motion.div key={call.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      px: 2.5,
                      py: 2,
                      borderRadius: "14px",
                      background: alpha(ERROR, 0.08),
                      border: `1px solid ${alpha(ERROR, 0.3)}`,
                      "@keyframes pulse-brand": {
                        "0%": { borderColor: alpha(ERROR, 0.3) },
                        "50%": { borderColor: alpha(ERROR, 0.6) },
                        "100%": { borderColor: alpha(ERROR, 0.3) },
                      },
                      animation: "pulse-brand 2s infinite",
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        background: alpha(ERROR, 0.15),
                        color: ERROR,
                        border: `1px solid ${alpha(ERROR, 0.3)}`,
                        flexShrink: 0,
                      }}
                    >
                      {call.table?.table_number ?? "?"}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 600, color: TEXT_P, fontSize: "0.9rem" }}>
                        Table {call.table?.table_number}
                      </Typography>
                      {call.message && (
                        <Typography variant="caption" sx={{ color: TEXT_M, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {call.message}
                        </Typography>
                      )}
                      <Typography variant="caption" sx={{ color: TEXT_D }}>
                        {formatRelativeTime(call.created_at)}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => acknowledgeCall(call.id)}
                      sx={{
                        borderRadius: "10px",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                        background: alpha(ERROR, 0.15),
                        color: ERROR,
                        border: `1px solid ${alpha(ERROR, 0.3)}`,
                        boxShadow: "none",
                        "&:hover": { background: alpha(ERROR, 0.25) },
                      }}
                    >
                      Respond
                    </Button>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </Box>
        )}

        {/* My orders */}
        {myOrders.length > 0 && (
          <Box>
            <Typography sx={{ fontWeight: 600, color: TEXT_M, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem", mb: 1.5 }}>
              My orders ({myOrders.length})
            </Typography>
            <Stack spacing={1.5}>
              {myOrders.map((order) => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      px: 2.5,
                      py: 2,
                      borderRadius: "14px",
                      background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
                      border: "1px solid rgba(107,51,24,0.25)",
                      backdropFilter: "blur(6px)",
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.9rem",
                        background: alpha(BRAND, 0.12),
                        color: BRAND,
                        border: `1px solid ${alpha(BRAND, 0.2)}`,
                        flexShrink: 0,
                      }}
                    >
                      {order.table?.table_number ?? "?"}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                        <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: TEXT_S }}>
                          {order.order_number}
                        </Typography>
                        <Chip
                          label={orderStatusLabel(order.status)}
                          size="small"
                          color={
                            order.status === "pending" ? "warning" :
                              order.status === "accepted" ? "info" :
                                order.status === "preparing" ? "secondary" :
                                  order.status === "served" ? "success" : "default"
                          }
                          sx={{ fontWeight: 600, fontSize: "0.65rem" }}
                        />
                      </Stack>
                      <Typography variant="caption" sx={{ color: TEXT_M, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {(order.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                      <Typography sx={{ fontWeight: 600, color: TEXT_P, fontSize: "0.9rem", mb: 0.5 }}>
                        {formatCurrency(order.total ?? 0, currency)}
                      </Typography>
                      {["accepted", "preparing"].includes(order.status) && (
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => advanceOrder(order.id, order.status)}
                          sx={{
                            borderRadius: "10px",
                            fontWeight: 600,
                            fontSize: "0.7rem",
                            background: alpha(BRAND, 0.15),
                            color: BRAND,
                            border: `1px solid ${alpha(BRAND, 0.25)}`,
                            boxShadow: "none",
                            "&:hover": { background: alpha(BRAND, 0.25) },
                          }}
                        >
                          {order.status === "accepted" ? "Preparing" : "Served →"}
                        </Button>
                      )}
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Stack>
          </Box>
        )}

        {/* Assigned tables */}
        <Box>
          <Typography sx={{ fontWeight: 600, color: TEXT_M, textTransform: "uppercase", letterSpacing: "0.05em", fontSize: "0.75rem", mb: 1.5 }}>
            My tables ({tables.length})
          </Typography>
          {tables.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <Typography sx={{ fontSize: "2rem", mb: 1 }}>🪑</Typography>
              <Typography variant="body2" sx={{ color: TEXT_D }}>No tables assigned yet</Typography>
            </Box>
          ) : (
            <Grid container spacing={1.5}>
              {tables.map((table) => {
                const sc = TABLE_STATUS_STYLE[table.status] ?? TABLE_STATUS_STYLE.available;
                return (
                  <Grid item xs={4} key={table.id}>
                    <Box
                      sx={{
                        aspectRatio: "1/1",
                        borderRadius: "14px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        textAlign: "center",
                        p: 1,
                        background: sc.bg,
                        border: `1px solid ${sc.border}`,
                      }}
                    >
                      <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: sc.dot, mb: 1 }} />
                      <Typography sx={{ fontWeight: 700, color: TEXT_P, fontSize: "1.1rem" }}>
                        {table.table_number}
                      </Typography>
                      <Typography variant="caption" sx={{ color: sc.dot, textTransform: "capitalize", fontSize: "0.6rem" }}>
                        {table.status.replace("_", " ")}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>

        {activeCalls.length === 0 && myOrders.length === 0 && tables.length === 0 && (
          <Box sx={{ textAlign: "center", py: 10 }}>
            <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>☕</Typography>
            <Typography variant="body2" sx={{ color: TEXT_M }}>Quiet right now</Typography>
            <Typography variant="caption" sx={{ color: TEXT_D, display: "block", mt: 0.5 }}>No active calls or orders</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
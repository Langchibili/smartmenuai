"use client";
import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { orderApi, tableApi } from "@/lib/api";
import { PageHeader, StatCard } from "@/components/ui/page-header";
import { formatCurrency, formatRelativeTime, orderStatusLabel } from "@/lib/utils";
import { subscribeBusinessActivity } from "@/lib/socket";
import {
  Box,
  Alert,
  Button,
  Grid,
  Typography,
  Paper,
  Chip,
  Skeleton as MuiSkeleton,
  Stack,
  Divider,
  alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import RefreshIcon from "@mui/icons-material/Refresh";
import CircleIcon from "@mui/icons-material/Circle";
import { useToast } from "@/components/ui/toast-provider";
import TablePreviewDrawer from "@/components/tables/TablePreviewDrawer";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND = "#D4850A";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";
const GREEN = "#22c55e";
const AMBER = "#D4850A";
const BLUE = "#3b82f6";
const ERROR = "#ef4444";

// ─── Status labels & colors for MUI Chip ─────────────────────────────────────
const STATUS_MAP = {
  pending: { label: "Pending", color: "warning" },
  accepted: { label: "Accepted", color: "info" },
  preparing: { label: "Preparing", color: "secondary" },
  served: { label: "Served", color: "success" },
  completed: { label: "Completed", color: "success" },
  cancelled: { label: "Cancelled", color: "error" },
};

// ─── Table status visual config ──────────────────────────────────────────────
const TABLE_STATUS_STYLE = {
  available: { bg: alpha(GREEN, 0.08), border: alpha(GREEN, 0.2), dot: GREEN },
  occupied: { bg: alpha(AMBER, 0.1), border: alpha(AMBER, 0.25), dot: AMBER },
  ordering: { bg: alpha(BLUE, 0.08), border: alpha(BLUE, 0.2), dot: BLUE },
  needs_waiter: { bg: alpha(ERROR, 0.1), border: alpha(ERROR, 0.25), dot: ERROR },
  bill_requested: { bg: alpha("#f59e0b", 0.08), border: alpha("#f59e0b", 0.2), dot: "#f59e0b" },
};

export default function DashboardPage() {
  const { business } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedTable, setSelectedTable] = useState(null);
  const [updatingTable, setUpdatingTable] = useState(false);

  const load = useCallback(async () => {
    if (!business?.id) return;
    try {
      const [ordersRes, tablesRes] = await Promise.all([
        orderApi.getBusinessOrders({ businessId: business.id, limit: 20 }),
        tableApi.getBusinessTables(business.id),
      ]);
      setOrders(ordersRes.orders ?? []);
      setTables(tablesRes.tables ?? []);
      setLoadError("");
    } catch (error) {
      setLoadError(error.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  const updateTableStatus = async (table, status) => {
    setUpdatingTable(true);
    try {
      await tableApi.updateTableStatus(table.id, status);
      setTables((current) =>
        current.map((item) => item.id === table.id ? { ...item, status } : item)
      );
      setSelectedTable((current) => current?.id === table.id ? { ...current, status } : current);
      toast("Table status updated", "success");
    } catch (error) {
      toast(error.message || "Failed to update table status", "error");
    } finally {
      setUpdatingTable(false);
    }
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeBusinessActivity(load, business?.id), [load, business?.id]);
  // Poll every 30s
  useEffect(() => {
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  const activeOrders = orders.filter(o => !["completed", "cancelled"].includes(o.status));
  const todayComplete = orders.filter(o => o.status === "completed");
  const todayRevenue = todayComplete.reduce((s, o) => s + (o.total ?? 0), 0);
  const needsWaiter = tables.filter(t => t.status === "needs_waiter").length;
  const currency = business?.currency ?? "USD";

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, lg: 4 } }}>
        <MuiSkeleton variant="text" width="12rem" height={32} sx={{ mb: 4 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(4)].map((_, i) => (
            <Grid size={{ xs: 6, lg: 3 }} key={i}>
              <MuiSkeleton variant="rounded" height={112} />
            </Grid>
          ))}
        </Grid>
        <MuiSkeleton variant="rounded" height={384} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: "1440px", mx: "auto" }}>
      {/* Header */}
      <PageHeader
        title="Dashboard"
        icon="⊞"
        subtitle={`${business?.business_name ?? "Your business"} · Live overview`}
        actions={
          <Box
            component="button"
            onClick={load}
            sx={{
              background: "rgba(45,18,0,0.8)",
              border: "1px solid rgba(212,133,10,0.3)",
              borderRadius: "12px",
              color: TEXT_S,
              px: 2,
              py: 1,
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              "&:hover": { borderColor: BRAND, color: BRAND },
              transition: "all 0.2s",
            }}
          >
            <RefreshIcon sx={{ fontSize: 14 }} /> Refresh
          </Box>
        }
      />
      {loadError && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>} sx={{ mb: 3 }}>
          {loadError}
        </Alert>
      )}

      {/* KPI row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, lg: 3 }} >
        <StatCard
          label="Active orders"
          value={activeOrders.length}
          icon="🧾"
          color="amber"
          sub="right now"
        />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }} >
        <StatCard
          label="Waiter alerts"
          value={needsWaiter}
          icon="🔔"
          color={needsWaiter > 0 ? "red" : "green"}
          sub="tables calling"
        />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }} >
        <StatCard
          label="Revenue today"
          value={formatCurrency(todayRevenue, currency)}
          icon="💰"
          color="green"
          sub={`${todayComplete.length} completed`}
        />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }} >
        <StatCard
          label="Tables"
          value={`${tables.filter(t => t.status !== "available").length}/${tables.length}`}
          icon="🪑"
          color="blue"
          sub="occupied"
        />
        </Grid>
      </Grid>

      {/* Main content */}
      <Grid container spacing={3}>
        {/* Live orders feed */}
        <Grid size={{ xs: 12, xl: 7 }} >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "16px",
              background: "linear-gradient(145deg, rgba(45,18,0,0.7) 0%, rgba(28,10,0,0.8) 100%)",
              border: "1px solid rgba(212,133,10,0.15)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 600,
                  color: TEXT_P,
                  fontSize: 18,
                }}
              >
                Live orders
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.8}>
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CircleIcon sx={{ fontSize: 8, color: GREEN }} />
                </motion.div>
                <Typography sx={{ fontSize: "0.7rem", color: TEXT_M }}>
                  Live
                </Typography>
              </Stack>
            </Stack>

            {activeOrders.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 8 }}>
                <Typography sx={{ fontSize: "2.5rem", mb: 1 }}>☕</Typography>
                <Typography sx={{ fontSize: "0.85rem", color: TEXT_D }}>
                  Quiet right now — no active orders
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5} sx={{ maxHeight: 480, overflow: "auto" }}>
                {activeOrders.map((order) => {
                  const statusCfg = STATUS_MAP[order.status] || STATUS_MAP.pending;
                  return (
                    <Box
                      key={order.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                        px: 2,
                        py: 1.8,
                        borderRadius: "14px",
                        background: "rgba(45,18,0,0.5)",
                        border: "1px solid rgba(107,51,24,0.25)",
                        transition: "all 0.15s",
                        "&:hover": { borderColor: "rgba(212,133,10,0.4)" },
                      }}
                    >
                      {/* Table badge */}
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          background: alpha(BRAND, 0.15),
                          color: BRAND,
                          border: `1px solid ${alpha(BRAND, 0.25)}`,
                          flexShrink: 0,
                        }}
                      >
                        {order.table?.table_number ?? "?"}
                      </Box>

                      {/* Info */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontFamily: '"JetBrains Mono", monospace',
                              color: TEXT_S,
                              fontWeight: 500,
                            }}
                          >
                            {order.numeric_order_number || order.order_number}
                          </Typography>
                          <Chip
                            label={statusCfg.label}
                            color={statusCfg.color}
                            size="small"
                            sx={{ fontWeight: 600, fontSize: "0.65rem" }}
                          />
                        </Stack>
                        <Typography
                          sx={{
                            fontSize: "0.7rem",
                            color: TEXT_D,
                            mt: 0.3,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {(order.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                        </Typography>
                      </Box>

                      {/* Right side */}
                      <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: TEXT_P }}>
                          {formatCurrency(order.total ?? 0, currency)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: TEXT_D }}>
                          {formatRelativeTime(order.created_date)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Table grid */}
        <Grid size={{ xs: 12, xl: 5 }} >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "16px",
              background: "linear-gradient(145deg, rgba(45,18,0,0.7) 0%, rgba(28,10,0,0.8) 100%)",
              border: "1px solid rgba(212,133,10,0.15)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 600,
                color: TEXT_P,
                fontSize: 18,
                mb: 3,
              }}
            >
              Table status
            </Typography>

            {tables.length === 0 ? (
              <Typography sx={{ textAlign: "center", py: 6, color: TEXT_D }}>
                No tables yet
              </Typography>
            ) : (
              <>
                {/* Table cells grid */}
                <Grid container spacing={1.2} sx={{ maxHeight: 480, overflow: "auto", mb: 3 }}>
                  {tables.map((table) => {
                    const style = TABLE_STATUS_STYLE[table.status] || TABLE_STATUS_STYLE.available;
                    return (
                      <Grid size={{ xs: 4 }} key={table.id}>
                      <Box
                        component="button"
                        type="button"
                        aria-label={`Preview table ${table.table_number}, ${table.status.replace("_", " ")}`}
                        onClick={() => setSelectedTable(table)}
                        sx={{
                          aspectRatio: "1/1",
                          width: "100%",
                          borderRadius: "14px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          p: 1,
                          cursor: "pointer",
                          background: style.bg,
                          border: `1px solid ${style.border}`,
                          transition: "all 0.15s",
                          "&:hover": {
                            transform: "scale(1.02)",
                            boxShadow: `0 0 12px ${alpha(style.dot, 0.3)}`,
                          },
                          "&:focus-visible": {
                            outline: `2px solid ${style.dot}`,
                            outlineOffset: 2,
                          },
                        }}
                      >
                        <CircleIcon sx={{ fontSize: 8, color: style.dot, mb: 0.8 }} />
                        <Typography sx={{ fontWeight: 700, color: TEXT_P, fontSize: "0.9rem" }}>
                          {table.table_number}
                        </Typography>
                        <Typography
                          sx={{
                            color: style.dot,
                            fontSize: "0.6rem",
                            textTransform: "capitalize",
                            lineHeight: 1.2,
                          }}
                        >
                          {table.status.replace("_", " ")}
                        </Typography>
                      </Box>
                      </Grid>
                    );
                  })}
                </Grid>

                {/* Legend */}
                <Divider sx={{ borderColor: "rgba(107,51,24,0.2)", mb: 2 }} />
                <Grid container spacing={1.5}>
                  {Object.entries(TABLE_STATUS_STYLE).map(([status, s]) => (
                    <Grid size={{ xs: 6 }} key={status}>
                    <Stack direction="row" alignItems="center" spacing={0.8}>
                      <CircleIcon sx={{ fontSize: 8, color: s.dot }} />
                      <Typography
                        sx={{
                          fontSize: "0.7rem",
                          color: TEXT_D,
                          textTransform: "capitalize",
                        }}
                      >
                        {status.replace("_", " ")}
                      </Typography>
                    </Stack>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      <TablePreviewDrawer
        table={selectedTable}
        onClose={() => setSelectedTable(null)}
        onStatusChange={updateTableStatus}
        busy={updatingTable}
        viewMoreHref={selectedTable ? `/owner/tables/${selectedTable.id}` : "/owner/tables"}
      />
    </Box>
  );
}
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Box, Typography, Button, Paper, Chip, Stack, Grid, CircularProgress,
  Divider, alpha, Pagination,
} from "@mui/material";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { orderApi } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { ConfirmModal } from "@/components/ui/smart-modal";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatRelativeTime, orderStatusLabel } from "@/lib/utils";
import { subscribeBusinessActivity } from "@/lib/socket";
import RefreshIcon from "@mui/icons-material/Refresh";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND = "#D4850A";
const BRAND_DARK = "#A0622A";
const GOLD = "#F5C842";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const ERROR = "#ef4444";

const STATUSES = ["all", "pending", "accepted", "preparing", "served", "completed", "cancelled"];

// ─── MUI‑compatible status colours ───────────────────────────────────────────
const STATUS_COLORS = {
  pending: "warning",
  accepted: "info",
  preparing: "secondary",
  served: "success",
  completed: "success",
  cancelled: "error",
};

const NEXT_STATUS = {
  pending: "accepted",
  accepted: "preparing",
  preparing: "served",
  served: "completed",
};

export default function OrdersPage() {
  const { business } = useAuth();
  const { toast } = useToast();

  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const swipeStart = useRef(null);

  const load = useCallback(async () => {
    if (!business?.id) return;
    setRefreshing(true);
    try {
      const res = await orderApi.getBusinessOrders({
        businessId: business.id,
        limit: 200,
      });
      setOrders(res.orders ?? []);
    } catch { toast("Failed to load orders", "error"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [business?.id, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeBusinessActivity(load, business?.id), [load, business?.id]);
  useEffect(() => { const t = setInterval(load, 20_000); return () => clearInterval(t); }, [load]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      await orderApi.updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selected?.id === orderId) setSelected(s => ({ ...s, status }));
      toast(`Order marked as ${orderStatusLabel(status)}`, "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setUpdating(null); }
  };

  const currency = business?.currency ?? "USD";
  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const pagedOrders = filtered.slice((page - 1) * 10, page * 10);
  const activeCount = orders.filter(o => !["completed", "cancelled"].includes(o.status)).length;

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const changeFilterBySwipe = (event) => {
    if (!swipeStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - swipeStart.current.x;
    const dy = touch.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const currentIndex = STATUSES.indexOf(filter);
    const nextIndex = Math.min(STATUSES.length - 1, Math.max(0, currentIndex + (dx < 0 ? 1 : -1)));
    if (nextIndex !== currentIndex) {
      setFilter(STATUSES[nextIndex]);
      setPage(1);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: "1440px", mx: "auto" }}>
      {/* Header */}
      <PageHeader
        title="Orders"
        icon="🧾"
        subtitle={`${activeCount} active`}
        actions={
          <Button
            type="button"
            component="button"
            onClick={load}
            disabled={refreshing}
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
            <RefreshIcon sx={{ fontSize: 16, animation: refreshing ? "spin 1s linear infinite" : "none", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        }
      />

      {/* Filter tabs */}
      <Stack
        direction="row"
        spacing={0.8}
        onTouchStart={event => { const touch = event.touches[0]; swipeStart.current = { x: touch.clientX, y: touch.clientY }; }}
        onTouchEnd={changeFilterBySwipe}
        onPointerDown={event => { if (event.pointerType === "touch") swipeStart.current = { x: event.clientX, y: event.clientY }; }}
        onPointerUp={event => { if (event.pointerType === "touch") changeFilterBySwipe({ changedTouches: [{ clientX: event.clientX, clientY: event.clientY }] }); }}
        sx={{ mb: 4, overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { display: "none" } }}
      >
        {STATUSES.map(s => {
          const count = s === "all" ? orders.length : orders.filter(o => o.status === s).length;
          const active = filter === s;
          return (
            <Chip
              key={s}
              label={s === "all" ? "All" : orderStatusLabel(s)}
              onClick={() => { setFilter(s); setPage(1); }}
              icon={
                count > 0 ? (
                  <Typography
                    sx={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      color: active ? BRAND : TEXT_D,
                      px: 0.5,
                    }}
                  >
                    {count}
                  </Typography>
                ) : undefined
              }
              sx={{
                fontWeight: 600,
                fontSize: "0.75rem",
                background: active ? alpha(BRAND, 0.15) : "rgba(45,18,0,0.5)",
                color: active ? BRAND : TEXT_M,
                border: `1px solid ${active ? alpha(BRAND, 0.35) : "rgba(107,51,24,0.3)"}`,
                "&:hover": { borderColor: active ? BRAND : alpha(BRAND, 0.4) },
                transition: "all 0.2s",
                textTransform: "capitalize",
              }}
            />
          );
        })}
      </Stack>

      <Box
        onTouchStart={event => { const touch = event.touches[0]; swipeStart.current = { x: touch.clientX, y: touch.clientY }; }}
        onTouchEnd={changeFilterBySwipe}
        onPointerDown={event => { if (event.pointerType === "touch") swipeStart.current = { x: event.clientX, y: event.clientY }; }}
        onPointerUp={event => { if (event.pointerType === "touch") changeFilterBySwipe({ changedTouches: [{ clientX: event.clientX, clientY: event.clientY }] }); }}
        sx={{ touchAction: "pan-y" }}
      >
      {loading ? (
        <Stack spacing={1.5}>
          {[...Array(5)].map((_, i) => (
            <Box key={i} sx={{ height: 80, borderRadius: "14px", background: "rgba(45,18,0,0.6)" }} />
          ))}
        </Stack>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="🧾"
          title="No orders"
          description={`No ${filter === "all" ? "" : filter} orders yet.`}
        />
      ) : (
        <Stack spacing={1.5}>
          {pagedOrders.map(order => {
            const statusColor = STATUS_COLORS[order.status] || "default";
            return (
              <Paper
                key={order.id}
                elevation={0}
                onClick={() => setSelected(order)}
                sx={{
                  px: { xs: 2, sm: 3 },
                  py: { xs: 2, sm: 2.5 },
                  borderRadius: "16px",
                  background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
                  border: "1px solid rgba(107,51,24,0.25)",
                  backdropFilter: "blur(6px)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                  "&:hover": { borderColor: alpha(BRAND, 0.3) },
                  display: "flex",
                  alignItems: { xs: "flex-start", sm: "center" },
                  gap: { xs: 1, sm: 2 },
                  flexWrap: { xs: "wrap", sm: "nowrap" },
                }}
              >
                {/* Table badge */}
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    background: alpha(BRAND, 0.12),
                    color: BRAND,
                    border: `1px solid ${alpha(BRAND, 0.2)}`,
                    flexShrink: 0,
                  }}
                >
                  {order.table?.table_number ?? "?"}
                </Box>

                {/* Info */}
                <Box sx={{ flex: { xs: "1 1 calc(100% - 52px)", sm: "1 1 auto" }, minWidth: 0 }}>
                  <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 0.5 }}>
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
                      label={orderStatusLabel(order.status)}
                      color={statusColor}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: "0.65rem" }}
                    />
                    {order.waiter && (
                      <Typography variant="caption" sx={{ color: TEXT_M }}>
                        🧑 {order.waiter.full_name}
                      </Typography>
                    )}
                  </Stack>
                  <Typography
                    sx={{
                      fontSize: "0.9rem",
                      color: TEXT_P,
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      mb: 0.3,
                    }}
                  >
                    {(order.items ?? []).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: TEXT_D }}>
                    {formatRelativeTime(order.created_date)}
                    {order.notes && ` · Note: ${order.notes}`}
                  </Typography>
                  <Button
                    size="small"
                    onClick={e => { e.stopPropagation(); setSelected(order); }}
                    sx={{ mt: 0.5, px: 0, minWidth: 0, color: BRAND, fontSize: "0.72rem", fontWeight: 700 }}
                  >
                    View more
                  </Button>
                </Box>

                {/* Total + quick actions */}
                <Box
                  sx={{
                    textAlign: { xs: "left", sm: "right" },
                    flex: { xs: "1 0 100%", sm: "0 0 auto" },
                    display: { xs: "flex", sm: "block" },
                    alignItems: "center",
                    justifyContent: { xs: "space-between", sm: "initial" },
                    gap: 1,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: TEXT_P, mb: 1 }}>
                    {formatCurrency(order.total ?? 0, currency)}
                  </Typography>
                  <Stack direction="row" spacing={0.8}>
                    {NEXT_STATUS[order.status] && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={e => { e.stopPropagation(); updateStatus(order.id, NEXT_STATUS[order.status]); }}
                        disabled={updating === order.id}
                        sx={{
                          borderRadius: "10px",
                          background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                          color: "#FFF8ED",
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          boxShadow: `0 2px 8px ${alpha(BRAND, 0.3)}`,
                          "&:hover": { boxShadow: `0 4px 16px ${alpha(BRAND, 0.45)}` },
                        }}
                      >
                        {updating === order.id ? "…" : `Mark ${orderStatusLabel(NEXT_STATUS[order.status])}`}
                      </Button>
                    )}
                    {order.status === "pending" && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={e => { e.stopPropagation(); setCancelTarget(order); }}
                        disabled={updating === order.id}
                        sx={{
                          borderRadius: "10px",
                          color: ERROR,
                          borderColor: alpha(ERROR, 0.3),
                          background: alpha(ERROR, 0.07),
                          fontWeight: 600,
                          fontSize: "0.7rem",
                          "&:hover": { background: alpha(ERROR, 0.12) },
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </Stack>
                </Box>
              </Paper>
            );
          })}
        </Stack>
      )}
      {!loading && filtered.length > 0 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            aria-label="Orders pages"
          />
        </Stack>
      )}
      </Box>

      {/* Order detail modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={`Order ${selected?.numeric_order_number || selected?.order_number}`}
        size="md"
      >
        {selected && (
          <Stack spacing={3}>
            {/* Header */}
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Chip
                label={orderStatusLabel(selected.status)}
                color={STATUS_COLORS[selected.status] || "default"}
                size="small"
                sx={{ fontWeight: 600 }}
              />
              <Typography variant="caption" sx={{ color: TEXT_M }}>
                Table {selected.table?.table_number}
                {selected.waiter && ` · ${selected.waiter.full_name}`}
              </Typography>
            </Stack>

            {/* Items */}
            <Stack spacing={1.5}>
              {(selected.items ?? []).map((item, i) => (
                <Box
                  key={i}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 1.5,
                    borderBottom: i < (selected.items?.length ?? 0) - 1 ? "1px solid rgba(107,51,24,0.2)" : "none",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 500, color: TEXT_P, fontSize: "0.9rem" }}>
                      {item.quantity}× {item.name}
                    </Typography>
                    {item.notes && (
                      <Typography variant="caption" sx={{ color: TEXT_M }}>{item.notes}</Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontWeight: 600, color: TEXT_S, fontSize: "0.9rem" }}>
                    {formatCurrency(item.price * item.quantity, currency)}
                  </Typography>
                </Box>
              ))}
            </Stack>

            {/* Totals */}
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" sx={{ fontSize: "0.85rem" }}>
                <Typography variant="body2" sx={{ color: TEXT_M }}>Subtotal</Typography>
                <Typography variant="body2" sx={{ color: TEXT_S }}>{formatCurrency(selected.subtotal ?? 0, currency)}</Typography>
              </Stack>
              {(selected.service_charge ?? 0) > 0 && (
                <Stack direction="row" justifyContent="space-between" sx={{ fontSize: "0.85rem" }}>
                  <Typography variant="body2" sx={{ color: TEXT_M }}>Service charge</Typography>
                  <Typography variant="body2" sx={{ color: TEXT_S }}>{formatCurrency(selected.service_charge, currency)}</Typography>
                </Stack>
              )}
              <Divider sx={{ borderColor: "rgba(107,51,24,0.3)", my: 0.5 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontWeight: 700, color: TEXT_P }}>Total</Typography>
                <Typography sx={{ fontWeight: 700, color: BRAND, fontSize: "1rem" }}>
                  {formatCurrency(selected.total ?? 0, currency)}
                </Typography>
              </Stack>
            </Stack>

            {/* Customer note */}
            {selected.notes && (
              <Box
                sx={{
                  p: 2,
                  borderRadius: "14px",
                  background: alpha(BRAND, 0.06),
                  border: `1px solid ${alpha(BRAND, 0.15)}`,
                }}
              >
                <Typography sx={{ fontWeight: 600, color: BRAND, fontSize: "0.75rem", mb: 0.5 }}>
                  Customer note
                </Typography>
                <Typography sx={{ color: TEXT_S, fontSize: "0.85rem" }}>{selected.notes}</Typography>
              </Box>
            )}

            {/* Status actions */}
            {NEXT_STATUS[selected.status] && (
              <Stack direction="row" spacing={1.5}>
                {selected.status === "pending" && (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setCancelTarget(selected)}
                    sx={{
                      borderRadius: "14px",
                      color: ERROR,
                      borderColor: alpha(ERROR, 0.3),
                      background: alpha(ERROR, 0.07),
                      fontWeight: 600,
                      "&:hover": { background: alpha(ERROR, 0.12) },
                    }}
                  >
                    Cancel order
                  </Button>
                )}
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => updateStatus(selected.id, NEXT_STATUS[selected.status])}
                  sx={{
                    borderRadius: "14px",
                    background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                    color: "#FFF8ED",
                    fontWeight: 700,
                    boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                    "&:hover": { boxShadow: `0 8px 24px ${alpha(BRAND, 0.45)}` },
                  }}
                >
                  Mark {orderStatusLabel(NEXT_STATUS[selected.status])}
                </Button>
              </Stack>
            )}
          </Stack>
        )}
      </Modal>
      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={async () => {
          await updateStatus(cancelTarget.id, "cancelled");
          setCancelTarget(null);
        }}
        title="Cancel this order?"
        message={`Order ${cancelTarget?.numeric_order_number || cancelTarget?.order_number} will be marked as cancelled.`}
        confirmLabel="Cancel order"
        danger
        loading={updating === cancelTarget?.id}
      />
    </Box>
  );
}
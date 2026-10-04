
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Alert, Box, Typography, Chip, Stack, IconButton, Skeleton,
  Tabs, Tab, Tooltip, Button, Collapse, alpha, Pagination,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocalDiningIcon from "@mui/icons-material/Restaurant";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlineOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { useAuth } from "@/lib/auth-context";
import { orderApi } from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency, formatRelativeTime, orderStatusLabel } from "@/lib/utils";
import { SmartCard, OrderRowCard } from "@/components/ui/smart-card";
import SmartModal, { ConfirmModal } from "@/components/ui/smart-modal";
import { tokens } from "@/lib/mui-theme";
import { subscribeBusinessActivity } from "@/lib/socket";

const STATUS_CFG = {
  pending:   { label: "Pending",   color: "warning",  dot: tokens.warning, nextLabel: "Accept",     next: "accepted" },
  accepted:  { label: "Accepted",  color: "info",     dot: tokens.info,    nextLabel: "Preparing",  next: "preparing" },
  preparing: { label: "Preparing", color: "secondary",dot: "#a855f7",     nextLabel: "Served",     next: "served" },
  served:    { label: "Served",    color: "success",  dot: tokens.success, nextLabel: "Complete",   next: "completed" },
  completed: { label: "Completed", color: "success",  dot: tokens.success, nextLabel: null,          next: null },
  cancelled: { label: "Cancelled", color: "error",    dot: tokens.error,   nextLabel: null,          next: null },
};

const TABS = [
  { value: "all",       label: "All" },
  { value: "active",    label: "Active" },
  { value: "pending",   label: "Pending" },
  { value: "accepted",  label: "Accepted" },
  { value: "preparing", label: "Preparing" },
  { value: "served",    label: "Served" },
  { value: "completed", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

function PulseDot({ color, pulse = false }) {
  return (
    <Box sx={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
      {pulse && (
        <motion.div
          animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", inset: -2, borderRadius: "50%",
            background: color, opacity: 0.4,
          }}
        />
      )}
      <Box sx={{ width: 10, height: 10, borderRadius: "50%", background: color, boxShadow: `0 0 8px ${alpha(color, 0.7)}`, position: "relative" }} />
    </Box>
  );
}

function OrderCard({ order, currency, onAdvance, onCancel, onSelect, advancing }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
  const isPulse = ["pending", "accepted", "preparing"].includes(order.status);

  return (
    <OrderRowCard active={isPulse} onClick={() => onSelect(order)}>
      <Stack
        direction="row"
        alignItems="flex-start"
        spacing={{ xs: 1, sm: 2 }}
        useFlexGap
        sx={{ flexWrap: "wrap" }}
      >
        <motion.div whileHover={{ scale: 1.1, rotate: -3 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
          <Box sx={{
            width: 48, height: 48, borderRadius: "13px", display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: "1.3rem",
            background: `linear-gradient(135deg, ${alpha(tokens.brand, 0.2)}, ${alpha(tokens.brandDeep, 0.15)})`,
            border: `1px solid ${alpha(tokens.brand, 0.3)}`, color: tokens.brand, flexShrink: 0,
            boxShadow: `0 0 16px ${alpha(tokens.brand, 0.2)}`,
          }}>
            {order.table?.table_number ?? "?"}
          </Box>
        </motion.div>

        <Box sx={{ flex: { xs: "1 1 calc(100% - 64px)", sm: "1 1 auto" }, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap" sx={{ mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', color: tokens.textSecondary, fontWeight: 600, letterSpacing: "0.05em" }}>
              {order.numeric_order_number || order.order_number}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={0.6}>
              <PulseDot color={cfg.dot} pulse={isPulse} />
              <Chip label={cfg.label} color={cfg.color} size="small" />
            </Stack>
          </Stack>

          <Typography variant="body2" sx={{ color: tokens.textPrimary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%", mb: 0.5 }}>
            {(order.items ?? []).map(i => `${i.quantity}× ${i.name}`).join(", ")}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Stack direction="row" alignItems="center" spacing={0.4}>
              <AccessTimeIcon sx={{ fontSize: 12, color: tokens.textDisabled }} />
              <Typography variant="caption" sx={{ color: tokens.textDisabled }}>{formatRelativeTime(order.created_date)}</Typography>
            </Stack>
            {order.notes && (
              <Typography variant="caption" sx={{ color: tokens.textMuted, fontStyle: "italic" }}>
                · &quot;{order.notes}&quot;
              </Typography>
            )}
          </Stack>
          <Button
            size="small"
            onClick={e => { e.stopPropagation(); onSelect(order); }}
            sx={{ mt: 0.5, px: 0, minWidth: 0, color: tokens.brand, fontSize: "0.72rem", fontWeight: 700 }}
          >
            View more
          </Button>
        </Box>

        <Stack
          direction={{ xs: "row", sm: "column" }}
          alignItems={{ xs: "center", sm: "flex-end" }}
          justifyContent={{ xs: "space-between", sm: "initial" }}
          spacing={1}
          sx={{ flex: { xs: "1 0 100%", sm: "0 0 auto" } }}
        >
          <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: "1.05rem", color: tokens.textPrimary }}>
            {formatCurrency(order.total ?? 0, currency)}
          </Typography>
          <Stack direction="row" spacing={0.8}>
            <Tooltip title={expanded ? "Collapse" : "View items"} arrow>
              <IconButton size="small" onClick={e => { e.stopPropagation(); setExpanded(v => !v); }} sx={{
                width: 30, height: 30, background: alpha(tokens.surface, 0.9), border: `1px solid ${tokens.borderBase}`, color: tokens.textMuted,
                "&:hover": { color: tokens.textSecondary, borderColor: tokens.borderStrong },
              }}>
                {expanded ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            </Tooltip>
            {cfg.next && (
              <Tooltip title={`Mark as ${cfg.nextLabel}`} arrow>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton size="small" disabled={advancing === order.id}
                    onClick={e => { e.stopPropagation(); onAdvance(order.id, cfg.next); }}
                    sx={{
                      width: 30, height: 30,
                      background: `linear-gradient(135deg, ${alpha(tokens.brand, 0.25)}, ${alpha(tokens.brandDark, 0.2)})`,
                      border: `1px solid ${alpha(tokens.brand, 0.35)}`, color: tokens.brand,
                      "&:hover": { boxShadow: `0 0 12px ${alpha(tokens.brand, 0.4)}` },
                      "&.Mui-disabled": { opacity: 0.4 },
                    }}>
                    <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </motion.div>
              </Tooltip>
            )}
          </Stack>
        </Stack>
      </Stack>

      <Collapse in={expanded} timeout={280}>
        <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${tokens.borderBase}` }} onClick={e => e.stopPropagation()}>
          <Stack spacing={1.2}>
            {(order.items ?? []).map((item, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1.2}>
                    <Box sx={{
                      width: 24, height: 24, borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center",
                      background: alpha(tokens.brand, 0.12), color: tokens.brand, fontWeight: 700, fontSize: "0.72rem",
                      border: `1px solid ${alpha(tokens.brand, 0.2)}`, flexShrink: 0,
                    }}>
                      {item.quantity}
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ color: tokens.textPrimary, fontWeight: 500 }}>{item.name}</Typography>
                      {item.notes && <Typography variant="caption" sx={{ color: tokens.textMuted }}>{item.notes}</Typography>}
                    </Box>
                  </Stack>
                  <Typography variant="body2" sx={{ color: tokens.textSecondary, fontWeight: 600 }}>{formatCurrency(item.price * item.quantity, currency)}</Typography>
                </Stack>
              </motion.div>
            ))}
          </Stack>
          <Stack spacing={0.5} sx={{ mt: 2, pt: 1.5, borderTop: `1px solid ${tokens.borderBase}` }}>
            <Stack direction="row" justifyContent="space-between" spacing={3}>
              <Typography variant="caption" sx={{ color: tokens.textMuted }}>Subtotal</Typography>
              <Typography variant="caption" sx={{ color: tokens.textSecondary, textAlign: "right" }}>{formatCurrency(order.subtotal ?? 0, currency)}</Typography>
            </Stack>
            {(order.service_charge ?? 0) > 0 && (
              <Stack direction="row" justifyContent="space-between" spacing={3}>
                <Typography variant="caption" sx={{ color: tokens.textMuted }}>Service</Typography>
                <Typography variant="caption" sx={{ color: tokens.textSecondary, textAlign: "right" }}>{formatCurrency(order.service_charge, currency)}</Typography>
              </Stack>
            )}
            <Stack direction="row" justifyContent="space-between" spacing={3} sx={{ pt: 0.5 }}>
              <Typography variant="body2" sx={{ color: tokens.textPrimary, fontWeight: 700 }}>Total</Typography>
              <Typography variant="body2" sx={{ fontFamily: '"Playfair Display", Georgia, serif', color: tokens.brand, fontWeight: 700, textAlign: "right" }}>
                {formatCurrency(order.total ?? 0, currency)}
              </Typography>
            </Stack>
          </Stack>
          {order.status === "pending" && (
            <Box sx={{ mt: 2 }}>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => onCancel(order.id)}
                style={{
                  width: "100%", padding: "8px 16px", borderRadius: 10,
                  border: `1px solid ${alpha(tokens.error, 0.3)}`, background: alpha(tokens.error, 0.08),
                  color: tokens.error, fontWeight: 600, fontSize: "0.8rem", cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                }}>
                Cancel order
              </motion.button>
            </Box>
          )}
        </Box>
      </Collapse>
    </OrderRowCard>
  );
}

function OrderDetailModal({ order, open, onClose, currency, onAdvance, advancing }) {
  if (!order) return null;
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
  return (
    <SmartModal open={open} onClose={onClose} title={`Order ${order.numeric_order_number || order.order_number}`}
      subtitle={`Table ${order.table?.table_number ?? "–"} · ${formatRelativeTime(order.created_date)}`}
      icon={<LocalDiningIcon />} size="md">
      <SmartModal.Body>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <PulseDot color={cfg.dot} pulse={["pending","accepted","preparing"].includes(order.status)} />
          <Chip label={cfg.label} color={cfg.color} size="small" />
          {order.waiter && <Typography variant="caption" sx={{ color: tokens.textMuted }}>· {order.waiter.full_name}</Typography>}
        </Stack>
        {order.notes && <Alert severity="info" sx={{ borderRadius: "12px", fontSize: "0.82rem" }}><strong>Customer note:</strong> {order.notes}</Alert>}
        <SmartModal.Section title="Items">
          <Stack spacing={1.2}>
            {(order.items ?? []).map((item, i) => (
              <Stack key={i} direction="row" justifyContent="space-between" alignItems="center"
                sx={{ py: 1.2, borderBottom: `1px solid ${tokens.borderBase}`, "&:last-child": { borderBottom: "none" } }}>
                <Stack direction="row" spacing={1.2} alignItems="center">
                  <Box sx={{
                    width: 28, height: 28, borderRadius: "8px",
                    background: alpha(tokens.brand, 0.12), border: `1px solid ${alpha(tokens.brand, 0.2)}`,
                    color: tokens.brand, fontWeight: 700, fontSize: "0.78rem",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>{item.quantity}</Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: tokens.textPrimary, fontWeight: 500 }}>{item.name}</Typography>
                    {item.notes && <Typography variant="caption" sx={{ color: tokens.textMuted }}>{item.notes}</Typography>}
                  </Box>
                </Stack>
                <Typography variant="body2" sx={{ color: tokens.textSecondary, fontWeight: 600 }}>{formatCurrency(item.price * item.quantity, currency)}</Typography>
              </Stack>
            ))}
          </Stack>
        </SmartModal.Section>
        <Box sx={{ borderRadius: "12px", border: `1px solid ${tokens.borderBase}`, overflow: "hidden" }}>
          <SmartModal.InfoRow label="Subtotal" value={formatCurrency(order.subtotal ?? 0, currency)} />
          {(order.service_charge ?? 0) > 0 && <SmartModal.InfoRow label="Service charge" value={formatCurrency(order.service_charge, currency)} />}
          <SmartModal.InfoRow label="Total" value={formatCurrency(order.total ?? 0, currency)} accent />
        </Box>
      </SmartModal.Body>
      {cfg.next && (
        <SmartModal.Footer>
          <Button variant="outlined" onClick={onClose}>Close</Button>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
            <Button variant="contained" startIcon={<CheckCircleOutlineIcon />} disabled={advancing === order.id}
              onClick={() => { onAdvance(order.id, cfg.next); onClose(); }}>
              {advancing === order.id ? "Updating…" : `Mark ${cfg.nextLabel}`}
            </Button>
          </motion.div>
        </SmartModal.Footer>
      )}
    </SmartModal>
  );
}

function EmptyOrders({ tab }) {
  const msgs = {
    all: { icon: "☕", text: "No orders yet" },
    active: { icon: "☕", text: "No active orders right now" },
    pending: { icon: "🕐", text: "No orders waiting" },
    accepted: { icon: "✓", text: "No accepted orders" },
    preparing: { icon: "🍳", text: "No orders being prepared" },
    served: { icon: "🍽", text: "No served orders" },
    completed: { icon: "✓", text: "No completed orders yet" },
    cancelled: { icon: "↩", text: "No cancelled orders" },
  };
  const { icon, text } = msgs[tab] ?? msgs.active;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
      <Box sx={{ textAlign: "center", py: 10 }}>
        <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
          <Typography sx={{ fontSize: "3.5rem", mb: 2 }}>{icon}</Typography>
        </motion.div>
        <Typography variant="h6" sx={{ color: tokens.textMuted, fontWeight: 400, fontFamily: "Inter, sans-serif" }}>{text}</Typography>
      </Box>
    </motion.div>
  );
}

export default function WaiterOrdersPage() {
  const { employee, business } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [advancing, setAdvancing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const swipeStart = useRef(null);
  const currency = business?.currency ?? "ZMW";

  const load = useCallback(async () => {
    if (!business?.id) return;
    setRefreshing(true);
    try {
      const res = await orderApi.getBusinessOrders({ businessId: business.id, limit: 200 });
      setOrders(res.orders ?? []);
    } catch { toast("Failed to load orders", "error"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [business?.id, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeBusinessActivity(load, business?.id), [load, business?.id]);
  useEffect(() => { const t = setInterval(load, 18_000); return () => clearInterval(t); }, [load]);

  const advanceOrder = async (orderId, status) => {
    setAdvancing(orderId);
    try {
      await orderApi.updateOrderStatus(orderId, status, employee?.id);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      toast(`Marked ${orderStatusLabel(status)}`, "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setAdvancing(null); }
  };

  const cancelOrder = async (orderId) => {
    setAdvancing(orderId);
    try {
      await orderApi.updateOrderStatus(orderId, "cancelled");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: "cancelled" } : o));
      toast("Order cancelled", "success");
    } catch (e) { toast(e.message, "error"); }
    finally { setAdvancing(null); setCancelTarget(null); }
  };

  const openDetail = (order) => { setSelected(order); setDetailOpen(true); };
  const activeStatuses = ["pending", "accepted", "preparing", "served"];
  const filteredOrders = tab === "all"
    ? orders
    : tab === "active"
      ? orders.filter(o => activeStatuses.includes(o.status))
      : orders.filter(o => o.status === tab);
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / 10));
  const pagedOrders = filteredOrders.slice((page - 1) * 10, page * 10);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const changeTabBySwipe = (event) => {
    if (!swipeStart.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - swipeStart.current.x;
    const dy = touch.clientY - swipeStart.current.y;
    swipeStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    const currentIndex = TABS.findIndex(item => item.value === tab);
    const nextIndex = Math.min(TABS.length - 1, Math.max(0, currentIndex + (dx < 0 ? 1 : -1)));
    if (nextIndex !== currentIndex) {
      setTab(TABS[nextIndex].value);
      setPage(1);
    }
  };

  return (
    <Box sx={{ pb: 10, maxWidth: 640, mx: "auto", minHeight: "100dvh" }}>
      <Box sx={{ position: "sticky", top: 0, zIndex: 20, px: 2, pt: 2.5, pb: 2, background: alpha(tokens.bg, 0.92), backdropFilter: "blur(16px)", borderBottom: `1px solid ${tokens.borderBase}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", Georgia, serif', color: tokens.textPrimary }}>My Orders</Typography>
            <Stack direction="row" alignItems="center" spacing={0.8} sx={{ mt: 0.3 }}>
              <motion.div animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", background: tokens.success, boxShadow: `0 0 6px ${tokens.success}` }} />
              </motion.div>
              <Typography variant="caption" sx={{ color: tokens.textMuted }}>Live · updates every 18s</Typography>
            </Stack>
          </Box>
          <Stack direction="row" spacing={1}>
            {pendingCount > 0 && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500 }}>
                <Chip label={`${pendingCount} new`} color="warning" size="small" sx={{ fontWeight: 700 }} />
              </motion.div>
            )}
            <Tooltip title="Refresh" arrow>
              <IconButton onClick={load} disabled={refreshing} aria-label="Refresh orders" size="small" sx={{
                background: alpha(tokens.surface, 0.9), border: `1px solid ${tokens.borderBase}`, color: tokens.textMuted,
                width: 36, height: 36, "&:hover": { color: tokens.brand, borderColor: tokens.borderStrong },
              }}><RefreshIcon sx={{ fontSize: 18, animation: refreshing ? "spin 1s linear infinite" : "none", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }} /></IconButton>
            </Tooltip>
          </Stack>
        </Stack>
        <Tabs
          value={tab}
          onChange={(_, v) => { setTab(v); setPage(1); }}
          onTouchStart={event => { const touch = event.touches[0]; swipeStart.current = { x: touch.clientX, y: touch.clientY }; }}
          onTouchEnd={changeTabBySwipe}
          onPointerDown={event => { if (event.pointerType === "touch") swipeStart.current = { x: event.clientX, y: event.clientY }; }}
          onPointerUp={event => { if (event.pointerType === "touch") changeTabBySwipe({ changedTouches: [{ clientX: event.clientX, clientY: event.clientY }] }); }}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ minHeight: 38, background: alpha(tokens.surface, 0.6), borderRadius: "10px", p: "3px", "& .MuiTabs-indicator": { height: 2, borderRadius: 99 }, "& .MuiTab-root": { minWidth: "auto", px: 1.4, whiteSpace: "nowrap" } }}
        >
          {TABS.map(t => <Tab key={t.value} value={t.value} label={t.label} sx={{ minHeight: 32, py: 0.5, px: 2, fontSize: "0.82rem" }} />)}
        </Tabs>
      </Box>

      <Box
        sx={{ p: 2, pt: 2.5, touchAction: "pan-y" }}
        onTouchStart={event => { const touch = event.touches[0]; swipeStart.current = { x: touch.clientX, y: touch.clientY }; }}
        onTouchEnd={changeTabBySwipe}
        onPointerDown={event => { if (event.pointerType === "touch") swipeStart.current = { x: event.clientX, y: event.clientY }; }}
        onPointerUp={event => { if (event.pointerType === "touch") changeTabBySwipe({ changedTouches: [{ clientX: event.clientX, clientY: event.clientY }] }); }}
      >
        {loading ? (
          <Stack spacing={2}>{[...Array(4)].map((_, i) => <Box key={i} sx={{ borderRadius: "14px", overflow: "hidden", border: `1px solid ${tokens.borderBase}` }}><Skeleton variant="rectangular" height={88} animation="wave" /></Box>)}</Stack>
        ) : filteredOrders.length === 0 ? (
          <EmptyOrders tab={tab} />
        ) : (
          <AnimatePresence mode="popLayout">
            <Stack spacing={1.5}>
              {pagedOrders.map(order => (
                <OrderCard key={order.id} order={order} currency={currency} advancing={advancing} onAdvance={advanceOrder} onCancel={() => setCancelTarget(order)} onSelect={openDetail} />
              ))}
            </Stack>
          </AnimatePresence>
        )}
        {!loading && filteredOrders.length > 0 && (
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

      <OrderDetailModal order={selected} open={detailOpen} onClose={() => setDetailOpen(false)} currency={currency} onAdvance={advanceOrder} advancing={advancing} />
      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => cancelOrder(cancelTarget.id)}
        title="Cancel this order?"
        message={`Order ${cancelTarget?.numeric_order_number || cancelTarget?.order_number} will be marked as cancelled.`}
        confirmLabel="Cancel order"
        danger
        loading={advancing === cancelTarget?.id}
      />
    </Box>
  );
}

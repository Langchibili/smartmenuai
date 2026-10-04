"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Box, Typography, Button, Paper, Stack, Grid, Chip, Select, MenuItem,
  FormControl, InputLabel, TextField, IconButton, CircularProgress,
  Divider, alpha, Pagination,
} from "@mui/material";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { tableApi, employeeApi, flattenStrapiResponse } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { subscribeBusinessActivity } from "@/lib/socket";
import { getBusinessWord } from "@/lib/utils";
import QRCode from "qrcode";
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
const WARNING = "#f59e0b";

// ─── Table status visual config ──────────────────────────────────────────────
const STATUS_COLORS = {
  available: { bg: alpha(GREEN, 0.1), border: alpha(GREEN, 0.3), text: GREEN },
  occupied: { bg: alpha(BRAND, 0.1), border: alpha(BRAND, 0.3), text: BRAND },
  ordering: { bg: alpha(BLUE, 0.1), border: alpha(BLUE, 0.3), text: BLUE },
  needs_waiter: { bg: alpha(ERROR, 0.12), border: alpha(ERROR, 0.35), text: ERROR },
  bill_requested: { bg: alpha(WARNING, 0.1), border: alpha(WARNING, 0.3), text: WARNING },
};

// ─── Input sx for modals ─────────────────────────────────────────────────────
const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "rgba(45,18,0,0.8)",
    color: TEXT_P,
    fontSize: 14,
    "& fieldset": { borderColor: "rgba(212,133,10,0.18)" },
    "&:hover fieldset": { borderColor: alpha(BRAND, 0.45) },
    "&.Mui-focused fieldset": {
      borderColor: BRAND,
      boxShadow: `0 0 0 3px ${alpha(BRAND, 0.18)}, 0 0 20px ${alpha(BRAND, 0.12)}`,
    },
  },
  "& .MuiInputLabel-root": { color: TEXT_M, fontSize: 14 },
  "& .MuiInputLabel-root.Mui-focused": { color: BRAND },
  "& .MuiSelect-select": { color: TEXT_P },
};

export default function TablesPage() {
  const { business } = useAuth();
  const waiterWord = getBusinessWord(business, "waiter", "waiter");
  const { toast } = useToast();

  const [tables, setTables] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [addModal, setAddModal] = useState(false);
  const [qrModal, setQrModal] = useState(null);
  const [assigningTableId, setAssigningTableId] = useState(null);
  const qrCanvasRef = useRef(null);

  const [form, setForm] = useState({
    tableNumber: "", tableName: "", capacity: "4", assignedWaiterId: "",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!business?.id) return;
    setRefreshing(true);
    try {
      const [tablesRes, waitersRes] = await Promise.all([
        tableApi.getBusinessTables(business.id),
        employeeApi.getEmployees(business.id),
      ]);
      setTables(tablesRes.tables ?? []);
      const emps = flattenStrapiResponse(waitersRes) ?? [];
      setWaiters((Array.isArray(emps) ? emps : [emps]).filter((e) => e.role === "waiter"));
    } catch { toast("Failed to load tables", "error"); }
    finally { setLoading(false); setRefreshing(false); }
  }, [business?.id, toast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => subscribeBusinessActivity(load, business?.id), [load, business?.id]);

  // Generate QR on canvas when qrModal changes
  useEffect(() => {
    if (!qrModal || !qrCanvasRef.current) return;
    QRCode.toCanvas(qrCanvasRef.current, qrModal.qr_code_url, {
      width: 220,
      margin: 2,
      color: { dark: "#1C0A00", light: "#F9EDD8" },
    });
  }, [qrModal]);

  const addTable = async () => {
    if (!form.tableNumber) return;
    setSaving(true);
    try {
      await tableApi.createBusinessTable({
        businessId: business.id,
        tableNumber: parseInt(form.tableNumber),
        tableName: form.tableName || `Table ${form.tableNumber}`,
        capacity: parseInt(form.capacity) || 4,
        assignedWaiterId: form.assignedWaiterId ? parseInt(form.assignedWaiterId) : null,
      });
      toast("Table created", "success");
      setAddModal(false);
      setForm({ tableNumber: "", tableName: "", capacity: "4", assignedWaiterId: "" });
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const changeStatus = async (tableId, status) => {
    try {
      await tableApi.updateTableStatus(tableId, status);
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, status } : t));
    } catch (e) { toast(e.message, "error"); }
  };

  const assignWaiter = async (table, waiterId) => {
    setAssigningTableId(table.id);
    try {
      await tableApi.assignWaiterToTable(table.id, waiterId || null);
      const assignedWaiter = waiters.find((waiter) => String(waiter.id) === String(waiterId)) || null;
      setTables((current) => current.map((item) =>
        item.id === table.id
          ? { ...item, assigned_waiter: assignedWaiter }
          : assignedWaiter && String(item.assigned_waiter?.id) === String(waiterId)
            ? { ...item, assigned_waiter: null }
            : item
      ));
      toast(assignedWaiter ? "Waiter assigned to table" : "Waiter unassigned from table", "success");
    } catch (error) {
      toast(error.message || "Unable to assign waiter to table", "error");
    } finally {
      setAssigningTableId(null);
    }
  };

  const downloadQr = () => {
    if (!qrCanvasRef.current || !qrModal) return;
    const a = document.createElement("a");
    a.download = `table-${qrModal.table_number}-qr.png`;
    a.href = qrCanvasRef.current.toDataURL();
    a.click();
  };

  const copyQrUrl = async () => {
    const url = qrModal?.qr_code_url;
    if (!url) {
      toast("QR code URL is unavailable", "error");
      return;
    }

    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        copied = true;
      }
    } catch {}

    if (!copied) {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      try {
        textarea.select();
        copied = document.execCommand("copy");
      } catch {
        copied = false;
      } finally {
        textarea.remove();
      }
    }

    toast(
      copied ? "Copied!" : "Unable to copy the URL. Please select and copy it manually.",
      copied ? "success" : "error"
    );
  };

  const stats = {
    total: tables.length,
    available: tables.filter(t => t.status === "available").length,
    occupied: tables.filter(t => !["available"].includes(t.status)).length,
    alerts: tables.filter(t => t.status === "needs_waiter").length,
  };
  const orderedTables = [...tables].sort(
    (a, b) => Number(b.status === "needs_waiter") - Number(a.status === "needs_waiter")
  );
  const pageCount = Math.max(1, Math.ceil(orderedTables.length / 10));
  const pagedTables = orderedTables.slice((page - 1) * 10, page * 10);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, lg: 4 } }}>
        <Box sx={{ height: 32, width: "12rem", borderRadius: "8px", bgcolor: "rgba(45,18,0,0.6)", mb: 3 }} />
        <Grid container spacing={2}>
          {[...Array(8)].map((_, i) => (
            <Grid size={{ xs: 6, md: 4, lg: 3 }} key={i}>
              <Box sx={{ height: 160, borderRadius: "14px", bgcolor: "rgba(45,18,0,0.6)" }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: "1440px", mx: "auto" }}>
      <PageHeader
        title="Tables"
        icon="🪑"
        subtitle={`${stats.total} tables · ${stats.occupied} occupied · ${stats.alerts} alerts`}
        actions={
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="outlined"
              onClick={load}
              disabled={refreshing}
              startIcon={<RefreshIcon sx={{ animation: refreshing ? "spin 1s linear infinite" : "none", "@keyframes spin": { to: { transform: "rotate(360deg)" } } }} />}
              sx={{ borderRadius: "14px", color: TEXT_S, borderColor: "rgba(212,133,10,0.3)" }}
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button
              variant="contained"
              onClick={() => setAddModal(true)}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                color: "#FFF8ED",
                fontWeight: 700,
                fontSize: "0.85rem",
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                "&:hover": { boxShadow: `0 8px 24px ${alpha(BRAND, 0.45)}` },
              }}
            >
              + Add table
            </Button>
          </Stack>
        }
      />

      {/* Quick stats */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 4, flexWrap: "wrap", gap: 1.5 }}>
        {[
          { label: "Total", value: stats.total, color: TEXT_S },
          { label: "Available", value: stats.available, color: GREEN },
          { label: "Occupied", value: stats.occupied, color: BRAND },
          { label: "Alerts", value: stats.alerts, color: ERROR },
        ].map(s => (
          <Chip
            key={s.label}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Typography sx={{ fontWeight: 700, color: s.color, fontSize: "1rem" }}>
                  {s.value}
                </Typography>
                <Typography variant="caption" sx={{ color: TEXT_M }}>{s.label}</Typography>
              </Box>
            }
            sx={{
              background: "rgba(45,18,0,0.5)",
              border: "1px solid rgba(107,51,24,0.3)",
              borderRadius: "12px",
              px: 1,
            }}
          />
        ))}
      </Stack>

      {tables.length === 0 ? (
        <EmptyState
          icon="🪑"
          title="No tables yet"
          description="Add your first table to start generating QR codes for customers."
          action={
            <Button
              variant="contained"
              onClick={() => setAddModal(true)}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                color: "#FFF8ED",
                fontWeight: 700,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
              }}
            >
              + Add table
            </Button>
          }
        />
      ) : (
        <Grid container spacing={2}>
          {pagedTables.map(table => {
            const sc = STATUS_COLORS[table.status] ?? STATUS_COLORS.available;
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }} key={table.id}>
              <Paper
                elevation={0}
                sx={{
                  position: "relative",
                  p: 2.5,
                  borderRadius: "16px",
                  background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
                  border: `1px solid ${sc.border}`,
                  backdropFilter: "blur(6px)",
                  transition: "all 0.15s",
                  "&:hover": { transform: "scale(1.02)", borderColor: sc.border },
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                }}
              >
                {/* Number + status dot */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1.3rem",
                      background: sc.bg,
                      color: sc.text,
                      border: `1px solid ${sc.border}`,
                    }}
                  >
                    {table.table_number}
                  </Box>
                  <Box
                    sx={{
                      position: "absolute",
                      top: 18,
                      right: 18,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: sc.text,
                      boxShadow: `0 0 8px ${sc.text}`,
                    }}
                  />
                </Stack>

                <Box>
                  <Typography sx={{ fontWeight: 600, color: TEXT_P, fontSize: "0.95rem" }}>
                    {table.table_name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: TEXT_M }}>
                    {table.capacity} seats
                    {table.assigned_waiter && ` · ${table.assigned_waiter.full_name}`}
                  </Typography>
                </Box>

                {/* Status badge */}
                <Box
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: "8px",
                    background: sc.bg,
                    color: sc.text,
                    border: `1px solid ${sc.border}`,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    textTransform: "capitalize",
                    textAlign: "center",
                  }}
                >
                  {table.status.replace("_", " ")}
                </Box>

                {/* Actions */}
                <FormControl fullWidth size="small" sx={inputSx}>
                  <InputLabel id={`assigned-waiter-${table.id}`} sx={{ color: TEXT_M }}>
                    Assigned {waiterWord}
                  </InputLabel>
                  <Select
                    labelId={`assigned-waiter-${table.id}`}
                    value={table.assigned_waiter?.id ?? ""}
                    label={`Assigned ${waiterWord}`}
                    disabled={assigningTableId === table.id}
                    onChange={(event) => assignWaiter(table, event.target.value)}
                  >
                    <MenuItem value="">Unassigned</MenuItem>
                    {waiters.map((waiter) => (
                      <MenuItem key={waiter.id} value={waiter.id}>{waiter.full_name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Stack direction="row" spacing={0.8}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setQrModal(table)}
                    sx={{
                      flex: 1,
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      borderRadius: "8px",
                      color: BRAND,
                      border: `1px solid ${alpha(BRAND, 0.2)}`,
                      background: alpha(BRAND, 0.1),
                      "&:hover": { background: alpha(BRAND, 0.15) },
                    }}
                  >
                    QR
                  </Button>
                  <FormControl size="small" sx={{ flex: 1, minWidth: 0 }}>
                    <Select
                      value={table.status}
                      onChange={e => changeStatus(table.id, e.target.value)}
                      inputProps={{ "aria-label": `Status for ${table.table_name}` }}
                      sx={{
                        fontSize: "0.7rem",
                        borderRadius: "8px",
                        background: "rgba(45,18,0,0.8)",
                        color: TEXT_S,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(107,51,24,0.3)",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: alpha(BRAND, 0.4),
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: BRAND,
                        },
                        ".MuiSelect-icon": { color: TEXT_M },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            bgcolor: "#1C0A00",
                            border: "1px solid rgba(212,133,10,0.2)",
                            "& .MuiMenuItem-root": {
                              color: TEXT_S,
                              "&:hover": { bgcolor: alpha(BRAND, 0.1) },
                            },
                          },
                        },
                      }}
                    >
                      <MenuItem value="available">Available</MenuItem>
                      <MenuItem value="occupied">Occupied</MenuItem>
                      <MenuItem value="ordering">Ordering</MenuItem>
                      <MenuItem value="needs_waiter">Needs Waiter</MenuItem>
                      <MenuItem value="bill_requested">Bill Req.</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </Paper>
              </Grid>
            );
          })}
        </Grid>
      )}
      {!loading && orderedTables.length > 0 && (
        <Stack alignItems="center" sx={{ mt: 3 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            aria-label="Tables pages"
          />
        </Stack>
      )}

      {/* Add table modal */}
      <Modal
        open={addModal}
        onClose={() => setAddModal(false)}
        title="Add new table"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => setAddModal(false)}
              sx={{
                borderRadius: "14px",
                color: TEXT_S,
                borderColor: "rgba(212,133,10,0.3)",
                background: "rgba(45,18,0,0.8)",
                "&:hover": { borderColor: BRAND, background: alpha(BRAND, 0.06) },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={addTable}
              disabled={saving || !form.tableNumber}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                color: "#FFF8ED",
                fontWeight: 700,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                "&:hover": { background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)` },
              }}
            >
              {saving ? "Creating…" : "Create table"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.5}>
          {/* Grid inside modal – kept as MUI Grid since it works fine here */}
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }} >
              <TextField
                label="Table number *"
                type="number"
                placeholder="1"
                value={form.tableNumber}
                onChange={e => setForm(f => ({ ...f, tableNumber: e.target.value }))}
                required
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: !!form.tableNumber || undefined }}
              />
            </Grid>
            <Grid size={{ xs: 6 }} >
              <TextField
                label="Capacity"
                type="number"
                placeholder="4"
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                fullWidth
                sx={inputSx}
              />
            </Grid>
          </Grid>
          <TextField
            label="Table name (optional)"
            placeholder="Window table, VIP booth…"
            value={form.tableName}
            onChange={e => setForm(f => ({ ...f, tableName: e.target.value }))}
            fullWidth
            sx={inputSx}
          />
          <FormControl fullWidth sx={inputSx}>
            <InputLabel sx={{ color: TEXT_M, "&.Mui-focused": { color: BRAND } }}>Assign {waiterWord}</InputLabel>
            <Select
              value={form.assignedWaiterId}
              label={`Assign ${waiterWord}`}
              onChange={e => setForm(f => ({ ...f, assignedWaiterId: e.target.value }))}
            >
              <MenuItem value="">None</MenuItem>
              {waiters.map(w => (
                <MenuItem key={w.id} value={w.id}>{w.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Modal>

      {/* QR modal */}
      <Modal
        open={!!qrModal}
        onClose={() => setQrModal(null)}
        title={`Table ${qrModal?.table_number} QR Code`}
      >
        <Stack alignItems="center" spacing={3}>
          <Box sx={{ p: 3, borderRadius: "16px", background: "#F9EDD8" }}>
            <canvas ref={qrCanvasRef} />
          </Box>
          <Box textAlign="center">
            <Typography sx={{ fontWeight: 600, color: TEXT_P, mb: 0.5 }}>
              {qrModal?.table_name}
            </Typography>
            <Typography variant="caption" sx={{ color: TEXT_M, wordBreak: "break-all" }}>
              {qrModal?.qr_code_url}
            </Typography>
          </Box>
          <Stack direction="row" spacing={2} width="100%">
            <Button
              variant="outlined"
              fullWidth
              onClick={copyQrUrl}
              sx={{
                borderRadius: "14px",
                color: TEXT_S,
                borderColor: "rgba(212,133,10,0.3)",
                background: "rgba(45,18,0,0.8)",
                "&:hover": { borderColor: BRAND, background: alpha(BRAND, 0.06) },
              }}
            >
              Copy URL
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={downloadQr}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                color: "#FFF8ED",
                fontWeight: 700,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                "&:hover": { background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)` },
              }}
            >
              Download PNG
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </Box>
  );
}
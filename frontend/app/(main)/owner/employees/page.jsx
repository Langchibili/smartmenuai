"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Button, Chip, Avatar, Stack, Grid, Paper,
  TextField, FormControl, InputLabel, Select, MenuItem, CircularProgress,
  Divider, alpha,
} from "@mui/material";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { employeeApi, branchApi, flattenStrapiResponse } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { initials } from "@/lib/utils";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND = "#D4850A";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const ERROR = "#ef4444";

// ─── Role colors ─────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  owner: "#D4850A",
  manager: "#3b82f6",
  waiter: "#22c55e",
};

// ─── Skeleton fallback ───────────────────────────────────────────────────────
const Skeleton = ({ height = 20, width = "100%", ...props }) => (
  <Box sx={{ borderRadius: "8px", background: "rgba(45,18,0,0.6)", height, width }} {...props} />
);

// ─── Styled input ─────────────────────────────────────────────────────────────
const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "rgba(45,18,0,0.8)",
    color: TEXT_P,
    fontSize: 14,
    transition: "all 220ms",
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

export default function EmployeesPage() {
  const { business, employee: me } = useAuth();
  const { toast } = useToast();

  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteModal, setInviteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    invited_name: "", invited_email: "", phone: "",
    role: "waiter", branch_id: "",
  });

  const load = useCallback(async () => {
    if (!business?.id) return;
    try {
      const [empRes, branchRes] = await Promise.all([
        employeeApi.getEmployees(business.id),
        branchApi.getBranches(business.id),
      ]);
      const emps = flattenStrapiResponse(empRes);
      const brs = flattenStrapiResponse(branchRes);
      setEmployees(Array.isArray(emps) ? emps : emps ? [emps] : []);
      setBranches(Array.isArray(brs) ? brs : brs ? [brs] : []);
    } catch {
      toast("Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  }, [business?.id, toast]);

  useEffect(() => { load(); }, [load]);

  const sendInvite = async () => {
    if (!form.invited_name || !form.invited_email || !form.role) return;
    setSaving(true);
    try {
      const res = await employeeApi.sendInvite({
        ...form,
        branch_id: form.branch_id ? parseInt(form.branch_id) : undefined,
        business_id: business.id,
        business_name: business.business_name,
      });
      toast(
        res.emailSent
          ? `Invite sent to ${form.invited_email}`
          : `Invite created. Share this link: ${res.inviteLink}`,
        "success"
      );
      setInviteModal(false);
      setForm({ invited_name: "", invited_email: "", phone: "", role: "waiter", branch_id: "" });
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (emp) => {
    try {
      await employeeApi.updateEmployee(emp.id, { is_active: !emp.is_active });
      setEmployees(prev => prev.map(e => e.id === emp.id ? { ...e, is_active: !e.is_active } : e));
      toast(`${emp.full_name} ${!emp.is_active ? "activated" : "deactivated"}`, "success");
    } catch (e) {
      toast(e.message, "error");
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, lg: 4 } }}>
        <Skeleton height={32} width="12rem" sx={{ mb: 3 }} />
        <Stack spacing={1.5}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height={80} />
          ))}
        </Stack>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: "1200px", mx: "auto" }}>
      {/* Header */}
      <PageHeader
        title="Employees"
        icon="👥"
        subtitle={`${employees.filter(e => e.is_active).length} active staff`}
        actions={
          <Button
            variant="contained"
            onClick={() => setInviteModal(true)}
            sx={{
              borderRadius: "14px",
              background: `linear-gradient(135deg, ${BRAND}, #A0622A)`,
              color: "#FFF8ED",
              fontWeight: 700,
              fontSize: "0.85rem",
              px: 2.5,
              boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
              "&:hover": {
                background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                boxShadow: `0 8px 24px ${alpha(BRAND, 0.45)}`,
              },
            }}
          >
            + Invite staff
          </Button>
        }
      />

      {/* Role summary */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 4, flexWrap: "wrap", gap: 1.5 }}>
        {["owner", "manager", "waiter"].map(role => {
          const count = employees.filter(e => e.role === role && e.is_active).length;
          if (count === 0) return null;
          return (
            <Chip
              key={role}
              icon={
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: ROLE_COLORS[role], mx: "6px !important" }} />
              }
              label={`${count} ${role}${count > 1 ? "s" : ""}`}
              sx={{
                background: "rgba(45,18,0,0.5)",
                border: "1px solid rgba(107,51,24,0.3)",
                color: TEXT_S,
                fontWeight: 600,
                fontSize: "0.85rem",
              }}
            />
          );
        })}
      </Stack>

      {employees.length === 0 ? (
        <EmptyState
          icon="👥"
          title="No employees yet"
          description="Invite your first team member to get started."
          action={
            <Button
              variant="contained"
              onClick={() => setInviteModal(true)}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, #A0622A)`,
                color: "#FFF8ED",
                fontWeight: 700,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
              }}
            >
              + Invite staff
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {employees.map(emp => (
            <Paper
              key={emp.id}
              elevation={0}
              sx={{
                px: 3,
                py: 2.5,
                borderRadius: "14px",
                background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
                border: "1px solid rgba(107,51,24,0.25)",
                backdropFilter: "blur(6px)",
                opacity: emp.is_active ? 1 : 0.5,
                display: "flex",
                alignItems: "center",
                gap: 2,
                transition: "all 0.15s",
                "&:hover": { borderColor: "rgba(212,133,10,0.3)" },
              }}
            >
              {/* Avatar */}
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  background: emp.is_active
                    ? `linear-gradient(135deg, ${ROLE_COLORS[emp.role]}, #3B1A06)`
                    : "rgba(45,18,0,0.8)",
                }}
              >
                {initials(emp.full_name ?? "?")}
              </Avatar>

              {/* Info */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                  <Typography sx={{ fontWeight: 600, color: TEXT_P, fontSize: "0.95rem" }}>
                    {emp.full_name}
                  </Typography>
                  <Chip
                    label={emp.role}
                    size="small"
                    sx={{
                      fontWeight: 700,
                      fontSize: "0.65rem",
                      background: `${ROLE_COLORS[emp.role]}20`,
                      color: ROLE_COLORS[emp.role],
                      border: `1px solid ${ROLE_COLORS[emp.role]}40`,
                    }}
                  />
                  {!emp.is_active && (
                    <Chip
                      label="Inactive"
                      size="small"
                      sx={{ fontWeight: 600, fontSize: "0.65rem", color: TEXT_M, background: "rgba(45,18,0,0.6)" }}
                    />
                  )}
                </Stack>
                <Typography sx={{ fontSize: "0.75rem", color: TEXT_M }}>
                  {emp.user?.email ?? "No email"}
                  {emp.branch?.branch_name && ` · ${emp.branch.branch_name}`}
                </Typography>
              </Box>

              {/* Permissions (desktop) */}
              <Box sx={{ display: { xs: "none", md: "flex" }, flexWrap: "wrap", gap: 0.5, maxWidth: 200 }}>
                {Object.entries(emp.permissions ?? {})
                  .filter(([, v]) => v)
                  .slice(0, 3)
                  .map(([k]) => (
                    <Chip
                      key={k}
                      label={k.replace("_", " ")}
                      size="small"
                      sx={{ fontSize: "0.65rem", color: TEXT_M, background: "rgba(45,18,0,0.6)" }}
                    />
                  ))}
                {Object.values(emp.permissions ?? {}).filter(Boolean).length > 3 && (
                  <Chip
                    label={`+${Object.values(emp.permissions ?? {}).filter(Boolean).length - 3}`}
                    size="small"
                    sx={{ fontSize: "0.65rem", color: TEXT_M, background: "rgba(45,18,0,0.6)" }}
                  />
                )}
              </Box>

              {/* Action — don't allow disabling yourself */}
              {emp.id !== me?.id && emp.role !== "owner" && (
                <Button
                  size="small"
                  onClick={() => toggleActive(emp)}
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    px: 2,
                    py: 0.8,
                    borderRadius: "10px",
                    color: emp.is_active ? ERROR : GREEN,
                    border: `1px solid ${emp.is_active ? alpha(ERROR, 0.3) : alpha(GREEN, 0.3)}`,
                    background: emp.is_active ? alpha(ERROR, 0.07) : alpha(GREEN, 0.07),
                    "&:hover": {
                      background: emp.is_active ? alpha(ERROR, 0.12) : alpha(GREEN, 0.12),
                    },
                    whiteSpace: "nowrap",
                  }}
                >
                  {emp.is_active ? "Deactivate" : "Activate"}
                </Button>
              )}
            </Paper>
          ))}
        </Stack>
      )}

      {/* Invite modal */}
      <Modal
        open={inviteModal}
        onClose={() => setInviteModal(false)}
        title="Invite team member"
        size="md"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => setInviteModal(false)}
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
              onClick={sendInvite}
              disabled={saving || !form.invited_name || !form.invited_email}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, #A0622A)`,
                color: "#FFF8ED",
                fontWeight: 700,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                  boxShadow: `0 8px 24px ${alpha(BRAND, 0.45)}`,
                },
              }}
            >
              {saving ? "Sending…" : "Send invite"}
            </Button>
          </>
        }
      >
        <Stack spacing={3}>
          {/* Info alert */}
          <Box
            sx={{
              p: 2,
              borderRadius: "14px",
              background: alpha(BRAND, 0.05),
              border: `1px solid ${alpha(BRAND, 0.15)}`,
              color: TEXT_S,
              fontSize: "0.8rem",
            }}
          >
            An invite link will be emailed to the staff member. They can register or sign in to accept it.
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full name *"
                placeholder="Jane Smith"
                value={form.invited_name}
                onChange={e => setForm(f => ({ ...f, invited_name: e.target.value }))}
                required
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: !!form.invited_name || undefined }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                placeholder="+260 97…"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                fullWidth
                sx={inputSx}
              />
            </Grid>
          </Grid>

          <TextField
            label="Email address *"
            type="email"
            placeholder="jane@restaurant.com"
            value={form.invited_email}
            onChange={e => setForm(f => ({ ...f, invited_email: e.target.value }))}
            required
            fullWidth
            sx={inputSx}
            InputLabelProps={{ shrink: !!form.invited_email || undefined }}
          />

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel sx={{ color: TEXT_M, "&.Mui-focused": { color: BRAND } }}>Role *</InputLabel>
                <Select
                  value={form.role}
                  label="Role *"
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                >
                  <MenuItem value="waiter">Waiter</MenuItem>
                  <MenuItem value="manager">Manager</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth sx={inputSx}>
                <InputLabel sx={{ color: TEXT_M, "&.Mui-focused": { color: BRAND } }}>Branch</InputLabel>
                <Select
                  value={form.branch_id}
                  label="Branch"
                  onChange={e => setForm(f => ({ ...f, branch_id: e.target.value }))}
                >
                  <MenuItem value="">All branches</MenuItem>
                  {branches.map(b => (
                    <MenuItem key={b.id} value={b.id}>{b.branch_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Stack>
      </Modal>
    </Box>
  );
}
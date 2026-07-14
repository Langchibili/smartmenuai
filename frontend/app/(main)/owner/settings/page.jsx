"use client";
import { useEffect, useState } from "react";
import {
  Box, Typography, Button, Paper, Chip, Divider, Grid, Stack, TextField,
  alpha,
} from "@mui/material";
import { useAuth } from "@/lib/auth-context";
import { branchApi, flattenStrapiResponse } from "@/lib/api";
import { PageHeader } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND = "#D4850A";
const BRAND_DARK = "#A0622A";
const GOLD = "#F5C842";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";
const GREEN = "#22c55e";
const ERROR = "#ef4444";

const CURRENCIES = ["USD", "EUR", "GBP", "ZMW", "KES", "ZAR", "NGN", "GHS", "TZS", "UGX"];
const BUSINESS_TYPES = ["restaurant", "bar", "cafe", "lounge", "club"];

// ─── Reusable input sx ───────────────────────────────────────────────────────
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
  "& textarea": { color: TEXT_P },
};

// ─── Section paper sx ────────────────────────────────────────────────────────
const sectionSx = {
  p: 3,
  borderRadius: "16px",
  background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
  border: "1px solid rgba(107,51,24,0.25)",
  backdropFilter: "blur(6px)",
};

export default function SettingsPage() {
  const { business, user, employee, refreshBusiness } = useAuth();
  const { toast } = useToast();

  const [branches, setBranches] = useState([]);
  const [branchModal, setBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [saving, setSaving] = useState(false);

  const [branchForm, setBranchForm] = useState({
    branch_name: "", location: "", address: "", city: "", phone: "",
  });

  useEffect(() => {
    if (!business?.id) return;
    branchApi.getBranches(business.id).then(res => {
      const brs = flattenStrapiResponse(res);
      setBranches(Array.isArray(brs) ? brs : brs ? [brs] : []);
    });
  }, [business?.id]);

  const openBranchModal = (branch) => {
    setEditingBranch(branch ?? null);
    setBranchForm(branch ? {
      branch_name: branch.branch_name,
      location: branch.location ?? "",
      address: branch.address ?? "",
      city: branch.city ?? "",
      phone: branch.phone ?? "",
    } : { branch_name: "", location: "", address: "", city: "", phone: "" });
    setBranchModal(true);
  };

  const saveBranch = async () => {
    if (!branchForm.branch_name) return;
    setSaving(true);
    try {
      if (editingBranch) {
        await branchApi.updateBranch(editingBranch.id, { ...branchForm, business: business.id });
        toast("Branch updated", "success");
      } else {
        await branchApi.createBranch({ ...branchForm, business: business.id });
        toast("Branch created", "success");
      }
      setBranchModal(false);
      const res = await branchApi.getBranches(business.id);
      const brs = flattenStrapiResponse(res);
      setBranches(Array.isArray(brs) ? brs : brs ? [brs] : []);
      refreshBusiness();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const deleteBranch = async (id) => {
    if (!confirm("Delete this branch? All associated tables will also be removed.")) return;
    try {
      await branchApi.deleteBranch(id);
      toast("Branch deleted", "success");
      setBranches(prev => prev.filter(b => b.id !== id));
    } catch (e) { toast(e.message, "error"); }
  };

  return (
    <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: "800px", mx: "auto" }}>
      <PageHeader title="Settings" icon="⚙" subtitle="Business profile and configuration" />

      <Stack spacing={3}>
        {/* Business profile */}
        <Paper elevation={0} sx={sectionSx}>
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: TEXT_P, mb: 3, fontSize: "1rem" }}>
            Business profile
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                label="Business name"
                value={business?.business_name ?? ""}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: true }}
                helperText="To change your business name, contact support."
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Business type"
                value={business?.business_type ?? ""}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: true }}
                inputProps={{ style: { textTransform: "capitalize" } }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Currency"
                value={business?.currency ?? ""}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="City"
                value={business?.city ?? ""}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Country"
                value={business?.country ?? ""}
                InputProps={{ readOnly: true }}
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Account info */}
        <Paper elevation={0} sx={sectionSx}>
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: TEXT_P, mb: 3, fontSize: "1rem" }}>
            Account
          </Typography>
          <Stack spacing={0}>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid rgba(107,51,24,0.2)" }}>
              <Typography variant="body2" sx={{ color: TEXT_M }}>Email</Typography>
              <Typography variant="body2" sx={{ color: TEXT_S }}>{user?.email}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5, borderBottom: "1px solid rgba(107,51,24,0.2)" }}>
              <Typography variant="body2" sx={{ color: TEXT_M }}>Role</Typography>
              <Typography variant="body2" sx={{ color: TEXT_S, textTransform: "capitalize" }}>{employee?.role}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", py: 1.5 }}>
              <Typography variant="body2" sx={{ color: TEXT_M }}>Plan</Typography>
              <Chip
                label={business?.plan_type ?? "basic"}
                size="small"
                sx={{
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  background: business?.plan_type === "premium"
                    ? alpha("#f59e0b", 0.15)
                    : alpha(BRAND, 0.1),
                  color: business?.plan_type === "premium" ? "#f59e0b" : BRAND,
                  border: `1px solid ${business?.plan_type === "premium" ? alpha("#f59e0b", 0.3) : alpha(BRAND, 0.25)}`,
                  textTransform: "capitalize",
                }}
              />
            </Box>
          </Stack>
        </Paper>

        {/* Branches */}
        <Paper elevation={0} sx={sectionSx}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: TEXT_P, fontSize: "1rem" }}>
              Branches
            </Typography>
            <Button
              variant="outlined"
              onClick={() => openBranchModal()}
              sx={{
                borderRadius: "14px",
                color: TEXT_S,
                borderColor: "rgba(212,133,10,0.3)",
                background: "rgba(45,18,0,0.8)",
                fontWeight: 600,
                fontSize: "0.85rem",
                "&:hover": { borderColor: BRAND, background: alpha(BRAND, 0.06) },
              }}
            >
              + Add branch
            </Button>
          </Box>

          {branches.length === 0 ? (
            <Typography sx={{ textAlign: "center", py: 6, color: TEXT_D }}>
              No branches configured.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {branches.map(branch => (
                <Paper
                  key={branch.id}
                  elevation={0}
                  sx={{
                    px: 2.5,
                    py: 2,
                    borderRadius: "12px",
                    background: "rgba(45,18,0,0.4)",
                    border: "1px solid rgba(107,51,24,0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: TEXT_P, fontSize: "0.9rem" }}>
                      {branch.branch_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: TEXT_M }}>
                      {[branch.city, branch.address].filter(Boolean).join(" · ")}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => openBranchModal(branch)}
                      sx={{ color: TEXT_S, fontWeight: 500, "&:hover": { color: BRAND } }}
                    >
                      Edit
                    </Button>
                    {branches.length > 1 && (
                      <Button
                        size="small"
                        variant="text"
                        onClick={() => deleteBranch(branch.id)}
                        sx={{
                          color: ERROR,
                          fontWeight: 500,
                          "&:hover": { background: alpha(ERROR, 0.12) },
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          )}
        </Paper>

        {/* Danger zone */}
        <Paper
          elevation={0}
          sx={{
            ...sectionSx,
            border: `1px solid ${alpha(ERROR, 0.2)}`,
          }}
        >
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: ERROR, mb: 2, fontSize: "1rem" }}>
            Danger zone
          </Typography>
          <Typography sx={{ fontSize: "0.9rem", color: TEXT_M, mb: 3 }}>
            Permanent actions that cannot be undone.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => toast("Contact support to delete your account.", "info")}
            sx={{
              borderRadius: "14px",
              color: ERROR,
              borderColor: alpha(ERROR, 0.3),
              background: alpha(ERROR, 0.07),
              fontWeight: 600,
              "&:hover": { background: alpha(ERROR, 0.12) },
            }}
          >
            Delete business account
          </Button>
        </Paper>
      </Stack>

      {/* Branch modal */}
      <Modal
        open={branchModal}
        onClose={() => setBranchModal(false)}
        title={editingBranch ? "Edit branch" : "New branch"}
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => setBranchModal(false)}
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
              onClick={saveBranch}
              disabled={saving || !branchForm.branch_name}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                color: "#FFF8ED",
                fontWeight: 700,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                "&:hover": { background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)` },
              }}
            >
              {saving ? "Saving…" : editingBranch ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.5}>
          <TextField
            label="Branch name *"
            placeholder="Main Branch"
            value={branchForm.branch_name}
            onChange={e => setBranchForm(f => ({ ...f, branch_name: e.target.value }))}
            required
            fullWidth
            sx={inputSx}
            InputLabelProps={{ shrink: !!branchForm.branch_name || undefined }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="City"
                placeholder="Lusaka"
                value={branchForm.city}
                onChange={e => setBranchForm(f => ({ ...f, city: e.target.value }))}
                fullWidth
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Phone"
                placeholder="+260…"
                value={branchForm.phone}
                onChange={e => setBranchForm(f => ({ ...f, phone: e.target.value }))}
                fullWidth
                sx={inputSx}
              />
            </Grid>
          </Grid>
          <TextField
            label="Address"
            placeholder="123 Main St"
            value={branchForm.address}
            onChange={e => setBranchForm(f => ({ ...f, address: e.target.value }))}
            fullWidth
            sx={inputSx}
          />
        </Stack>
      </Modal>
    </Box>
  );
}
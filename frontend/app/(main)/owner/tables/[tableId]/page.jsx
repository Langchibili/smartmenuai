"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { tableApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast-provider";

const STATUS_LABELS = {
  available: "Available",
  occupied: "Occupied",
  ordering: "Ordering",
  needs_waiter: "Needs waiter",
  bill_requested: "Bill requested",
};

export default function OwnerTableDetailsPage() {
  const { tableId } = useParams();
  const { business } = useAuth();
  const { toast } = useToast();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!business?.id || !tableId) return;
    setLoading(true);
    try {
      const result = await tableApi.getBusinessTables(business.id);
      const found = (result.tables ?? []).find((item) => String(item.id) === String(tableId));
      if (!found) {
        setError("This table was not found in your business.");
        setTable(null);
      } else {
        setTable(found);
        setError("");
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load this table.");
    } finally {
      setLoading(false);
    }
  }, [business?.id, tableId]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status) => {
    if (!table) return;
    setSaving(true);
    try {
      await tableApi.updateTableStatus(table.id, status);
      setTable((current) => ({ ...current, status }));
      toast("Table status updated", "success");
    } catch (updateError) {
      toast(updateError.message || "Failed to update table status", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 900, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="overline" sx={{ color: "#8B6038" }}>Table details</Typography>
          <Typography component="h1" sx={{ color: "#F9EDD8", fontSize: "1.7rem", fontWeight: 700 }}>
            {table?.table_name || (table ? `Table ${table.table_number}` : "Table")}
          </Typography>
        </Box>
        {table && (
          <Chip
            label={STATUS_LABELS[table.status] ?? table.status?.replaceAll("_", " ")}
            sx={{ color: "#F9EDD8", bgcolor: "rgba(212,133,10,0.15)", textTransform: "capitalize" }}
          />
        )}
      </Stack>

      {loading && <CircularProgress sx={{ color: "#D4850A" }} />}
      {error && (
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={load}>Retry</Button>}>
          {error}
        </Alert>
      )}
      {table && !loading && (
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: 4,
            bgcolor: "rgba(45,18,0,0.58)",
            border: "1px solid rgba(212,133,10,0.18)",
          }}
        >
          <Grid container spacing={2}>
            {[
              ["Table number", table.table_number],
              ["Capacity", `${table.capacity ?? "—"} seats`],
              ["Assigned waiter", table.assigned_waiter?.full_name ?? "Unassigned"],
              ["QR menu", table.qr_code_url ?? "Not available"],
            ].map(([label, value]) => (
              <Grid size={{ xs: 12, sm: 6 }} key={label}>
                <Typography variant="caption" sx={{ color: "#8B6038" }}>{label}</Typography>
                <Typography sx={{ color: "#F9EDD8", overflowWrap: "anywhere" }}>{value}</Typography>
              </Grid>
            ))}
          </Grid>
          <FormControl fullWidth sx={{ mt: 3, maxWidth: 360 }}>
            <InputLabel sx={{ color: "#8B6038" }}>Table status</InputLabel>
            <Select
              value={table.status}
              label="Table status"
              disabled={saving}
              onChange={(event) => updateStatus(event.target.value)}
              sx={{
                color: "#F9EDD8",
                ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(212,133,10,0.3)" },
                ".MuiSvgIcon-root": { color: "#D4A872" },
              }}
            >
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>
      )}
    </Box>
  );
}

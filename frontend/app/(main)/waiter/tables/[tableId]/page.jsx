"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "@/lib/auth-context";
import { waiterCallApi } from "@/lib/api";

export default function WaiterTableDetailsPage() {
  const { tableId } = useParams();
  const { employee, business } = useAuth();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!employee?.id || !business?.id || !tableId) return;
    setLoading(true);
    try {
      const result = await waiterCallApi.getWaiterDashboard(employee.id, business.id);
      const found = (result.assignedTables ?? []).find(
        (item) => String(item.id) === String(tableId)
      );
      if (!found) {
        setTable(null);
        setError("This table is not assigned to your account.");
      } else {
        setTable(found);
        setError("");
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load this table.");
    } finally {
      setLoading(false);
    }
  }, [business?.id, employee?.id, tableId]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 3, maxWidth: 760, mx: "auto" }}>
      <Typography variant="overline" sx={{ color: "#8B6038" }}>My assigned table</Typography>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography component="h1" sx={{ color: "#F9EDD8", fontSize: "1.7rem", fontWeight: 700 }}>
          {table?.table_name || (table ? `Table ${table.table_number}` : "Table")}
        </Typography>
        {table && (
          <Chip
            label={table.status?.replaceAll("_", " ")}
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
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: "#8B6038" }}>Capacity</Typography>
              <Typography sx={{ color: "#F9EDD8" }}>{table.capacity ?? "—"} seats</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" sx={{ color: "#8B6038" }}>Table number</Typography>
              <Typography sx={{ color: "#F9EDD8" }}>{table.table_number}</Typography>
            </Grid>
            {table.qr_code_url && (
              <Grid item xs={12}>
                <Typography variant="caption" sx={{ color: "#8B6038" }}>Guest menu QR URL</Typography>
                <Typography sx={{ color: "#D4A872", overflowWrap: "anywhere" }}>{table.qr_code_url}</Typography>
              </Grid>
            )}
          </Grid>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
            <Button component={Link} href="/waiter/orders" variant="contained" sx={{ bgcolor: "#D4850A", color: "#1C0A00" }}>
              View my orders
            </Button>
            <Button component={Link} href="/waiter/alerts" variant="outlined" sx={{ color: "#D4A872", borderColor: "rgba(212,133,10,0.35)" }}>
              View waiter alerts
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}

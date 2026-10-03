"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  SwipeableDrawer,
  Typography,
  alpha,
} from "@mui/material";

const STATUS_LABELS = {
  available: "Available",
  occupied: "Occupied",
  ordering: "Ordering",
  needs_waiter: "Needs waiter",
  bill_requested: "Bill requested",
};

export default function TablePreviewDrawer({
  table,
  onClose,
  viewMoreHref,
  onStatusChange,
  actionLabel,
  onAction,
  busy = false,
}) {
  const open = Boolean(table);

  useEffect(() => {
    if (!open) return undefined;
    const handleBackRequest = (event) => {
      if (event.detail?.handled) return;
      event.detail.handled = true;
      onClose();
    };
    window.addEventListener("smartmenu:back-request", handleBackRequest);
    return () => window.removeEventListener("smartmenu:back-request", handleBackRequest);
  }, [open, onClose]);

  return (
    <SwipeableDrawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 720,
          mx: "auto",
          maxHeight: "82dvh",
          borderRadius: "22px 22px 0 0",
          bgcolor: "#1C0A00",
          color: "#F9EDD8",
          border: `1px solid ${alpha("#D4850A", 0.2)}`,
          borderBottom: 0,
          overflowY: "auto",
          pb: "env(safe-area-inset-bottom, 12px)",
        },
      }}
    >
      {table && (
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 1.5, pb: 3 }}>
          <Box
            sx={{
              width: 38,
              height: 4,
              borderRadius: 4,
              bgcolor: alpha("#F9EDD8", 0.35),
              mx: "auto",
              mb: 2.5,
            }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ color: "#8B6038", letterSpacing: 1.1 }}>
                Table preview
              </Typography>
              <Typography
                component="h2"
                sx={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: '"Playfair Display", Georgia, serif' }}
              >
                {table.table_name || `Table ${table.table_number}`}
              </Typography>
              <Typography variant="body2" sx={{ color: "#D4A872", mt: 0.4 }}>
                Table {table.table_number} · {table.capacity ?? "—"} seats
              </Typography>
            </Box>
            <Chip
              label={STATUS_LABELS[table.status] ?? table.status?.replaceAll("_", " ")}
              size="small"
              sx={{
                mt: 1,
                color: "#F9EDD8",
                bgcolor: alpha("#D4850A", 0.16),
                border: `1px solid ${alpha("#D4850A", 0.28)}`,
                textTransform: "capitalize",
              }}
            />
          </Stack>

          <Divider sx={{ my: 2.5, borderColor: alpha("#D4850A", 0.16) }} />

          <Stack spacing={1.25}>
            <Typography variant="body2" sx={{ color: "#D4A872" }}>
              Assigned waiter: {table.assigned_waiter?.full_name ?? table.waiter?.full_name ?? "Unassigned"}
            </Typography>
            {table.branch?.branch_name && (
              <Typography variant="body2" sx={{ color: "#D4A872" }}>
                Branch: {table.branch.branch_name}
              </Typography>
            )}
            {table.qr_code_url && (
              <Typography variant="body2" sx={{ color: "#8B6038", overflowWrap: "anywhere" }}>
                QR menu: {table.qr_code_url}
              </Typography>
            )}
          </Stack>

          {onStatusChange && (
            <FormControl fullWidth size="small" sx={{ mt: 2.5 }}>
              <InputLabel id="table-preview-status-label" sx={{ color: "#8B6038" }}>
                Update table status
              </InputLabel>
              <Select
                labelId="table-preview-status-label"
                value={table.status}
                label="Update table status"
                disabled={busy}
                onChange={(event) => onStatusChange(table, event.target.value)}
                sx={{
                  color: "#F9EDD8",
                  ".MuiOutlinedInput-notchedOutline": { borderColor: alpha("#D4850A", 0.3) },
                  "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#D4850A" },
                  ".MuiSvgIcon-root": { color: "#D4A872" },
                }}
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 3 }}>
            {actionLabel && onAction && (
              <Button
                variant="outlined"
                disabled={busy}
                onClick={() => onAction(table)}
                sx={{
                  flex: 1,
                  borderRadius: 2.5,
                  color: "#F9EDD8",
                  borderColor: alpha("#D4850A", 0.35),
                }}
              >
                {actionLabel}
              </Button>
            )}
            <Button
              component={Link}
              href={viewMoreHref}
              variant="contained"
              sx={{
                flex: 1,
                borderRadius: 2.5,
                bgcolor: "#D4850A",
                color: "#1C0A00",
                fontWeight: 700,
                "&:hover": { bgcolor: "#E8970F" },
              }}
            >
              View more
            </Button>
          </Stack>
        </Box>
      )}
    </SwipeableDrawer>
  );
}

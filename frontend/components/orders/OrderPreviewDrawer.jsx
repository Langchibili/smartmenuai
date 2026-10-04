"use client";

import { Box, Button, Chip, Divider, Stack, SwipeableDrawer, Typography, alpha } from "@mui/material";
import Link from "next/link";
import { formatCurrency, orderStatusLabel } from "@/lib/utils";
import { getMediaUrl } from "@/lib/utils";
import ImagePreview from "@/components/ui/image-preview";

export default function OrderPreviewDrawer({ order, onClose, currency = "USD" }) {
  return (
    <SwipeableDrawer
      anchor="bottom"
      open={Boolean(order)}
      onClose={onClose}
      onOpen={() => {}}
      disableSwipeToOpen
      PaperProps={{
        sx: {
          width: "100%",
          maxWidth: 720,
          mx: "auto",
          maxHeight: "82dvh",
          overflowY: "auto",
          borderRadius: "22px 22px 0 0",
          bgcolor: "#1C0A00",
          color: "#F9EDD8",
          border: `1px solid ${alpha("#D4850A", 0.2)}`,
          borderBottom: 0,
          pb: "env(safe-area-inset-bottom, 12px)",
        },
      }}
    >
      {order && (
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pt: 1.5, pb: 3 }}>
          <Box sx={{ width: 38, height: 4, borderRadius: 4, bgcolor: alpha("#F9EDD8", 0.35), mx: "auto", mb: 2.5 }} />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
            <Box>
              <Typography variant="overline" sx={{ color: "#8B6038", letterSpacing: 1.1 }}>
                Order preview
              </Typography>
              <Typography component="h2" sx={{ fontSize: "1.5rem", fontWeight: 700 }}>
                #{order.numeric_order_number || order.order_number}
              </Typography>
              <Typography variant="body2" sx={{ color: "#D4A872", mt: 0.4 }}>
                Table {order.table?.table_number ?? "—"}
              </Typography>
            </Box>
            <Chip
              label={orderStatusLabel(order.status)}
              size="small"
              sx={{
                mt: 1,
                color: "#F9EDD8",
                bgcolor: alpha("#D4850A", 0.16),
                border: `1px solid ${alpha("#D4850A", 0.28)}`,
              }}
            />
          </Stack>
          <Divider sx={{ my: 2.5, borderColor: alpha("#D4850A", 0.16) }} />
          <Stack spacing={1.25}>
            {(order.items || []).map((item, index) => (
              <Stack key={`${order.id}-${index}`} direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1.25} sx={{ minWidth: 0 }}>
                  {item.image && (
                    <ImagePreview
                      src={getMediaUrl(item.image)}
                      alt={item.name}
                      sx={{ width: 48, height: 48, borderRadius: 1.5, flexShrink: 0 }}
                    />
                  )}
                  <Typography sx={{ fontWeight: 600 }}>{item.quantity} × {item.name}</Typography>
                </Stack>
                <Typography sx={{ color: "#D4A872", whiteSpace: "nowrap" }}>
                  {formatCurrency(Number(item.price || 0) * Number(item.quantity || 0), currency)}
                </Typography>
              </Stack>
            ))}
          </Stack>
          {order.notes && (
            <Typography variant="body2" sx={{ mt: 2, color: "#D4A872" }}>
              Note: {order.notes}
            </Typography>
          )}
          <Divider sx={{ my: 2.5, borderColor: alpha("#D4850A", 0.16) }} />
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography fontWeight={700}>Total</Typography>
            <Typography fontWeight={700} sx={{ color: "#F5C842" }}>
              {formatCurrency(Number(order.total) || 0, currency)}
            </Typography>
          </Stack>
          <Button
            component={Link}
            href="/owner/orders"
            variant="contained"
            fullWidth
            sx={{ borderRadius: 2.5, bgcolor: "#D4850A", color: "#1C0A00", fontWeight: 700 }}
          >
            View orders
          </Button>
        </Box>
      )}
    </SwipeableDrawer>
  );
}

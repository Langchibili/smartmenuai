"use client";

import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { orderApi, waiterCallApi } from "@/lib/api";
import { getLastCustomerMenuUrl, getOrCreateCustomerInstallationId, formatCurrency } from "@/lib/utils";
import CustomerBottomNav from "@/components/customer/CustomerBottomNav";

function OrderCard({ order, installationId }) {
  const business = order.business;
  const location = [business?.city, business?.country].filter(Boolean).join(", ");
  const [billRequested, setBillRequested] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);
  const [billError, setBillError] = useState("");

  const requestBill = async () => {
    setRequestingBill(true);
    setBillError("");
    try {
      await waiterCallApi.requestBill(order.id, installationId);
      setBillRequested(true);
    } catch (error) {
      setBillError(error.message || "Unable to request the bill.");
    } finally {
      setRequestingBill(false);
    }
  };

  return (
    <Card sx={{ bgcolor: "#21150D", color: "#F9EDD8", border: "1px solid #49301B" }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
          <Box>
            <Typography fontWeight={700}>
              Order #{order.numeric_order_number || order.order_number}
            </Typography>
            <Typography variant="body2" color="#D4A872">
              {business?.business_name || "Business"}{location ? ` · ${location}` : ""}
            </Typography>
          </Box>
          <Chip size="small" label={order.status} color={order.status === "completed" ? "success" : "warning"} />
        </Stack>
        {order.branch?.branch_name && (
          <Typography variant="body2" color="#D4A872">{order.branch.branch_name}</Typography>
        )}
        <Typography variant="body2" color="#D4A872" sx={{ my: 1 }}>
          {new Date(order.created_date).toLocaleString()} · {formatCurrency(Number(order.total) || 0, business?.currency || "USD")}
        </Typography>
        <Stack spacing={0.5}>
          {(order.items || []).map((item, index) => (
            <Typography key={`${order.id}-${index}`} variant="body2" fontWeight={900}>
              {item.quantity} × {item.name} · {formatCurrency(Number(item.price) || 0, business?.currency || "USD")}
            </Typography>
          ))}
        </Stack>
        {order.menu_snapshot?.items?.length > 0 && (
          <Accordion
            disableGutters
            sx={{
              mt: 2,
              bgcolor: "#181008",
              color: "inherit",
              border: "1px solid #49301B",
              "&:before": { display: "none" },
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#D4A872" }} />}>
              <Box>
                <Typography fontWeight={700}>
                  Menu at time of order · {order.menu_snapshot.display_name || business?.business_name || "Menu"}
                </Typography>
                {order.menu_snapshot.tagline && (
                  <Typography variant="caption" color="#D4A872">
                    {order.menu_snapshot.tagline}
                  </Typography>
                )}
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={1}>
                {order.menu_snapshot.items.map((item, index) => (
                  <Box key={`${order.id}-menu-${item.id || index}`} sx={{ py: 0.75, borderBottom: "1px solid #49301B" }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography fontWeight={600}>{item.name}</Typography>
                      <Typography color="#D4A872">
                        {formatCurrency(Number(item.price) || 0, order.menu_snapshot.currency || business?.currency || "USD")}
                      </Typography>
                    </Stack>
                    {item.category && <Typography variant="caption" color="#D4A872">{item.category}</Typography>}
                    {item.description && <Typography variant="body2">{item.description}</Typography>}
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        )}
        {!["completed", "cancelled"].includes(order.status) && (
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {billError && <Alert severity="error">{billError}</Alert>}
            <Button
              onClick={requestBill}
              disabled={billRequested || requestingBill || !installationId}
              startIcon={<ReceiptLongIcon />}
              sx={{ alignSelf: "flex-start", color: "#F5C842" }}
            >
              {billRequested ? "Bill requested" : requestingBill ? "Requesting…" : "Request bill"}
            </Button>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default function CustomerOrdersPage() {
  const [installationId, setInstallationId] = useState("");
  const [menuHref, setMenuHref] = useState("/");
  const [orders, setOrders] = useState([]);
  const [lookupOrderNumber, setLookupOrderNumber] = useState("");
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const id = getOrCreateCustomerInstallationId();
        setMenuHref(getLastCustomerMenuUrl());
        const result = await orderApi.getCustomerHistory(id);
        if (!cancelled) {
          setInstallationId(id);
          setOrders(result.orders || []);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load your order history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const findOrder = async () => {
    const number = Number(lookupOrderNumber);
    if (!Number.isInteger(number) || number < 10000 || number > 99999) {
      setError("Enter a 5-digit order number.");
      return;
    }
    setError("");
    setLookupLoading(true);
    try {
      const result = await orderApi.getCustomerOrder(installationId, number);
      setMatchedOrder(result.order || null);
      if (!result.order) setError("No pending order with that number was found on this device.");
    } catch (lookupError) {
      setError(lookupError.message || "Unable to look up this order.");
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#100904", color: "#F9EDD8", pb: 10 }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={800}>Your orders</Typography>
            <Typography color="#D4A872">Your order history across businesses on this installation.</Typography>
          </Box>
          <Card sx={{ bgcolor: "#21150D", color: "inherit", border: "1px solid #49301B" }}>
            <CardContent>
              <Typography fontWeight={700} sx={{ mb: 1 }}>Enter order number to view pending order</Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  label="5-digit order number"
                  value={lookupOrderNumber}
                  onChange={(event) => setLookupOrderNumber(event.target.value.replace(/\D/g, "").slice(0, 5))}
                  inputProps={{ inputMode: "numeric", maxLength: 5 }}
                  fullWidth
                  sx={{ "& .MuiInputBase-root": { color: "#F9EDD8" }, "& .MuiInputLabel-root": { color: "#D4A872" } }}
                />
                <Button
                  variant="contained"
                  onClick={findOrder}
                  disabled={lookupLoading || !installationId}
                  sx={{ minWidth: { sm: 150 }, bgcolor: "#D4850A", color: "#1C0A00" }}
                >
                  {lookupLoading ? "Searching…" : "View order"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
          {error && <Alert severity="error">{error}</Alert>}
          {matchedOrder && <OrderCard order={matchedOrder} installationId={installationId} />}
          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 6 }}><CircularProgress /></Box>
          ) : orders.length ? (
            orders.map((order) => (
              <OrderCard key={order.id} order={order} installationId={installationId} />
            ))
          ) : (
            <Typography color="#D4A872">Your orders will appear here after you place an order from a QR menu.</Typography>
          )}
        </Stack>
      </Box>
      <CustomerBottomNav selected="orders" menuHref={menuHref} />
    </Box>
  );
}

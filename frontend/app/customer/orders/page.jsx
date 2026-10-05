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
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { orderApi, waiterCallApi } from "@/lib/api";
import { formatCurrency, getBusinessWord, getLastCustomerMenuUrl, getMediaUrl, getOrCreateCustomerInstallationId } from "@/lib/utils";
import CustomerBottomNav from "@/components/customer/CustomerBottomNav";
import { ConfirmModal } from "@/components/ui/smart-modal";
import OrderReviewDialog from "@/components/customer/OrderReviewDialog";
import ImagePreview from "@/components/ui/image-preview";

function OrderCard({ order, installationId }) {
  const business = order.business;
  const location = [business?.city, business?.country].filter(Boolean).join(", ");
  const [billRequested, setBillRequested] = useState(Boolean(order.bill_request_active));
  const [requestingBill, setRequestingBill] = useState(false);
  const [billError, setBillError] = useState("");
  const [billCooldownSeconds, setBillCooldownSeconds] = useState(
    Number(order.bill_request_remaining_seconds) || 0
  );
  const [confirmBillOpen, setConfirmBillOpen] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBillCooldownSeconds((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const requestBill = async () => {
    if (requestingBill || billCooldownSeconds > 0 || billRequested) return;
    setRequestingBill(true);
    setBillError("");
    try {
      const response = await waiterCallApi.requestBill(order.id, installationId);
      if (response.alreadyRequested || response.callId) setBillRequested(true);
      setBillCooldownSeconds(Number(response.cooldownSeconds || response.cooldownRemainingSeconds) || 0);
      if (response.cooldownRemainingSeconds > 0 && !response.alreadyRequested) {
        setBillError(`Please wait ${Math.ceil(response.cooldownRemainingSeconds / 60)} minute(s) before requesting the bill again.`);
      }
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
          {new Date(order.created_date).toLocaleString()} · {formatCurrency(Number(order.total) || 0, business?.currency || "ZMW")}
        </Typography>
        <Stack spacing={0.5}>
          {(order.items || []).map((item, index) => (
            <Stack key={`${order.id}-${index}`} direction="row" alignItems="center" spacing={1}>
              {item.image && (
                <ImagePreview
                  src={getMediaUrl(item.image)}
                  alt={item.name}
                  sx={{ width: 52, height: 52, borderRadius: 1.5, flexShrink: 0 }}
                />
              )}
              <Typography variant="body1" fontWeight={900} sx={{ color: "#F9EDD8" }}>
                {item.quantity} × {item.name} · {formatCurrency(Number(item.price) || 0, business?.currency || "ZMW")}
              </Typography>
            </Stack>
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
                  {getBusinessWord(business, "menu", "Menu")} at time of order · {order.menu_snapshot.display_name || business?.business_name || "Menu"}
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
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {item.image && (
                          <ImagePreview
                            src={getMediaUrl(item.image)}
                            alt={item.name}
                            sx={{ width: 48, height: 48, borderRadius: 1.5, flexShrink: 0 }}
                          />
                        )}
                        <Typography fontWeight={600}>{item.name}</Typography>
                      </Stack>
                      <Typography color="#D4A872">
                        {formatCurrency(Number(item.price) || 0, order.menu_snapshot.currency || business?.currency || "ZMW")}
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
              onClick={() => setConfirmBillOpen(true)}
              disabled={billRequested || requestingBill || billCooldownSeconds > 0 || !installationId}
              startIcon={<ReceiptLongIcon />}
              sx={{ alignSelf: "flex-start", color: "#F5C842" }}
            >
              {billRequested
                ? "Bill requested"
                : requestingBill
                  ? "Requesting…"
                  : billCooldownSeconds > 0
                    ? `Request bill (${Math.floor(billCooldownSeconds / 60)}:${String(billCooldownSeconds % 60).padStart(2, "0")})`
                    : "Request bill"}
            </Button>
          </Stack>
        )}
      </CardContent>
      <ConfirmModal
        open={confirmBillOpen}
        onClose={() => setConfirmBillOpen(false)}
        onConfirm={async () => {
          await requestBill();
          setConfirmBillOpen(false);
        }}
        title="Request the bill?"
        message="Notify the staff that you are ready for the bill?"
        confirmLabel="Request bill"
        loading={requestingBill}
      />
    </Card>
  );
}

export default function CustomerOrdersPage() {
  const [installationId, setInstallationId] = useState("");
  const [menuHref, setMenuHref] = useState("/");
  const [orders, setOrders] = useState([]);
  const [lookupOrderNumber, setLookupOrderNumber] = useState("");
  const [matchedOrder, setMatchedOrder] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const id = getOrCreateCustomerInstallationId();
        setMenuHref(getLastCustomerMenuUrl());
        setInstallationId(id);
        const result = await orderApi.getCustomerHistory(id);
        if (!cancelled) {
          const history = result.orders || [];
          setOrders(history);
          const nextReview = history.find(
            (order) => order.status === "completed" && !order.customer_rating
          );
          if (nextReview) setReviewOrder((current) => current || nextReview);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load your order history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = window.setInterval(load, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
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

  const ordersPageCount = Math.max(1, Math.ceil(orders.length / 10));
  const visibleOrders = orders.slice((ordersPage - 1) * 10, ordersPage * 10);

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
            visibleOrders.map((order) => (
              <OrderCard key={order.id} order={order} installationId={installationId} />
            ))
          ) : (
            <Typography color="#D4A872">Your orders will appear here after you place an order from a QR menu.</Typography>
          )}
          {!loading && ordersPageCount > 1 && (
            <Pagination
              count={ordersPageCount}
              page={ordersPage}
              onChange={(_, page) => setOrdersPage(page)}
              color="warning"
              sx={{ display: "flex", justifyContent: "center", pt: 1 }}
            />
          )}
        </Stack>
      </Box>
      <CustomerBottomNav selected="orders" menuHref={menuHref} />
      <OrderReviewDialog
        key={reviewOrder?.id || "order-review"}
        order={reviewOrder}
        installationId={installationId}
        onSubmitted={(updatedOrder) => {
          setOrders((current) =>
            current.map((order) => order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order)
          );
          setMatchedOrder((current) =>
            current?.id === updatedOrder.id ? { ...current, ...updatedOrder } : current
          );
          setReviewOrder(null);
        }}
      />
    </Box>
  );
}

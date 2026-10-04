"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import { menuApi, orderApi, waiterCallApi } from "@/lib/api";
import { formatCurrency, getCustomerSessionId, getOrCreateCustomerInstallationId } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useReactNative } from "@/lib/contexts/ReactNativeWrapper";
import CustomerBottomNav from "@/components/customer/CustomerBottomNav";

export default function CustomerMenu({ businessId, branchId, tableId }) {
  const router = useRouter();
  const { isNative } = useReactNative();
  const [menu, setMenu] = useState(null);
  const [cart, setCart] = useState({});
  const [customerOrders, setCustomerOrders] = useState([]);
  const [installationId, setInstallationId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const customerId = getOrCreateCustomerInstallationId();
      setInstallationId(customerId);
      setSessionId(getCustomerSessionId(businessId, customerId));
      window.localStorage.setItem(
        "smartmenu_last_customer_menu_url",
        `/m/${businessId}/${branchId}/${tableId}`
      );
    } catch (identityError) {
      setError(identityError.message || "Unable to create customer history for this device.");
    }
  }, [businessId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const loadOrders = async () => {
      try {
        const result = await orderApi.getClientOrders(sessionId);
        if (!cancelled) setCustomerOrders(result.orders || []);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to refresh your order status.");
      }
    };
    loadOrders();
    const interval = window.setInterval(loadOrders, 15000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sessionId]);

  useEffect(() => {
    if (!businessId || !tableId) return;
    let cancelled = false;
    menuApi.getPublicMenu(businessId, tableId, branchId)
      .then((data) => {
        if (!cancelled) setMenu(data);
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || "Unable to load this menu.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessId, branchId, tableId]);

  const visibleItems = useMemo(() => {
    const items = menu?.items || [];
    return categoryId === "all"
      ? items
      : items.filter((item) => String(item.category_id) === String(categoryId));
  }, [categoryId, menu?.items]);

  const cartItems = useMemo(
    () => Object.values(cart).filter((item) => item.quantity > 0),
    [cart]
  );
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceCharge = subtotal * ((menu?.business?.service_charge_percent || 0) / 100);

  const changeQuantity = useCallback((item, amount) => {
    setCart((current) => {
      const quantity = Math.min(50, Math.max(0, (current[item.id]?.quantity || 0) + amount));
      const next = { ...current };
      if (!quantity) delete next[item.id];
      else next[item.id] = { id: item.id, name: item.name, price: Number(item.price), quantity };
      return next;
    });
  }, []);

  const placeOrder = async () => {
    if (!cartItems.length || !sessionId) return;
    setSubmitting(true);
    setError("");
    try {
      await orderApi.placeOrder({
        businessId,
        tableId,
        customerSessionId: sessionId,
        customerInstallationId: installationId,
        items: cartItems,
        notes,
      });
      setCart({});
      setNotes("");
      setNotice("Your order has been sent to the restaurant.");
      try {
        const updatedOrders = await orderApi.getClientOrders(sessionId);
        setCustomerOrders(updatedOrders.orders || []);
      } catch (refreshError) {
        setError(`Order sent, but status could not be refreshed: ${refreshError.message}`);
      }
    } catch (orderError) {
      setError(orderError.message || "Unable to place your order.");
    } finally {
      setSubmitting(false);
    }
  };

  const callWaiter = async () => {
    setError("");
    try {
      await waiterCallApi.callWaiter({
        businessId,
        tableId,
        tableNumber: menu?.table?.table_number,
      });
      setNotice("A waiter has been notified.");
    } catch (callError) {
      setError(callError.message || "Unable to call a waiter.");
    }
  };

  if (loading) {
    return <Box sx={{ display: "grid", minHeight: "100dvh", placeItems: "center" }}><CircularProgress /></Box>;
  }

  if (!menu || error && !menu.business) {
    return <Box sx={{ maxWidth: 560, mx: "auto", p: 3 }}><Alert severity="error">{error || "This menu is unavailable."}</Alert></Box>;
  }

  const currency = menu.business.currency || "USD";
  const formatPrice = (value) => formatCurrency(Number(value) || 0, currency);
  const pendingOrder = customerOrders.find((order) => !["completed", "cancelled"].includes(order.status));

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#100904", color: "#F9EDD8", pb: 18 }}>
      {!isNative && (
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            px: 2,
            py: 1,
            textAlign: "center",
            bgcolor: "#D4850A",
            color: "#1C0A00",
            fontWeight: 700,
          }}
        >
          Download the app for a better experience
        </Box>
      )}
      <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 }, pt: 4 }}>
        <Stack spacing={1} sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={800}>{menu.menuSettings?.display_name || menu.business.business_name}</Typography>
          <Typography color="#D4A872">{menu.menuSettings?.tagline || menu.menuSettings?.welcome_message}</Typography>
          <Stack direction="row" spacing={1}>
            {menu.table && <Chip label={`Table ${menu.table.table_number}`} size="small" />}
            {menu.table?.status && <Chip label={menu.table.status.replaceAll("_", " ")} size="small" />}
          </Stack>
          <Button onClick={callWaiter} variant="outlined" sx={{ alignSelf: "flex-start", color: "#F5C842", borderColor: "#D4850A" }}>
            Call a waiter
          </Button>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}

        {pendingOrder && (
          <Alert
            severity="info"
            action={
              <Button color="inherit" size="small" onClick={() => router.push("/customer/orders")}>
                View order
              </Button>
            }
            sx={{ mb: 2 }}
          >
            You have an active order #{pendingOrder.numeric_order_number || pendingOrder.order_number}.
            You can view it or place another order below.
          </Alert>
        )}

        {customerOrders.length > 0 && (
          <Card sx={{ mb: 3, bgcolor: "#21150D", color: "inherit", border: "1px solid #49301B" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Your orders</Typography>
              <Stack spacing={1.5}>
                {customerOrders.map((order) => (
                  <Box key={order.id}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography fontWeight={600}>Order #{order.numeric_order_number || order.order_number}</Typography>
                      <Chip size="small" label={order.status} color={order.status === "completed" ? "success" : "warning"} />
                    </Stack>
                    <Typography variant="body2" color="#D4A872">
                      {formatPrice(order.total)} · {new Date(order.created_date).toLocaleTimeString()}
                    </Typography>
                    {order.items?.map((item, index) => (
                      <Typography key={`${order.id}-${index}`} variant="body2" color="#D4A872">
                        {item.quantity} × {item.name}
                      </Typography>
                    ))}
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

        <Stack direction="row" spacing={1} sx={{ mb: 2, overflowX: "auto", pb: 1 }}>
          <Chip label="All" clickable color={categoryId === "all" ? "warning" : "default"} onClick={() => setCategoryId("all")} />
          {(menu.categories || []).map((category) => (
            <Chip
              key={category.id}
              label={`${category.icon || ""} ${category.name}`.trim()}
              clickable
              color={String(categoryId) === String(category.id) ? "warning" : "default"}
              onClick={() => setCategoryId(category.id)}
            />
          ))}
        </Stack>

        <Stack spacing={1.5}>
          {visibleItems.map((item) => (
            <Card key={item.id} sx={{ display: "flex", bgcolor: "#21150D", color: "inherit", border: "1px solid #49301B" }}>
              {item.image && <CardMedia component="img" image={item.image} alt="" sx={{ width: 112, objectFit: "cover" }} />}
              <CardContent sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={700}>{item.name}</Typography>
                {item.description && <Typography variant="body2" color="#D4A872" sx={{ my: 0.5 }}>{item.description}</Typography>}
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                  <Typography color="#F5C842" fontWeight={700}>{formatPrice(item.price)}</Typography>
                  <Stack direction="row" alignItems="center">
                    <IconButton aria-label={`Remove ${item.name}`} onClick={() => changeQuantity(item, -1)} size="small" sx={{ color: "inherit" }}><RemoveIcon /></IconButton>
                    <Typography sx={{ minWidth: 22, textAlign: "center" }}>{cart[item.id]?.quantity || 0}</Typography>
                    <IconButton aria-label={`Add ${item.name}`} onClick={() => changeQuantity(item, 1)} size="small" sx={{ color: "inherit" }}><AddIcon /></IconButton>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {!visibleItems.length && <Typography color="#D4A872">No available items in this category.</Typography>}
        </Stack>

        {cartItems.length > 0 && (
          <Card sx={{ position: "fixed", zIndex: 5, bottom: 78, left: "50%", transform: "translateX(-50%)", width: "min(860px, calc(100% - 24px))", bgcolor: "#21150D", color: "inherit", border: "1px solid #D4850A" }}>
            <CardContent>
              <Stack spacing={1}>
                {cartItems.map((item) => (
                  <Stack key={item.id} direction="row" justifyContent="space-between">
                    <Typography>{item.quantity} × {item.name}</Typography>
                    <Typography>{formatPrice(item.price * item.quantity)}</Typography>
                  </Stack>
                ))}
                <Divider sx={{ borderColor: "#49301B" }} />
                <Typography>Subtotal: {formatPrice(subtotal)}</Typography>
                {serviceCharge > 0 && <Typography variant="body2">Service charge: {formatPrice(serviceCharge)}</Typography>}
                <Typography fontWeight={800}>Total: {formatPrice(subtotal + serviceCharge)}</Typography>
                <TextField value={notes} onChange={(event) => setNotes(event.target.value)} label="Order notes" size="small" multiline maxRows={2} />
                <Button variant="contained" color="warning" disabled={submitting || !sessionId} onClick={placeOrder}>
                  {submitting ? "Sending order…" : "Place order"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
      <CustomerBottomNav
        selected="menu"
        menuHref={`/m/${businessId}/${branchId}/${tableId}`}
      />
      {customerOrders.length > 0 && cartItems.length === 0 && (
        <Button
          variant="contained"
          onClick={() => router.push(`/deal-and-promos?businessId=${encodeURIComponent(businessId)}`)}
          sx={{
            position: "fixed",
            zIndex: 7,
            left: "50%",
            transform: "translateX(-50%)",
            bottom: 84,
            borderRadius: 999,
            bgcolor: "#D4850A",
            color: "#1C0A00",
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          What deals are out there?
        </Button>
      )}
    </Box>
  );
}

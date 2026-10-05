"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputAdornment,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SearchIcon from "@mui/icons-material/Search";
import WavingHandIcon from "@mui/icons-material/WavingHand";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { motion } from "framer-motion";
import { menuApi, orderApi, waiterCallApi } from "@/lib/api";
import {
  formatCurrency,
  getCustomerSessionId,
  getMediaUrl,
  getOrCreateCustomerInstallationId,
  getBusinessWord,
} from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useReactNative } from "@/lib/contexts/ReactNativeWrapper";
import CustomerBottomNav from "@/components/customer/CustomerBottomNav";
import AppDownloadPrompt from "@/components/customer/AppDownloadPrompt";
import { ConfirmModal } from "@/components/ui/smart-modal";
import ImagePreview from "@/components/ui/image-preview";
import OrderReviewDialog from "@/components/customer/OrderReviewDialog";

export default function CustomerMenu({ businessId, branchId, tableId }) {
  const router = useRouter();
  const { isNative } = useReactNative();
  const [menu, setMenu] = useState(null);
  const [cart, setCart] = useState({});
  const [customerOrders, setCustomerOrders] = useState([]);
  const [installationId, setInstallationId] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [menuSearch, setMenuSearch] = useState("");
  const [menuPage, setMenuPage] = useState(1);
  const [customerOrdersPage, setCustomerOrdersPage] = useState(1);
  const [cartExpanded, setCartExpanded] = useState(true);
  const [expandedCartHeight, setExpandedCartHeight] = useState(92);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null);
  const [waiterCooldownSeconds, setWaiterCooldownSeconds] = useState(0);
  const [billCooldownSeconds, setBillCooldownSeconds] = useState(0);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [billRequested, setBillRequested] = useState(false);
  const [requestingBill, setRequestingBill] = useState(false);
  const [confirmBillOrderId, setConfirmBillOrderId] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);
  const categoryTouchStart = useRef(null);
  const cartTouchStart = useRef(null);
  const cartSwiped = useRef(false);
  const cartContentRef = useRef(null);

  useEffect(() => {
    try {
      const customerId = getOrCreateCustomerInstallationId();
      setInstallationId(customerId);
      setSessionId(getCustomerSessionId(customerId));
      window.localStorage.setItem(
        "smartmenu_last_customer_menu_url",
        `/m/${businessId}/${branchId}/${tableId}`
      );
    } catch (identityError) {
      setError(identityError.message || "Unable to create customer history for this device.");
    }
  }, [businessId, branchId, tableId]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    const loadOrders = async () => {
      try {
        const result = await orderApi.getClientOrders(installationId);
        if (!cancelled) {
          const orders = (result.orders || []).filter(
            (order) => String(order.business?.id) === String(businessId)
          );
          setCustomerOrders(orders);
          const orderToReview = orders.find(
            (order) => order.status === "completed" && !order.customer_rating
          );
          if (orderToReview) setReviewOrder((current) => current || orderToReview);
        }
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
  }, [businessId, installationId, sessionId]);

  useEffect(() => {
    if (!businessId || !tableId) return;
    let cancelled = false;
    menuApi.getPublicMenu(businessId, tableId, branchId)
      .then((data) => {
        if (!cancelled) {
          setMenu(data);
          setWaiterCooldownSeconds(Number(data.waiterCallRemainingSeconds) || 0);
          setBillCooldownSeconds(Number(data.billRequestRemainingSeconds) || 0);
          setBillRequested(Boolean(data.billRequestActive));
        }
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError.message || "Unable to load this menu.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessId, branchId, tableId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setWaiterCooldownSeconds((remaining) => Math.max(0, remaining - 1));
      setBillCooldownSeconds((remaining) => Math.max(0, remaining - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const visibleItems = useMemo(() => {
    const categoryItems = (menu?.items || []).filter((item) =>
      categoryId === "all" || String(item.category_id) === String(categoryId)
    );
    const query = menuSearch.trim().toLocaleLowerCase();
    if (!query) return categoryItems;
    const menuMatches = [
      menu?.menuSettings?.display_name,
      menu?.menuSettings?.tagline,
      menu?.menuSettings?.welcome_message,
      menu?.business?.business_name,
      menu?.business?.business_type,
    ].some((value) => String(value || "").toLocaleLowerCase().includes(query));
    if (menuMatches) return categoryItems;
    return categoryItems.filter((item) => [
      item.name,
      item.description,
      item.category,
      item.tags,
      item.preparation_time,
      ...(Array.isArray(item.variants) ? item.variants.map((variant) => variant.name) : []),
      ...(Array.isArray(item.modifiers) ? item.modifiers.map((modifier) => modifier.name) : []),
    ].some((value) => String(value || "").toLocaleLowerCase().includes(query)));
  }, [categoryId, menu?.business?.business_name, menu?.business?.business_type, menu?.items, menu?.menuSettings, menuSearch]);
  const menuPageCount = Math.max(1, Math.ceil(visibleItems.length / 10));
  const pageItems = visibleItems.slice((menuPage - 1) * 10, menuPage * 10);
  const customerOrdersPageCount = Math.max(1, Math.ceil(customerOrders.length / 10));
  const visibleCustomerOrders = customerOrders.slice(
    (customerOrdersPage - 1) * 10,
    customerOrdersPage * 10
  );

  useEffect(() => {
    if (customerOrdersPage > customerOrdersPageCount) {
      setCustomerOrdersPage(customerOrdersPageCount);
    }
  }, [customerOrdersPage, customerOrdersPageCount]);

  const cartItems = useMemo(
    () => Object.values(cart).filter((item) => item.quantity > 0),
    [cart]
  );
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const serviceCharge = subtotal * ((menu?.business?.service_charge_percent || 0) / 100);
  const cartQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartSummary = cartItems
    .slice(0, 2)
    .map((item) => `${item.quantity} × ${item.name}`)
    .join(", ");
  const additionalCartItems = cartItems.length - 2;

  useLayoutEffect(() => {
    const content = cartContentRef.current;
    if (!cartExpanded || !content) return undefined;
    const updateHeight = () => {
      const maxHeight = Math.max(92, window.innerHeight - 160);
      setExpandedCartHeight(Math.min(content.scrollHeight + 4, maxHeight));
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    return () => observer.disconnect();
  }, [cartExpanded, cartItems, notes, serviceCharge, subtotal]);

  const changeQuantity = useCallback((item, amount) => {
    if (amount > 0) setCartExpanded(true);
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
      const orderedItems = cartItems.map((item) => ({ ...item }));
      const response = await orderApi.placeOrder({
        businessId,
        tableId,
        customerSessionId: sessionId,
        customerInstallationId: installationId,
        items: orderedItems,
        notes,
      });
      setLastPlacedOrder({ ...response.order, items: orderedItems });
      setCart({});
      setNotes("");
      setNotice("Your order has been sent to the restaurant.");
      try {
        const updatedOrders = await orderApi.getClientOrders(installationId);
        setCustomerOrders((updatedOrders.orders || []).filter(
          (order) => String(order.business?.id) === String(businessId)
        ));
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
    if (waiterCooldownSeconds > 0 || callingWaiter) return;
    setCallingWaiter(true);
    setError("");
    try {
      const response = await waiterCallApi.callWaiter({
        businessId,
        tableId,
        tableNumber: menu?.table?.table_number,
      });
      if (!response.success) {
        setWaiterCooldownSeconds(Number(response.retryAfterSeconds) || 0);
        setNotice(`Please wait before calling ${waiterWord} again.`);
        return;
      }
      setWaiterCooldownSeconds(Number(response.cooldownSeconds) ||
        (Number(menu?.waiterCallDelayMinutes) || 1) * 60);
      setNotice(`${waiterWord} has been notified.`);
    } catch (callError) {
      setError(callError.message || "Unable to call a waiter.");
    } finally {
      setCallingWaiter(false);
    }
  };

  const requestBill = async (orderId) => {
    if (!orderId || !installationId || requestingBill || billCooldownSeconds > 0) return;
    setRequestingBill(true);
    setError("");
    try {
      const response = await waiterCallApi.requestBill(orderId, installationId);
      if (response.alreadyRequested || response.callId) setBillRequested(true);
      setBillCooldownSeconds(Number(response.cooldownSeconds || response.cooldownRemainingSeconds) || 0);
      setNotice(response.alreadyRequested
        ? "A bill request is already active for this table."
        : response.cooldownRemainingSeconds > 0
          ? `Please wait ${Math.ceil(response.cooldownRemainingSeconds / 60)} minute(s) before requesting the bill again.`
          : "The waiter has been notified that you would like the bill.");
    } catch (requestError) {
      setError(requestError.message || "Unable to request the bill.");
    } finally {
      setRequestingBill(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: "grid", minHeight: "100dvh", placeItems: "center" }}><CircularProgress /></Box>;
  }

  if (!menu || error && !menu.business) {
    return <Box sx={{ maxWidth: 560, mx: "auto", p: 3 }}><Alert severity="error">{error || "This menu is unavailable."}</Alert></Box>;
  }

  const currency = menu.business.currency || "ZMW";
  const formatPrice = (value) => formatCurrency(Number(value) || 0, currency);
  const pendingOrder = customerOrders.find((order) => !["completed", "cancelled"].includes(order.status));
  const activeOrderId = pendingOrder?.id || lastPlacedOrder?.id;
  const waiterWord = getBusinessWord(menu.business, "waiter", "waiter");
  const categoryIds = ["all", ...(menu.categories || []).map((category) => category.id)];
  const changeCategoryBySwipe = (event) => {
    const startX = categoryTouchStart.current;
    categoryTouchStart.current = null;
    if (startX === null || startX === undefined) return;
    const deltaX = event.changedTouches[0].clientX - startX;
    if (Math.abs(deltaX) < 48) return;
    const currentIndex = categoryIds.findIndex((id) => String(id) === String(categoryId));
    const nextIndex = Math.min(
      categoryIds.length - 1,
      Math.max(0, currentIndex + (deltaX < 0 ? 1 : -1))
    );
    setCategoryId(categoryIds[nextIndex]);
    setMenuPage(1);
  };
  const cooldownLabel = waiterCooldownSeconds > 0
    ? ` (${Math.floor(waiterCooldownSeconds / 60)}:${String(waiterCooldownSeconds % 60).padStart(2, "0")})`
    : "";
  const billCooldownLabel = billCooldownSeconds > 0
    ? ` (${Math.floor(billCooldownSeconds / 60)}:${String(billCooldownSeconds % 60).padStart(2, "0")})`
    : "";

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#100904", color: "#F9EDD8", pb: 18 }}>
      {!isNative && (
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <AppDownloadPrompt />
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
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Button
              onClick={callWaiter}
              variant="outlined"
              disabled={waiterCooldownSeconds > 0 || callingWaiter}
              endIcon={<WavingHandIcon />}
              sx={{ color: "#F5C842", borderColor: "#D4850A" }}
            >
              {callingWaiter
                ? `Calling ${waiterWord}…`
                : waiterCooldownSeconds > 0
                  ? `Call ${waiterWord}${cooldownLabel}`
                  : `Call ${waiterWord}`}
            </Button>
            {activeOrderId && (
              <Button
                onClick={() => setConfirmBillOrderId(activeOrderId)}
                variant="outlined"
                disabled={billRequested || billCooldownSeconds > 0 || requestingBill}
                endIcon={<ReceiptLongIcon />}
                sx={{ color: "#F5C842", borderColor: "#D4850A" }}
              >
                {billRequested ? "Bill requested" : requestingBill ? "Requesting…" : `Request bill${billCooldownLabel}`}
              </Button>
            )}
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}
        {notice && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setNotice("")}>{notice}</Alert>}
        {lastPlacedOrder && (
          <Card sx={{ mb: 3, bgcolor: "#21150D", color: "inherit", border: "1px solid #D4850A" }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700}>
                Items ordered
              </Typography>
              <Typography variant="caption" color="#D4A872" sx={{ display: "block", mb: 1.5 }}>
                Order #{lastPlacedOrder.numeric_order_number || lastPlacedOrder.order_number}
              </Typography>
              <Stack spacing={0.75}>
                {lastPlacedOrder.items.map((item) => (
                  <Stack key={item.id} direction="row" justifyContent="space-between" spacing={2}>
                    <Typography variant="body1" fontWeight={900} sx={{ color: "#F9EDD8" }}>
                      {item.quantity} × {item.name}
                    </Typography>
                    <Typography variant="body2" color="#D4A872">
                      {formatPrice(item.price * item.quantity)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        )}

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
                {visibleCustomerOrders.map((order) => (
                  <Box key={order.id}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography fontWeight={600}>Order #{order.numeric_order_number || order.order_number}</Typography>
                      <Chip size="small" label={order.status} color={order.status === "completed" ? "success" : "warning"} />
                    </Stack>
                    <Typography variant="body2" color="#D4A872">
                      {formatPrice(order.total)} · {new Date(order.created_date).toLocaleTimeString()}
                    </Typography>
                    {order.items?.map((item, index) => (
                      <Typography key={`${order.id}-${index}`} variant="body1" color="#F9EDD8" fontWeight={900}>
                        {item.quantity} × {item.name}
                      </Typography>
                    ))}
                    {!["completed", "cancelled"].includes(order.status) && (
                      <Button
                        size="small"
                        onClick={() => setConfirmBillOrderId(order.id)}
                        disabled={billRequested || billCooldownSeconds > 0 || requestingBill}
                        startIcon={<ReceiptLongIcon />}
                        sx={{ mt: 0.5, color: "#F5C842" }}
                      >
                        {billRequested ? "Bill requested" : `Request bill${billCooldownLabel}`}
                      </Button>
                    )}
                  </Box>
                ))}
              </Stack>
              {customerOrdersPageCount > 1 && (
                <Pagination
                  count={customerOrdersPageCount}
                  page={customerOrdersPage}
                  onChange={(_, nextPage) => setCustomerOrdersPage(nextPage)}
                  color="warning"
                  sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                />
              )}
            </CardContent>
          </Card>
        )}

        <Stack
          direction="row"
          spacing={1}
          onTouchStart={(event) => { categoryTouchStart.current = event.touches[0].clientX; }}
          onTouchEnd={changeCategoryBySwipe}
          sx={{ mb: 2, overflowX: "auto", pb: 1 }}
        >
          <Chip label="All" clickable color={categoryId === "all" ? "warning" : "default"} onClick={() => { setCategoryId("all"); setMenuPage(1); }} />
          {(menu.categories || []).map((category) => (
            <Chip
              key={category.id}
              label={`${category.icon || ""} ${category.name}`.trim()}
              clickable
              color={String(categoryId) === String(category.id) ? "warning" : "default"}
              onClick={() => { setCategoryId(category.id); setMenuPage(1); }}
            />
          ))}
        </Stack>

        <TextField
          value={menuSearch}
          onChange={(event) => { setMenuSearch(event.target.value); setMenuPage(1); }}
          placeholder="Search menu or dishes"
          aria-label="Search menu and items"
          fullWidth
          sx={{ mb: 2, "& .MuiInputBase-root": { color: "#F9EDD8", bgcolor: "#21150D" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "#D4A872" }} />
              </InputAdornment>
            ),
          }}
        />

        <Stack spacing={1.5}>
          {pageItems.map((item) => (
            <Card key={item.id} sx={{ display: "flex", bgcolor: "#21150D", color: "inherit", border: "1px solid #49301B" }}>
              {item.image && (
                <ImagePreview
                  src={getMediaUrl(item.image)}
                  alt={item.name}
                  sx={{ width: 112, minHeight: 112, flexShrink: 0 }}
                />
              )}
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
          {!visibleItems.length && <Typography color="#D4A872">No available items match this search or category.</Typography>}
        </Stack>
        {menuPageCount > 1 && (
          <Pagination
            count={menuPageCount}
            page={menuPage}
            onChange={(_, nextPage) => setMenuPage(nextPage)}
            color="warning"
            sx={{ display: "flex", justifyContent: "center", mt: 3 }}
          />
        )}

        {cartItems.length > 0 && (
          <motion.div
            initial={false}
            animate={{ height: cartExpanded ? expandedCartHeight : 64 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            onTouchStart={(event) => {
              const touch = event.touches[0];
              cartTouchStart.current = { x: touch.clientX, y: touch.clientY };
            }}
            onTouchEnd={(event) => {
              if (!cartTouchStart.current) return;
              const touch = event.changedTouches[0];
              const deltaY = touch.clientY - cartTouchStart.current.y;
              const deltaX = touch.clientX - cartTouchStart.current.x;
              const target = event.target;
              const isInteractive = target instanceof Element && target.closest(
                'input, textarea, button:not([aria-label="Collapse order summary"]):not([aria-label="Expand order summary"])'
              );
              if (deltaY > 45 && deltaY > Math.abs(deltaX) && !isInteractive) {
                cartSwiped.current = true;
                window.setTimeout(() => { cartSwiped.current = false; }, 300);
                setCartExpanded(false);
              } else if (deltaY < -45 && Math.abs(deltaY) > Math.abs(deltaX)) {
                cartSwiped.current = true;
                window.setTimeout(() => { cartSwiped.current = false; }, 300);
                setCartExpanded(true);
              }
              cartTouchStart.current = null;
            }}
            onTouchCancel={() => { cartTouchStart.current = null; }}
            style={{
              position: "fixed",
              zIndex: 5,
              bottom: cartExpanded ? 62 : 64,
              left: "50%",
              width: "min(860px, calc(100% - 24px))",
              transform: "translateX(-50%)",
              overflow: "hidden",
            }}
          >
            <Card sx={{ height: "100%", overflowY: cartExpanded ? "auto" : "hidden", bgcolor: "#21150D", color: "inherit", border: "1px solid #D4850A" }}>
              <CardContent
                ref={cartContentRef}
                sx={{
                  p: cartExpanded ? 1.5 : 0.5,
                  "&:last-child": { pb: cartExpanded ? 1.5 : 0.5 },
                }}
              >
                <Box sx={{ position: "relative", display: "flex", justifyContent: "center" }}>
                  <IconButton
                    aria-label={cartExpanded ? "Collapse order summary" : "Expand order summary"}
                    onClick={() => {
                      if (cartSwiped.current) {
                        cartSwiped.current = false;
                        return;
                      }
                      setCartExpanded((expanded) => !expanded);
                    }}
                    size="small"
                    sx={{
                      mt: cartExpanded ? -0.75 : -0.25,
                      mb: cartExpanded ? 0.25 : 0,
                      p: cartExpanded ? 0.5 : 0,
                      width: cartExpanded ? 34 : 24,
                      height: cartExpanded ? 34 : 24,
                      color: "#D4A872",
                    }}
                  >
                    <KeyboardArrowDownIcon sx={{ transform: cartExpanded ? "none" : "rotate(180deg)" }} />
                  </IconButton>
                  {!cartExpanded && (
                    <Button
                      onClick={() => setCartExpanded(true)}
                      sx={{
                        position: "absolute",
                        inset: 0,
                        zIndex: 0,
                        minWidth: 0,
                        width: "100%",
                        p: 0,
                        color: "#F9EDD8",
                        textTransform: "none",
                        justifyContent: "center",
                      }}
                    >
                      <Typography noWrap sx={{ fontSize: "0.75rem", lineHeight: 1.3 }}>
                        Your order · {cartQuantity} {cartQuantity === 1 ? "item" : "items"} · {cartSummary}
                        {additionalCartItems > 0 ? ` +${additionalCartItems} more` : ""} · {formatPrice(subtotal + serviceCharge)}
                      </Typography>
                    </Button>
                  )}
                </Box>
                {cartExpanded && (
                  <motion.div
                    key="expanded-order"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                      <Stack spacing={1}>
                        {cartItems.map((item) => (
                          <Stack key={item.id} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                            <Typography sx={{ flex: 1, minWidth: 0, overflowWrap: "anywhere" }}>
                              {item.quantity} × {item.name}
                            </Typography>
                            <Typography sx={{ whiteSpace: "nowrap" }}>{formatPrice(item.price * item.quantity)}</Typography>
                            <IconButton
                              aria-label={`Remove ${item.name} from order`}
                              onClick={() => changeQuantity(item, -item.quantity)}
                              size="small"
                              sx={{ color: "#ef7777" }}
                            >
                              <RemoveIcon />
                            </IconButton>
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
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
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
      <ConfirmModal
        open={Boolean(confirmBillOrderId)}
        onClose={() => setConfirmBillOrderId(null)}
        onConfirm={async () => {
          const orderId = confirmBillOrderId;
          await requestBill(orderId);
          setConfirmBillOrderId(null);
        }}
        title="Request the bill?"
        message="Notify the staff that you are ready for the bill?"
        confirmLabel="Request bill"
        loading={requestingBill}
      />
      <OrderReviewDialog
        key={reviewOrder?.id || "order-review"}
        order={reviewOrder}
        installationId={installationId}
        onSubmitted={(updatedOrder) => {
          setCustomerOrders((current) =>
            current.map((order) => order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order)
          );
          setReviewOrder(null);
        }}
      />
    </Box>
  );
}

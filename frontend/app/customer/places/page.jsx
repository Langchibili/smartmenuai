"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { orderApi } from "@/lib/api";
import { getLastCustomerMenuUrl, getOrCreateCustomerInstallationId } from "@/lib/utils";
import CustomerBottomNav from "@/components/customer/CustomerBottomNav";

export default function CustomerPlacesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuHref, setMenuHref] = useState("/");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setMenuHref(getLastCustomerMenuUrl());
        const result = await orderApi.getCustomerHistory(getOrCreateCustomerInstallationId());
        if (!cancelled) setOrders(result.orders || []);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load your business history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const places = useMemo(() => {
    const grouped = new Map();
    for (const order of orders) {
      const business = order.business;
      if (!business?.id) continue;
      const current = grouped.get(String(business.id)) || {
        business,
        orderCount: 0,
        lastOrder: order.created_date,
        itemCounts: new Map(),
      };
      current.orderCount += 1;
      for (const item of order.items || []) {
        current.itemCounts.set(item.name, (current.itemCounts.get(item.name) || 0) + Number(item.quantity || 0));
      }
      grouped.set(String(business.id), current);
    }
    return [...grouped.values()]
      .map((place) => ({
        ...place,
        favorites: [...place.itemCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
      }))
      .sort((a, b) => b.orderCount - a.orderCount);
  }, [orders]);

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#100904", color: "#F9EDD8", pb: 10 }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={800}>Your businesses</Typography>
            <Typography color="#D4A872">Places you have ordered from most, with your favorite items.</Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 6 }}><CircularProgress /></Box>
          ) : places.length ? places.map((place) => (
            <Card key={place.business.id} sx={{ bgcolor: "#21150D", color: "inherit", border: "1px solid #49301B" }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={800}>{place.business.business_name}</Typography>
                  <Chip size="small" label={`${place.orderCount} ${place.orderCount === 1 ? "order" : "orders"}`} />
                </Stack>
                <Typography variant="body2" color="#D4A872" sx={{ mt: 0.5 }}>
                  {[place.business.address, place.business.city, place.business.country].filter(Boolean).join(" · ") || "Location not provided"}
                </Typography>
                {place.favorites.length > 0 && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Your favorites: {place.favorites.map(([name, count]) => `${name} (${count})`).join(", ")}
                  </Typography>
                )}
                <Typography variant="caption" color="#8B6038">
                  Last order {new Date(place.lastOrder).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          )) : (
            <Typography color="#D4A872">Businesses you order from will appear here.</Typography>
          )}
        </Stack>
      </Box>
      <CustomerBottomNav selected="businesses" menuHref={menuHref} />
    </Box>
  );
}

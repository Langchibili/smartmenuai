"use client";

import { useEffect, useState } from "react";
import { Alert, Box, Card, CardContent, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { orderApi } from "@/lib/api";
import { getLastCustomerMenuUrl, getMediaUrl, getOrCreateCustomerInstallationId } from "@/lib/utils";
import CustomerBottomNav from "@/components/customer/CustomerBottomNav";
import ImagePreview from "@/components/ui/image-preview";

export default function DealsAndPromosPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [menuHref, setMenuHref] = useState("/");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setMenuHref(getLastCustomerMenuUrl());
        const businessId = new URLSearchParams(window.location.search).get("businessId");
        if (!businessId) {
          setDeals([]);
          return;
        }
        const result = await orderApi.getDealAndPromos(
          businessId,
          getOrCreateCustomerInstallationId()
        );
        if (!cancelled) setDeals(result.deals || []);
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || "Unable to load deals and promotions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <Box sx={{ minHeight: "100dvh", bgcolor: "#100904", color: "#F9EDD8", pb: 10 }}>
      <Box sx={{ maxWidth: 900, mx: "auto", px: { xs: 2, sm: 3 }, py: 4 }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography component="h1" variant="h4" fontWeight={800}>Deals and promos</Typography>
            <Typography color="#D4A872">Offers from other businesses in the same country as your current menu.</Typography>
          </Box>
          {error && <Alert severity="error">{error}</Alert>}
          {loading ? (
            <Box sx={{ display: "grid", placeItems: "center", py: 6 }}><CircularProgress /></Box>
          ) : deals.length ? deals.map((deal) => (
            <Card key={`${deal.business.id}-${deal.id}`} sx={{ bgcolor: "#21150D", color: "inherit", border: "1px solid #49301B" }}>
              {deal.image && (
                <ImagePreview
                  src={getMediaUrl(deal.image)}
                  alt={`${deal.title} promotion`}
                  sx={{ width: "100%", height: 180 }}
                />
              )}
              <CardContent>
                <Chip size="small" label={deal.type.replaceAll("_", " ")} color="warning" sx={{ mb: 1 }} />
                <Typography variant="h6" fontWeight={800}>{deal.title}</Typography>
                {deal.description && <Typography color="#D4A872" sx={{ mt: 0.5 }}>{deal.description}</Typography>}
                <Typography fontWeight={700} sx={{ mt: 1 }}>{deal.business.business_name}</Typography>
                <Typography variant="body2" color="#D4A872">
                  {[deal.branch?.address || deal.business.address, deal.branch?.city || deal.business.city, deal.business.country].filter(Boolean).join(" · ")}
                </Typography>
                {deal.relevance && <Typography variant="caption" color="#F5C842">{deal.relevance}</Typography>}
              </CardContent>
            </Card>
          )) : (
            <Typography color="#D4A872">
              {error ? "" : "No active offers are available in this area right now."}
            </Typography>
          )}
        </Stack>
      </Box>
      <CustomerBottomNav menuHref={menuHref} />
    </Box>
  );
}

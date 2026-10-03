"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Button, Paper, Chip, Grid, Stack, LinearProgress, CircularProgress,
  alpha,
} from "@mui/material";
import { useAuth } from "@/lib/auth-context";
import { businessApi } from "@/lib/api";
import { PageHeader, StatCard, Skeleton } from "@/components/ui/page-header";
import { formatCurrency } from "@/lib/utils";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND = "#D4850A";
const BRAND_DARK = "#A0622A";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";

const RANGES = [
  { label: "Today", days: 0 },
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

// ─── Simple bar chart (MUI styled) ───────────────────────────────────────────
function SimpleBarChart({ data, color = BRAND, currency = "USD" }) {
  const entries = Object.entries(data).slice(-14);
  const max = Math.max(...entries.map(([, v]) => v), 1);

  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5, height: 112, width: "100%" }}>
      {entries.map(([date, value]) => (
        <Box
          key={date}
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative",
            "&:hover .tooltip": { opacity: 1, pointerEvents: "none" },
          }}
        >
          {/* Bar */}
          <Box
            sx={{
              width: "100%",
              height: `${(value / max) * 96}px`,
              minHeight: value > 0 ? "4px" : "1px",
              opacity: value > 0 ? 1 : 0.2,
              borderRadius: "4px 4px 0 0",
              background: `linear-gradient(180deg, ${color} 0%, ${color}66 100%)`,
              transition: "all 0.3s",
            }}
          />
          {/* Tooltip */}
          <Box
            className="tooltip"
            sx={{
              position: "absolute",
              bottom: "100%",
              mb: 1,
              px: 1.5,
              py: 0.5,
              borderRadius: "8px",
              fontSize: "0.65rem",
              fontWeight: 500,
              background: "rgba(13,4,0,0.95)",
              color: TEXT_P,
              border: `1px solid ${alpha(BRAND, 0.25)}`,
              opacity: 0,
              transition: "opacity 0.2s",
              whiteSpace: "nowrap",
              zIndex: 10,
            }}
          >
            {date.slice(5)} · {typeof value === "number" && value > 100 ? formatCurrency(value, currency) : value}
          </Box>
          {/* Date label hidden in mobile, show on hover maybe */}
        </Box>
      ))}
    </Box>
  );
}

export default function ReportsPage() {
  const { business } = useAuth();
  const [range, setRange] = useState(7);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    const now = new Date();
    const from = range > 0
      ? new Date(Date.now() - range * 86400000).toISOString()
      : new Date(now.setHours(0, 0, 0, 0)).toISOString();
    try {
      const res = await businessApi.getBusinessReports({
        businessId: business.id,
        dateFrom: from,
        dateTo: new Date().toISOString(),
      });
      setData(res);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [business?.id, range]);

  useEffect(() => { load(); }, [load]);

  const currency = business?.currency ?? "USD";

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: "1440px", mx: "auto" }}>
        <Skeleton variant="text" width="12rem" height={32} sx={{ mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[...Array(4)].map((_, i) => (
            <Grid size={{ xs: 6, lg: 3 }} key={i}>
              <Skeleton variant="rounded" height={112} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={250} />
      </Box>
    );
  }

  // No data
  if (!data) {
    return (
      <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: "1440px", mx: "auto" }}>
        <PageHeader title="Reports" icon="📊" subtitle="Revenue, orders, and top-selling items" />
        <Typography sx={{ color: TEXT_M, mt: 4, textAlign: "center" }}>No data available.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: "1440px", mx: "auto" }}>
      <PageHeader
        title="Reports"
        icon="📊"
        subtitle="Revenue, orders, and top-selling items"
        actions={
          <Stack direction="row" spacing={0.8}>
            {RANGES.map(r => (
              <Chip
                key={r.days}
                label={r.label}
                onClick={() => setRange(r.days)}
                sx={{
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  background: range === r.days ? alpha(BRAND, 0.15) : "rgba(45,18,0,0.5)",
                  color: range === r.days ? BRAND : TEXT_M,
                  border: `1px solid ${range === r.days ? alpha(BRAND, 0.35) : "rgba(107,51,24,0.3)"}`,
                  "&:hover": { borderColor: BRAND },
                  transition: "all 0.2s",
                }}
              />
            ))}
          </Stack>
        }
      />

      {/* KPI cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, lg: 3 }} >
          <StatCard
            label="Total orders"
            value={data.summary.totalOrders}
            icon="🧾"
            color="amber"
            sub={`${data.summary.pendingOrders} still active`}
          />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }} >
          <StatCard label="Completed" value={data.summary.completedOrders} icon="✓" color="green" />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }} >
          <StatCard
            label="Revenue"
            value={formatCurrency(data.summary.totalRevenue, currency)}
            icon="💰"
            color="green"
          />
        </Grid>
        <Grid size={{ xs: 6, lg: 3 }} >
          <StatCard
            label="Avg. order"
            value={formatCurrency(data.summary.avgOrderValue, currency)}
            icon="📈"
            color="blue"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }} >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "16px",
              background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
              border: "1px solid rgba(107,51,24,0.25)",
              backdropFilter: "blur(6px)",
            }}
          >
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: TEXT_P, mb: 3, fontSize: "1rem" }}>
              Revenue by day
            </Typography>
            {Object.keys(data.revenueByDay).length === 0 ? (
              <Typography sx={{ textAlign: "center", py: 8, color: TEXT_D }}>
                No completed orders in this period
              </Typography>
            ) : (
              <SimpleBarChart data={data.revenueByDay} color={BRAND} currency={currency} />
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }} >
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: "16px",
              background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
              border: "1px solid rgba(107,51,24,0.25)",
              backdropFilter: "blur(6px)",
            }}
          >
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: TEXT_P, mb: 3, fontSize: "1rem" }}>
              Orders by day
            </Typography>
            {Object.keys(data.ordersByDay).length === 0 ? (
              <Typography sx={{ textAlign: "center", py: 8, color: TEXT_D }}>
                No orders in this period
              </Typography>
            ) : (
              <SimpleBarChart data={data.ordersByDay} color="#3b82f6" />
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Top items */}
      {data.topItems.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            mt: 3,
            p: 3,
            borderRadius: "16px",
            background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
            border: "1px solid rgba(107,51,24,0.25)",
            backdropFilter: "blur(6px)",
          }}
        >
          <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 600, color: TEXT_P, mb: 3, fontSize: "1rem" }}>
            Top selling items
          </Typography>
          <Stack spacing={2.5}>
            {data.topItems.map((item, i) => {
              const pct = (item.count / data.topItems[0].count) * 100;
              return (
                <Box key={item.name} sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Typography
                    sx={{
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      width: 24,
                      textAlign: "right",
                      color: i === 0 ? BRAND : TEXT_D,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </Typography>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                      <Typography sx={{ fontWeight: 500, color: TEXT_P, fontSize: "0.9rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.name}
                      </Typography>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0, ml: 2 }}>
                        <Typography sx={{ fontWeight: 600, color: TEXT_S, fontSize: "0.8rem" }}>{item.count}x</Typography>
                        <Typography sx={{ color: TEXT_M, fontSize: "0.8rem" }}>
                          {formatCurrency(item.revenue, currency)}
                        </Typography>
                      </Box>
                    </Box>
                    <Box
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        background: "rgba(45,18,0,0.8)",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          height: "100%",
                          borderRadius: 3,
                          width: `${pct}%`,
                          background: `linear-gradient(90deg, ${BRAND}, ${BRAND_DARK})`,
                          transition: "width 0.5s",
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
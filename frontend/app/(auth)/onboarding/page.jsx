"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { businessApi, locationApi } from "@/lib/api";
import {
  Autocomplete,
  Box,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Grid,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { motion } from "framer-motion";

const BRAND = "#D4850A";
const BRAND_DARK = "#A0622A";
const GOLD = "#F5C842";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";
const GREEN = "#22c55e";
const ERROR = "#ef4444";

const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant", icon: "🍽️" },
  { value: "bar", label: "Bar", icon: "🍺" },
  { value: "cafe", label: "Café", icon: "☕" },
  { value: "lounge", label: "Lounge", icon: "🛋️" },
  { value: "club", label: "Club", icon: "🎵" },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "ZMW", symbol: "K", label: "Zambian Kwacha" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "GHS", symbol: "₵", label: "Ghanaian Cedi" },
];

const STEPS = [
  { id: 1, label: "Business type" },
  { id: 2, label: "Basic info" },
  { id: 3, label: "Tables & branch" },
  { id: 4, label: "Done" },
];

// ─── Reusable styled input ────────────────────────────────────────────────────
const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "rgba(45,18,0,0.8)",
    color: TEXT_P,
    fontSize: 14,
    transition: "all 220ms",
    "& fieldset": {
      borderColor: "rgba(212,133,10,0.18)",
      transition: "all 220ms",
    },
    "&:hover fieldset": { borderColor: alpha(BRAND, 0.45) },
    "&.Mui-focused fieldset": {
      borderColor: BRAND,
      boxShadow: `0 0 0 3px ${alpha(BRAND, 0.18)}, 0 0 20px ${alpha(BRAND, 0.12)}`,
    },
  },
  "& .MuiInputLabel-root": { color: TEXT_M, fontSize: 14 },
  "& .MuiInputLabel-root.Mui-focused": { color: BRAND },
  "& input": { color: TEXT_P },
  "& .MuiSelect-select": { color: TEXT_P },
};

export default function OnboardingPage() {
  const { refreshBusiness } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);

  const [form, setForm] = useState({
    businessType: "",
    businessName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    countryId: "",
    cityId: "",
    currency: "USD",
    serviceCharge: "",
    branchName: "Main Branch",
    numberOfTables: "5",
  });

  const set = (field, value) =>
    setForm((f) => ({ ...f, [field]: value }));

  useEffect(() => {
    let active = true;
    setCatalogLoading(true);
    locationApi.getLocationCatalog(form.countryId || undefined, citySearch)
      .then(({ countries: countryOptions = [], cities: cityOptions = [] }) => {
        if (!active) return;
        setCountries(countryOptions);
        setCities(cityOptions);
      })
      .catch((err) => {
        if (active) setError(err.message || "Unable to load country and city options.");
      })
      .finally(() => {
        if (active) setCatalogLoading(false);
      });
    return () => { active = false; };
  }, [form.countryId, citySearch]);

  const handleFinish = async () => {
    setError("");
    setLoading(true);
    try {
      await businessApi.createBusinessWithBranchAndTables({
        businessName: form.businessName,
        businessType: form.businessType,
        phone: form.phone,
        address: form.address,
        countryId: form.countryId,
        cityId: form.cityId,
        currency: form.currency,
        branchName: form.branchName,
        numberOfTables: parseInt(form.numberOfTables) || 5,
      });
      await businessApi.updateOnboardingStep(3, true);
      await refreshBusiness();
      setStep(4);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = async () => {
    await refreshBusiness();
    router.replace("/owner/dashboard");
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
        py: 6,
        background: "var(--color-bg)",
      }}
    >
      {/* ── Logo ── */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(135deg, ${BRAND}, #6B3318)`,
            boxShadow: `0 4px 16px rgba(212,133,10,0.35)`,
          }}
        >
          🍺
        </Box>
        <Typography
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontWeight: 700,
            fontSize: 20,
            background: `linear-gradient(135deg, #F5C842 0%, ${BRAND} 50%, #A0622A 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          SmartMenu AI
        </Typography>
      </Box>

      {/* ── Step progress ── */}
      {step !== 4 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 4 }}>
          {STEPS.slice(0, 3).map((s, i) => (
            <Box key={s.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    step > s.id
                      ? GREEN
                      : step === s.id
                        ? `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`
                        : "rgba(45,18,0,0.8)",
                  color: step >= s.id ? "white" : TEXT_D,
                  border:
                    step === s.id
                      ? `2px solid rgba(212,133,10,0.5)`
                      : `2px solid rgba(107,51,24,0.3)`,
                  boxShadow:
                    step === s.id ? `0 0 12px rgba(212,133,10,0.4)` : "none",
                  transition: "all 0.3s",
                }}
              >
                {step > s.id ? "✓" : s.id}
              </Box>
              {i < 2 && (
                <Box
                  sx={{
                    width: 32,
                    height: 2,
                    borderRadius: 1,
                    background: step > s.id ? GREEN : "rgba(107,51,24,0.3)",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}

      {/* ── Main card ── */}
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 440,
          borderRadius: "16px",
          p: 4,
          background:
            "linear-gradient(145deg, rgba(45,18,0,0.9) 0%, rgba(28,10,0,0.95) 100%)",
          border: "1px solid rgba(212,133,10,0.15)",
          backdropFilter: "blur(12px)",
          boxShadow:
            "0 2px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,133,10,0.1)",
        }}
      >
        {/* Error banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2.5,
                py: 1.5,
                borderRadius: "14px",
                mb: 3,
                background: alpha(ERROR, 0.08),
                border: `1px solid ${alpha(ERROR, 0.25)}`,
                color: "#f87171",
                fontSize: 13,
              }}
            >
              {error}
            </Box>
          </motion.div>
        )}

        {/* Step 1: Business type selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: TEXT_P,
                mb: 0.5,
              }}
            >
              What type of venue?
            </Typography>
            <Typography sx={{ fontSize: 14, color: TEXT_M, mb: 3 }}>
              This helps us set up the right defaults for your menu.
            </Typography>

            <Grid container spacing={1.5} sx={{ mb: 3 }}>
              {BUSINESS_TYPES.map((t) => {
                const selected = form.businessType === t.value;
                return (
                  <Grid size={{ xs: 6 }} key={t.value}>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => set("businessType", t.value)}
                      sx={{
                      width: "100%",
                      p: 2.5,
                      borderRadius: "14px",
                      border: "1px solid",
                      borderColor: selected
                        ? "rgba(212,133,10,0.5)"
                        : "rgba(107,51,24,0.3)",
                      background: selected
                        ? "rgba(212,133,10,0.12)"
                        : "rgba(45,18,0,0.5)",
                      boxShadow: selected
                        ? "0 0 12px rgba(212,133,10,0.2)"
                        : "none",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                      "&:hover": {
                        borderColor: "rgba(212,133,10,0.4)",
                      },
                      }}
                    >
                      <Typography sx={{ fontSize: 28, mb: 1 }}>{t.icon}</Typography>
                      <Typography
                        sx={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: selected ? BRAND : TEXT_S,
                        }}
                      >
                        {t.label}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>

            <Button
              variant="contained"
              fullWidth
              disabled={!form.businessType}
              onClick={() => setStep(2)}
              sx={{
                height: 48,
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
                color: "#FFF8ED",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                border: `1px solid ${alpha(BRAND, 0.4)}`,
                opacity: form.businessType ? 1 : 0.6,
                "&:hover": {
                  background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                  boxShadow: `0 8px 36px ${alpha(BRAND, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  transform: "translateY(-2px)",
                },
                transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              Continue →
            </Button>
          </motion.div>
        )}

        {/* Step 2: Basic info */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: TEXT_P,
                mb: 0.5,
              }}
            >
              Tell us about your business
            </Typography>
            <Typography sx={{ fontSize: 14, color: TEXT_M, mb: 3 }}>
              This appears on your digital menu and receipts.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Business name"
                placeholder="The Golden Lion Bar"
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                required
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: !!form.businessName || undefined }}
              />

              <TextField
                label="Phone"
                placeholder="+260 97 123 4567"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                fullWidth
                sx={inputSx}
              />

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={countries}
                    value={countries.find((country) => String(country.id) === String(form.countryId)) || null}
                    getOptionLabel={(country) => country.name || ""}
                    isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                    onChange={(_, country) => {
                      setForm((current) => ({
                        ...current,
                        countryId: country?.id || "",
                        country: country?.name || "",
                        cityId: "",
                        city: "",
                      }));
                      setCitySearch("");
                    }}
                    loading={catalogLoading}
                    renderInput={(params) => (
                      <TextField {...params} label="Country" required sx={inputSx} />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Autocomplete
                    options={cities}
                    value={cities.find((city) => String(city.id) === String(form.cityId)) || null}
                    getOptionLabel={(city) => city.name || ""}
                    isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                    onInputChange={(_, value, reason) => {
                      if (reason === "input") setCitySearch(value);
                    }}
                    onChange={(_, city) => {
                      set("cityId", city?.id || "");
                      set("city", city?.name || "");
                    }}
                    disabled={!form.countryId}
                    loading={catalogLoading}
                    renderInput={(params) => (
                      <TextField {...params} label="City" required sx={inputSx} />
                    )}
                  />
                </Grid>
              </Grid>

              <FormControl fullWidth sx={inputSx}>
                <InputLabel sx={{ color: TEXT_M, "&.Mui-focused": { color: BRAND } }}>
                  Currency
                </InputLabel>
                <Select
                  value={form.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  label="Currency"
                >
                  {CURRENCIES.map((c) => (
                    <MenuItem key={c.code} value={c.code}>
                      {c.symbol} — {c.label} ({c.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setStep(1)}
                sx={{
                  flex: 1,
                  height: 48,
                  borderRadius: "14px",
                  color: TEXT_S,
                  borderColor: "rgba(212,133,10,0.3)",
                  background: "rgba(45,18,0,0.8)",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: BRAND,
                    background: alpha(BRAND, 0.06),
                  },
                }}
              >
                ← Back
              </Button>
              <Button
                variant="contained"
                fullWidth
                disabled={!form.businessName || !form.countryId || !form.cityId}
                onClick={() => setStep(3)}
                sx={{
                  flex: 1,
                  height: 48,
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
                  color: "#FFF8ED",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  border: `1px solid ${alpha(BRAND, 0.4)}`,
                  opacity: form.businessName ? 1 : 0.6,
                  "&:hover": {
                    background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                    boxShadow: `0 8px 36px ${alpha(BRAND, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                    transform: "translateY(-2px)",
                  },
                  transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                Continue →
              </Button>
            </Box>
          </motion.div>
        )}

        {/* Step 3: Branch & tables */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: TEXT_P,
                mb: 0.5,
              }}
            >
              Set up your first branch
            </Typography>
            <Typography sx={{ fontSize: 14, color: TEXT_M, mb: 3 }}>
              We&apos;ll generate QR codes for each table automatically.
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Branch name"
                placeholder="Main Branch"
                value={form.branchName}
                onChange={(e) => set("branchName", e.target.value)}
                fullWidth
                sx={inputSx}
              />
              <TextField
                label="Number of tables"
                type="number"
                placeholder="5"
                value={form.numberOfTables}
                onChange={(e) => set("numberOfTables", e.target.value)}
                inputProps={{ min: 1, max: 100 }}
                fullWidth
                sx={inputSx}
              />
              <Typography sx={{ fontSize: 12, color: TEXT_D, mt: -0.5 }}>
                You can add or remove tables anytime from your dashboard.
              </Typography>
            </Box>

            <Paper
              variant="outlined"
              sx={{
                mt: 3,
                p: 2,
                borderRadius: "14px",
                background: alpha(BRAND, 0.06),
                borderColor: alpha(BRAND, 0.2),
              }}
            >
              <Typography
                sx={{ fontSize: 14, fontWeight: 600, color: BRAND, mb: 1 }}
              >
                📌 What we&apos;ll create:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0, display: "flex", flexDirection: "column", gap: 0.5 }}>
                {[
                  `Business: ${form.businessName || "Your Business"}`,
                  `Branch: ${form.branchName}`,
                  `${form.numberOfTables || 5} tables with QR codes`,
                  "Default menu settings",
                ].map((item) => (
                  <Box component="li" key={item} sx={{ fontSize: 13, color: TEXT_S, display: "flex", alignItems: "center", gap: 1 }}>
                    <span style={{ color: GREEN }}>✓</span> {item}
                  </Box>
                ))}
              </Box>
            </Paper>

            <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setStep(2)}
                sx={{
                  flex: 1,
                  height: 48,
                  borderRadius: "14px",
                  color: TEXT_S,
                  borderColor: "rgba(212,133,10,0.3)",
                  background: "rgba(45,18,0,0.8)",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: BRAND,
                    background: alpha(BRAND, 0.06),
                  },
                }}
              >
                ← Back
              </Button>
              <Button
                variant="contained"
                fullWidth
                disabled={loading}
                onClick={handleFinish}
                sx={{
                  flex: 1,
                  height: 48,
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
                  color: "#FFF8ED",
                  fontWeight: 700,
                  fontSize: 14,
                  boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                  border: `1px solid ${alpha(BRAND, 0.4)}`,
                  opacity: loading ? 0.7 : 1,
                  "&:hover": {
                    background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                    boxShadow: `0 8px 36px ${alpha(BRAND, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                    transform: "translateY(-2px)",
                  },
                  transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
                }}
              >
                {loading ? (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <CircularProgress size={16} sx={{ color: "white" }} />
                    Setting up…
                  </Box>
                ) : (
                  "Finish setup →"
                )}
              </Button>
            </Box>
          </motion.div>
        )}

        {/* Step 4: Done */}
        {step === 4 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ textAlign: "center", padding: "16px 0" }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 3,
                fontSize: 32,
                background: `linear-gradient(135deg, rgba(34,197,94,0.2), rgba(21,128,61,0.2))`,
                border: "2px solid rgba(34,197,94,0.4)",
                boxShadow: "0 0 20px rgba(34,197,94,0.2)",
              }}
            >
              🎉
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: TEXT_P,
                mb: 1,
              }}
            >
              You&apos;re all set!
            </Typography>
            <Typography sx={{ fontSize: 14, color: TEXT_S, mb: 1 }}>
              <strong style={{ color: TEXT_P }}>{form.businessName}</strong> is ready.
            </Typography>
            <Typography sx={{ fontSize: 14, color: TEXT_M, mb: 4 }}>
              Your first branch and {form.numberOfTables} tables have been created with QR codes. Time to build your menu!
            </Typography>
            <Button
              variant="contained"
              fullWidth
              onClick={goToDashboard}
              sx={{
                height: 48,
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
                color: "#FFF8ED",
                fontWeight: 700,
                fontSize: 14,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}, inset 0 1px 0 rgba(255,255,255,0.15)`,
                border: `1px solid ${alpha(BRAND, 0.4)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                  boxShadow: `0 8px 36px ${alpha(BRAND, 0.55)}, inset 0 1px 0 rgba(255,255,255,0.25)`,
                  transform: "translateY(-2px)",
                },
                transition: "all 220ms cubic-bezier(0.4,0,0.2,1)",
              }}
            >
              Go to dashboard →
            </Button>
          </motion.div>
        )}
      </Paper>
    </Box>
  );
}
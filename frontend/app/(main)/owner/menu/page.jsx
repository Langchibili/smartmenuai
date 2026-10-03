"use client";
import { useEffect, useState, useCallback } from "react";
import {
  Box, Typography, Button, Paper, Card, CardMedia, CardContent, CardActions, Grid,
  Chip, Stack, TextField, Switch, FormControlLabel, CircularProgress,
  IconButton, Divider,
  alpha,
} from "@mui/material";
import { useAuth } from "@/lib/auth-context";
import { menuApi, flattenStrapiResponse } from "@/lib/api";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast-provider";
import { formatCurrency } from "@/lib/utils";

// ─── Design tokens ────────────────────────────────────────────────────────────
const BRAND = "#D4850A";
const BRAND_DARK = "#A0622A";
const GOLD = "#F5C842";
const TEXT_P = "#F9EDD8";
const TEXT_S = "#D4A872";
const TEXT_M = "#8B6038";
const TEXT_D = "#5F3E22";
const GREEN = "#22c55e";
const BLUE = "#3b82f6";
const ERROR = "#ef4444";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL ?? "http://localhost:1337";

// ─── Reusable input sx ───────────────────────────────────────────────────────
const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    background: "rgba(45,18,0,0.8)",
    color: TEXT_P,
    fontSize: 14,
    "& fieldset": { borderColor: "rgba(212,133,10,0.18)" },
    "&:hover fieldset": { borderColor: alpha(BRAND, 0.45) },
    "&.Mui-focused fieldset": {
      borderColor: BRAND,
      boxShadow: `0 0 0 3px ${alpha(BRAND, 0.18)}, 0 0 20px ${alpha(BRAND, 0.12)}`,
    },
  },
  "& .MuiInputLabel-root": { color: TEXT_M, fontSize: 14 },
  "& .MuiInputLabel-root.Mui-focused": { color: BRAND },
  "& .MuiSelect-select": { color: TEXT_P },
  "& textarea": { color: TEXT_P },
};

// ─── Skeleton fallback ───────────────────────────────────────────────────────
const Skeleton = ({ height = 20, width = "100%", ...props }) => (
  <Box sx={{ borderRadius: "8px", background: "rgba(45,18,0,0.6)", height, width }} {...props} />
);

export default function MenuPage() {
  const { business } = useAuth();
  const { toast } = useToast();

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCat, setActiveCat] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [catModal, setCatModal] = useState(false);
  const [itemModal, setItemModal] = useState(false);
  const [editing, setEditing] = useState(null);

  const [catForm, setCatForm] = useState({ name: "", icon: "" });
  const [itemForm, setItemForm] = useState({
    name: "", description: "", price: "", tags: "",
    preparation_time: "", is_available: true, is_popular: false,
    is_featured: false, is_special_offer: false,
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!business?.id) return;
    try {
      const [catsRes, itemsRes] = await Promise.all([
        menuApi.getCategories(business.id),
        menuApi.getMenuItems(business.id),
      ]);
      const cats = flattenStrapiResponse(catsRes) ?? [];
      const its = flattenStrapiResponse(itemsRes) ?? [];
      setCategories(Array.isArray(cats) ? cats : [cats]);
      setItems(Array.isArray(its) ? its : [its]);
      if (!activeCat && cats.length > 0) setActiveCat(cats[0]?.id ?? null);
    } catch { toast("Failed to load menu", "error"); }
    finally { setLoading(false); }
  }, [business?.id, activeCat, toast]);

  useEffect(() => { load(); }, [load]);

  const visibleItems = activeCat
    ? items.filter(i => (i.menu_category?.id ?? i.menu_category_id) === activeCat)
    : items;

  // ── Category CRUD ────────────────────────────────────────────────
  const openCatModal = (cat) => {
    setEditing(cat ?? null);
    setCatForm(cat ? { name: cat.name, icon: cat.icon ?? "" } : { name: "", icon: "" });
    setCatModal(true);
  };

  const saveCategory = async () => {
    if (!catForm.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await menuApi.updateCategory(editing.id, { ...catForm, business: business.id });
        toast("Category updated", "success");
      } else {
        await menuApi.createCategory({ ...catForm, business: business.id, sort_order: categories.length });
        toast("Category created", "success");
      }
      setCatModal(false);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const deleteCategory = async (id) => {
    if (!confirm("Delete this category? Items will become uncategorised.")) return;
    try { await menuApi.deleteCategory(id); toast("Deleted", "success"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  // ── Item CRUD ────────────────────────────────────────────────────
  const openItemModal = (item) => {
    setEditing(item ?? null);
    setItemForm(item ? {
      name: item.name, description: item.description ?? "", price: String(item.price),
      tags: item.tags ?? "", preparation_time: item.preparation_time ?? "",
      is_available: item.is_available, is_popular: item.is_popular,
      is_featured: item.is_featured, is_special_offer: item.is_special_offer,
    } : {
      name: "", description: "", price: "", tags: "",
      preparation_time: "", is_available: true, is_popular: false,
      is_featured: false, is_special_offer: false,
    });
    setItemModal(true);
  };

  const saveItem = async () => {
    if (!itemForm.name || !itemForm.price) return;
    setSaving(true);
    try {
      const payload = {
        ...itemForm,
        price: parseFloat(itemForm.price),
        business: business.id,
        menu_category: activeCat,
      };
      if (editing) {
        await menuApi.updateMenuItem(editing.id, payload);
        toast("Item updated", "success");
      } else {
        await menuApi.createMenuItem(payload);
        toast("Item created", "success");
      }
      setItemModal(false);
      load();
    } catch (e) { toast(e.message, "error"); }
    finally { setSaving(false); }
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this menu item?")) return;
    try { await menuApi.deleteMenuItem(id); toast("Deleted", "success"); load(); }
    catch (e) { toast(e.message, "error"); }
  };

  const toggleField = async (item, field) => {
    try {
      await menuApi.updateMenuItem(item.id, { [field]: !item[field] });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, [field]: !i[field] } : i));
    } catch (e) { toast(e.message, "error"); }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, lg: 4 } }}>
        <Skeleton height={32} width="12rem" sx={{ mb: 3 }} />
        <Skeleton height={400} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, lg: 4 }, py: 3, maxWidth: "1440px", mx: "auto" }}>
      {/* Header */}
      <PageHeader
        title="Menu"
        icon="📋"
        subtitle={`${items.length} items across ${categories.length} categories`}
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              onClick={() => openCatModal()}
              sx={{
                borderRadius: "14px",
                color: TEXT_S,
                borderColor: "rgba(212,133,10,0.3)",
                background: "rgba(45,18,0,0.8)",
                fontWeight: 600,
                fontSize: "0.85rem",
                "&:hover": { borderColor: BRAND, background: alpha(BRAND, 0.06) },
              }}
            >
              + Category
            </Button>
            <Button
              variant="contained"
              onClick={() => openItemModal()}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                color: "#FFF8ED",
                fontWeight: 700,
                fontSize: "0.85rem",
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                  boxShadow: `0 8px 24px ${alpha(BRAND, 0.45)}`,
                },
              }}
            >
              + Add item
            </Button>
          </Stack>
        }
      />

      {/* Content */}
      <Grid container spacing={3}>
        {/* Categories sidebar */}
        <Grid item xs={12} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: "16px",
              background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
              border: "1px solid rgba(107,51,24,0.25)",
              backdropFilter: "blur(6px)",
            }}
          >
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: TEXT_M, mb: 1.5, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Categories
            </Typography>
            <Stack spacing={0.5}>
              <Button
                onClick={() => setActiveCat(null)}
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  borderRadius: "12px",
                  color: activeCat === null ? BRAND : TEXT_S,
                  background: activeCat === null ? alpha(BRAND, 0.12) : "transparent",
                  border: activeCat === null ? `1px solid ${alpha(BRAND, 0.2)}` : "1px solid transparent",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  "&:hover": { background: alpha(BRAND, 0.06) },
                }}
              >
                <Box component="span" sx={{ mr: 1, fontSize: "1rem" }}>🍽️</Box>
                All items
              </Button>
              {categories.map(cat => (
                <Box key={cat.id} sx={{ position: "relative", "&:hover .cat-actions": { display: "flex" } }}>
                  <Button
                    onClick={() => setActiveCat(cat.id)}
                    fullWidth
                    sx={{
                      justifyContent: "flex-start",
                      borderRadius: "12px",
                      color: activeCat === cat.id ? BRAND : TEXT_S,
                      background: activeCat === cat.id ? alpha(BRAND, 0.12) : "transparent",
                      border: activeCat === cat.id ? `1px solid ${alpha(BRAND, 0.2)}` : "1px solid transparent",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      "&:hover": { background: alpha(BRAND, 0.06) },
                    }}
                  >
                    <Box component="span" sx={{ mr: 1, fontSize: "1rem" }}>{cat.icon || "📁"}</Box>
                    <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.name}
                    </Box>
                  </Button>
                  <Box
                    className="cat-actions"
                    sx={{
                      display: "none",
                      position: "absolute",
                      right: 4,
                      top: "50%",
                      transform: "translateY(-50%)",
                      gap: 0.3,
                    }}
                  >
                    <IconButton
                      size="small"
                      onClick={() => openCatModal(cat)}
                      sx={{
                        width: 24,
                        height: 24,
                        color: TEXT_M,
                        background: "rgba(45,18,0,0.8)",
                        borderRadius: "6px",
                        "&:hover": { color: BRAND },
                      }}
                    >
                      <span style={{ fontSize: "0.7rem" }}>✎</span>
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteCategory(cat.id)}
                      sx={{
                        width: 24,
                        height: 24,
                        color: ERROR,
                        background: "rgba(45,18,0,0.8)",
                        borderRadius: "6px",
                        "&:hover": { background: alpha(ERROR, 0.2) },
                      }}
                    >
                      <span style={{ fontSize: "0.7rem" }}>✕</span>
                    </IconButton>
                  </Box>
                </Box>
              ))}
              {categories.length === 0 && (
                <Typography sx={{ fontSize: "0.8rem", color: TEXT_D, px: 1.5, py: 1 }}>
                  No categories yet
                </Typography>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Items grid */}
        <Grid item xs={12} md={9}>
          {visibleItems.length === 0 ? (
            <EmptyState
              icon="🍕"
              title="No items here"
              description="Add your first menu item to this category."
              action={
                <Button
                  variant="contained"
                  onClick={() => openItemModal()}
                  sx={{
                    borderRadius: "14px",
                    background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                    color: "#FFF8ED",
                    fontWeight: 700,
                    boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                  }}
                >
                  + Add item
                </Button>
              }
            />
          ) : (
            <Grid container spacing={2}>
              {visibleItems.map(item => (
                <Grid item xs={12} sm={6} xl={4} key={item.id}>
                  <Card
                    elevation={0}
                    sx={{
                    borderRadius: "16px",
                    background: "linear-gradient(145deg, rgba(45,18,0,0.6) 0%, rgba(28,10,0,0.7) 100%)",
                    border: "1px solid rgba(107,51,24,0.25)",
                    backdropFilter: "blur(6px)",
                    transition: "all 0.2s",
                    "&:hover": { borderColor: alpha(BRAND, 0.3) },
                    }}
                  >
                  {item.image && (
                    <CardMedia
                      component="img"
                      image={item.image?.url ? `${STRAPI}${item.image.url}` : item.image}
                      alt={item.name}
                      sx={{ height: 140, objectFit: "cover" }}
                    />
                  )}
                  <CardContent sx={{ p: 2.5, pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                      <Typography sx={{ fontWeight: 600, color: TEXT_P, fontSize: "0.95rem", flex: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography sx={{ fontWeight: 700, color: BRAND, fontSize: "0.95rem", whiteSpace: "nowrap" }}>
                        {formatCurrency(item.price, business?.currency)}
                      </Typography>
                    </Stack>
                    {item.description && (
                      <Typography sx={{ fontSize: "0.8rem", color: TEXT_M, mt: 0.8 }}>
                        {item.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: "wrap", gap: 0.5 }}>
                      {item.is_popular && <Chip label="Popular" size="small" color="warning" variant="outlined" />}
                      {item.is_featured && <Chip label="Featured" size="small" color="info" variant="outlined" />}
                      {item.is_special_offer && <Chip label="Special" size="small" color="error" variant="outlined" />}
                      {!item.is_available && <Chip label="Unavailable" size="small" color="default" variant="outlined" />}
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2.5, pb: 2, display: "flex", gap: 1 }}>
                    <Button
                      size="small"
                      onClick={() => toggleField(item, "is_available")}
                      sx={{
                        flex: 1,
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        borderRadius: "10px",
                        color: item.is_available ? GREEN : ERROR,
                        border: `1px solid ${item.is_available ? alpha(GREEN, 0.3) : alpha(ERROR, 0.3)}`,
                        background: item.is_available ? alpha(GREEN, 0.07) : alpha(ERROR, 0.07),
                        "&:hover": {
                          background: item.is_available ? alpha(GREEN, 0.12) : alpha(ERROR, 0.12),
                        },
                      }}
                    >
                      {item.is_available ? "Available" : "Unavailable"}
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => openItemModal(item)}
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "8px",
                        color: TEXT_M,
                        border: "1px solid rgba(107,51,24,0.3)",
                        "&:hover": { color: BRAND, borderColor: BRAND },
                      }}
                    >
                      <span style={{ fontSize: "0.7rem" }}>✎</span>
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => deleteItem(item.id)}
                      sx={{
                        width: 30,
                        height: 30,
                        borderRadius: "8px",
                        color: ERROR,
                        border: "1px solid rgba(239,68,68,0.3)",
                        "&:hover": { background: alpha(ERROR, 0.2) },
                      }}
                    >
                      <span style={{ fontSize: "0.7rem" }}>✕</span>
                    </IconButton>
                  </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>

      {/* ── Category modal ── */}
      <Modal
        open={catModal}
        onClose={() => setCatModal(false)}
        title={editing ? "Edit category" : "New category"}
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => setCatModal(false)}
              sx={{
                borderRadius: "14px",
                color: TEXT_S,
                borderColor: "rgba(212,133,10,0.3)",
                background: "rgba(45,18,0,0.8)",
                "&:hover": { borderColor: BRAND, background: alpha(BRAND, 0.06) },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={saveCategory}
              disabled={saving}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                color: "#FFF8ED",
                fontWeight: 700,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                },
              }}
            >
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.5}>
          <TextField
            label="Category name *"
            placeholder="e.g. Grilled Mains"
            value={catForm.name}
            onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
            required
            fullWidth
            sx={inputSx}
            InputLabelProps={{ shrink: !!catForm.name || undefined }}
          />
          <TextField
            label="Icon emoji"
            placeholder="🍖"
            value={catForm.icon}
            onChange={e => setCatForm(f => ({ ...f, icon: e.target.value }))}
            fullWidth
            sx={inputSx}
          />
        </Stack>
      </Modal>

      {/* ── Item modal ── */}
      <Modal
        open={itemModal}
        onClose={() => setItemModal(false)}
        title={editing ? "Edit item" : "New menu item"}
        size="lg"
        footer={
          <>
            <Button
              variant="outlined"
              onClick={() => setItemModal(false)}
              sx={{
                borderRadius: "14px",
                color: TEXT_S,
                borderColor: "rgba(212,133,10,0.3)",
                background: "rgba(45,18,0,0.8)",
                "&:hover": { borderColor: BRAND, background: alpha(BRAND, 0.06) },
              }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={saveItem}
              disabled={saving}
              sx={{
                borderRadius: "14px",
                background: `linear-gradient(135deg, ${BRAND}, ${BRAND_DARK})`,
                color: "#FFF8ED",
                fontWeight: 700,
                boxShadow: `0 4px 16px ${alpha(BRAND, 0.3)}`,
                "&:hover": {
                  background: `linear-gradient(135deg, #E8970F 0%, #B07030 100%)`,
                },
              }}
            >
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </Button>
          </>
        }
      >
        <Stack spacing={2.5}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Item name *"
                placeholder="Grilled Chicken"
                value={itemForm.name}
                onChange={e => setItemForm(f => ({ ...f, name: e.target.value }))}
                required
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: !!itemForm.name || undefined }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Price *"
                type="number"
                inputProps={{ step: "0.01" }}
                placeholder="0.00"
                value={itemForm.price}
                onChange={e => setItemForm(f => ({ ...f, price: e.target.value }))}
                required
                fullWidth
                sx={inputSx}
                InputLabelProps={{ shrink: !!itemForm.price || undefined }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Prep time"
                placeholder="15 mins"
                value={itemForm.preparation_time}
                onChange={e => setItemForm(f => ({ ...f, preparation_time: e.target.value }))}
                fullWidth
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                multiline
                rows={3}
                placeholder="Describe this item…"
                value={itemForm.description}
                onChange={e => setItemForm(f => ({ ...f, description: e.target.value }))}
                fullWidth
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Tags (comma-separated)"
                placeholder="spicy, gluten-free"
                value={itemForm.tags}
                onChange={e => setItemForm(f => ({ ...f, tags: e.target.value }))}
                fullWidth
                sx={inputSx}
              />
            </Grid>
          </Grid>

          {/* Toggles */}
          <Box sx={{ mt: 1 }}>
            <Grid container spacing={1}>
              {[
                ["is_available", "Available"],
                ["is_popular", "Popular 🔥"],
                ["is_featured", "Featured ⭐"],
                ["is_special_offer", "Special offer 🎁"],
              ].map(([field, label]) => (
                <Grid item xs={6} key={field}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={itemForm[field]}
                        onChange={() => setItemForm(f => ({ ...f, [field]: !f[field] }))}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": { color: BRAND },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: BRAND },
                        }}
                      />
                    }
                    label={<Typography sx={{ fontSize: "0.85rem", color: TEXT_S }}>{label}</Typography>}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        </Stack>
      </Modal>
    </Box>
  );
}
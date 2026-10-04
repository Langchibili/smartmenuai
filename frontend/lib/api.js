/**
 * lib/api.ts → lib/api.js
 * Thin wrapper around Strapi's custom function endpoints.
 * All auth is handled via JWT stored in localStorage.
 */

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1357";

// ─── Token helpers ──────────────────────────────────────────────────────────
export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("smartmenu_jwt");
};

export const setToken = (token) => {
  localStorage.setItem("smartmenu_jwt", token);
};

export const clearToken = () => {
  localStorage.removeItem("smartmenu_jwt");
  localStorage.removeItem("smartmenu_user");
};

// ─── Core fetch wrapper ──────────────────────────────────────────────────────
async function callStrapi(
  endpoint,
  body,
  options = {}
) {
  const { auth = true, method = "POST" } = options;

  const headers = {
    "Content-Type": "application/json",
  };

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${STRAPI_URL}/api/${endpoint}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();

  if (!res.ok) {
    const msg =
      data?.error?.message ||
      data?.message ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  /** Standard Strapi local login */
  login: async (identifier, password) => {
    const data = await callStrapi(
      "auth/local",
      { identifier, password },
      { auth: false }
    );
    setToken(data.jwt);
    return data;
  },

  /** Standard Strapi registration */
  register: async (payload) => {
    const data = await callStrapi(
      "auth/local/register",
      {
        username: payload.username,
        email: payload.email,
        password: payload.password,
      },
      { auth: false }
    );
    if (!data.jwt || !data.user?.id) {
      throw new Error("Registration succeeded without returning an account token.");
    }
    setToken(data.jwt);
    return data;
  },

  forgotPassword: (email) =>
    callStrapi("auth/forgot-password", { email }, { auth: false }),

  resetPassword: (payload) =>
    callStrapi("auth/reset-password", payload, { auth: false }),

  /** Get current user from Strapi */
  me: async () => {
    return callStrapi("users/me?populate=*", undefined, {
      method: "GET",
    });
  },

  logout: () => {
    clearToken();
  },
};

// ─── Business ────────────────────────────────────────────────────────────────
export const businessApi = {
  getMyBusiness: (profile = {}) =>
    callStrapi("custom-functions/getMyBusiness", profile),

  createBusinessWithBranchAndTables: (payload) =>
    callStrapi("custom-functions/createBusinessWithBranchAndTables", payload),

  updateOnboardingStep: (step, complete) =>
    callStrapi("custom-functions/updateOnboardingStep", { step, complete }),

  getBusinessReports: (payload) =>
    callStrapi("custom-functions/getBusinessReports", payload),

  updateBusinessLocation: (payload) =>
    callStrapi("custom-functions/updateBusinessLocation", payload),

  getBusinessCustomerAnalytics: (payload) =>
    callStrapi("custom-functions/getBusinessCustomerAnalytics", payload),
};

// ─── Tables ──────────────────────────────────────────────────────────────────
export const tableApi = {
  getBusinessTables: (businessId, branchId) =>
    callStrapi("custom-functions/getBusinessTables", { businessId, branchId }),

  createBusinessTable: (payload) =>
    callStrapi("custom-functions/createBusinessTable", payload),

  updateTableStatus: (tableId, status) =>
    callStrapi("custom-functions/updateTableStatus", { tableId, status }),

  assignWaiterToTable: (tableId, waiterId) =>
    callStrapi("custom-functions/assignWaiterToTable", { tableId, waiterId }),
};

// ─── Menu ─────────────────────────────────────────────────────────────────────
export const menuApi = {
  getPublicMenu: (businessId, tableId, branchId) =>
    callStrapi("custom-functions/getPublicMenu", { businessId, tableId, branchId }, { auth: false }),

  // Standard CRUD via Strapi REST
  getCategories: (businessId) =>
    callStrapi(`menu-categories?filters[business][id][$eq]=${businessId}&sort=sort_order:asc&populate=*`, undefined, {
      method: "GET",
    }),

  createCategory: (payload) =>
    callStrapi("menu-categories", { data: payload }),

  updateCategory: (id, payload) =>
    callStrapi(`menu-categories/${id}`, { data: payload }, { method: "PUT" }),

  deleteCategory: (id) =>
    callStrapi(`menu-categories/${id}`, undefined, { method: "DELETE" }),

  getMenuItems: (businessId) =>
    callStrapi(
      `menu-items?filters[business][id][$eq]=${businessId}&populate[image]=true&populate[menu_category]=true&populate[variants]=true&populate[modifiers]=true&sort=name:asc`,
      undefined,
      { method: "GET" }
    ),

  createMenuItem: (payload) =>
    callStrapi("menu-items", { data: payload }),

  updateMenuItem: (id, payload) =>
    callStrapi(`menu-items/${id}`, { data: payload }, { method: "PUT" }),

  deleteMenuItem: (id) =>
    callStrapi(`menu-items/${id}`, undefined, { method: "DELETE" }),

  getMenuSettings: (businessId) =>
    callStrapi(
      `business-menu-settings?filters[business][id][$eq]=${businessId}&populate=*`,
      undefined,
      { method: "GET" }
    ),

  updateMenuSettings: (id, payload) =>
    callStrapi(`business-menu-settings/${id}`, { data: payload }, { method: "PUT" }),
};

// ─── Orders ──────────────────────────────────────────────────────────────────
export const orderApi = {
  getBusinessOrders: (payload) =>
    callStrapi("custom-functions/getBusinessOrders", payload),

  placeOrder: (payload) =>
    callStrapi("custom-functions/placeOrder", payload, { auth: false }),

  getClientOrders: (customerSessionId) =>
    callStrapi("custom-functions/getClientOrders", { customerSessionId }, { auth: false }),

  getCustomerHistory: (customerInstallationId) =>
    callStrapi("custom-functions/getCustomerHistory", { customerInstallationId }, { auth: false }),

  getCustomerOrder: (customerInstallationId, numericOrderNumber) =>
    callStrapi(
      "custom-functions/getCustomerOrder",
      { customerInstallationId, numericOrderNumber },
      { auth: false }
    ),

  getDealAndPromos: (businessId, customerInstallationId) =>
    callStrapi(
      "custom-functions/getDealAndPromos",
      { businessId, customerInstallationId },
      { auth: false }
    ),

  updateOrderStatus: (orderId, status, waiterId) =>
    callStrapi("custom-functions/updateOrderStatus", { orderId, status, waiterId }),
};

// ─── Waiter calls ────────────────────────────────────────────────────────────
export const waiterCallApi = {
  callWaiter: (payload) =>
    callStrapi("custom-functions/callWaiter", payload, { auth: false }),

  acknowledgeCall: (callId, waiterId) =>
    callStrapi("custom-functions/acknowledgeWaiterCall", { callId, waiterId }),

  resolveCall: (callId, tableId) =>
    callStrapi("custom-functions/resolveWaiterCall", { callId, tableId }),

  getActiveCalls: (businessId) =>
    callStrapi("custom-functions/getActiveWaiterCalls", { businessId }),

  getWaiterDashboard: (employeeId, businessId) =>
    callStrapi("custom-functions/getWaiterDashboard", { employeeId, businessId }),

  toggleAvailability: (employeeId, is_active) =>
    callStrapi("custom-functions/toggleWaiterAvailability", { employeeId, is_active }),
};

// ─── Employees ───────────────────────────────────────────────────────────────
export const employeeApi = {
  getEmployees: (businessId) =>
    callStrapi("custom-functions/getBusinessEmployees", { businessId }),

  sendInvite: (payload) =>
    callStrapi("custom-functions/sendEmployeeInvite", payload),

  validateInviteToken: (token) =>
    callStrapi("custom-functions/validateInviteToken", { token }, { auth: false }),

  acceptInvite: (token) =>
    callStrapi("custom-functions/acceptInvite", { token }),

  updateEmployee: (businessId, employeeId, is_active) =>
    callStrapi("custom-functions/updateBusinessEmployee", {
      businessId,
      employeeId,
      is_active,
    }),

  deleteEmployee: (id) =>
    callStrapi(`employees/${id}`, undefined, { method: "DELETE" }),
};

// ─── Platform Admin ───────────────────────────────────────────────────────────
export const platformApi = {
  setupPlatformMaster: (payload) =>
    callStrapi("custom-functions/setupPlatformMaster", payload, { auth: false }),

  getDashboard: () =>
    callStrapi("custom-functions/platformGetDashboard", {}),

  getAllBusinesses: () =>
    callStrapi("custom-functions/platformGetAllBusinesses", {}),

  createBusiness: (payload) =>
    callStrapi("custom-functions/platformCreateBusiness", payload),

  toggleBusiness: (businessId, is_active) =>
    callStrapi("custom-functions/platformToggleBusiness", { businessId, is_active }),

  updateBusinessPlan: (businessId, planType) =>
    callStrapi("custom-functions/platformUpdateBusinessPlan", { businessId, planType }),
};

// ─── Promotions ───────────────────────────────────────────────────────────────
export const promotionApi = {
  getPromotions: (businessId) =>
    callStrapi(
      `promotions?filters[business][id][$eq]=${businessId}&populate=*&sort=createdAt:desc`,
      undefined,
      { method: "GET" }
    ),

  createPromotion: (payload) =>
    callStrapi("promotions", { data: payload }),

  updatePromotion: (id, payload) =>
    callStrapi(`promotions/${id}`, { data: payload }, { method: "PUT" }),

  deletePromotion: (id) =>
    callStrapi(`promotions/${id}`, undefined, { method: "DELETE" }),
};

// ─── Branches ────────────────────────────────────────────────────────────────
export const branchApi = {
  getBranches: (businessId) =>
    callStrapi(
      `branches?filters[business][id][$eq]=${businessId}&populate[manager]=true&sort=branch_name:asc`,
      undefined,
      { method: "GET" }
    ),

  createBranch: (payload) =>
    callStrapi("branches", { data: payload }),

  updateBranch: (id, payload) =>
    callStrapi(`branches/${id}`, { data: payload }, { method: "PUT" }),

  deleteBranch: (id) =>
    callStrapi(`branches/${id}`, undefined, { method: "DELETE" }),
};

export const locationApi = {
  getLocationCatalog: (countryId, search) =>
    callStrapi(
      "custom-functions/getLocationCatalog",
      { countryId, search },
      { auth: false }
    ),
};

// ─── Ads ─────────────────────────────────────────────────────────────────────
export const adApi = {
  getAdCampaigns: (payload) =>
    callStrapi("custom-functions/getAdCampaigns", payload, { auth: false }),

  getCampaigns: () =>
    callStrapi("ad-campaigns?populate[advertiser]=true&sort=createdAt:desc", undefined, { method: "GET" }),

  createCampaign: (payload) =>
    callStrapi("ad-campaigns", { data: payload }),

  updateCampaign: (id, payload) =>
    callStrapi(`ad-campaigns/${id}`, { data: payload }, { method: "PUT" }),

  deleteCampaign: (id) =>
    callStrapi(`ad-campaigns/${id}`, undefined, { method: "DELETE" }),

  getAdvertisers: () =>
    callStrapi("advertisers?sort=advertiser_name:asc", undefined, { method: "GET" }),

  createAdvertiser: (payload) =>
    callStrapi("advertisers", { data: payload }),

  trackEvent: (payload) =>
    callStrapi("ad-events", { data: payload }, { auth: false }),
};

// ─── Strapi REST helper ───────────────────────────────────────────────────────
/** Flatten Strapi v5 REST response: { data: { id, attributes } } → flat object */
export function flattenStrapiResponse(item) {
  if (!item) return null;
  if (Array.isArray(item)) return item.map(flattenStrapiResponse);

  if (item.data !== undefined) {
    if (item.data === null) return null;
    if (Array.isArray(item.data)) return item.data.map(flattenStrapiResponse);
    return flattenStrapiResponse(item.data);
  }

  const { id, attributes, ...rest } = item;
  if (!attributes) return item;

  const flat = { id, ...rest };
  for (const [key, val] of Object.entries(attributes)) {
    flat[key] = flattenStrapiResponse(val);
    // Relation shortcut: category → category_id
    if (val && typeof val === "object" && !Array.isArray(val) && val.data !== undefined) {
      const nested = flattenStrapiResponse(val);
      if (nested && nested.id) flat[`${key}_id`] = nested.id;
    }
  }
  return flat;
}
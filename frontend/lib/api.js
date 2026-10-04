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

  updateBusinessCurrency: (payload) =>
    callStrapi("custom-functions/updateBusinessCurrency", payload),

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

  getBusinessMenu: (businessId) =>
    callStrapi("custom-functions/getBusinessMenu", { businessId }),

  getCategories: (businessId) =>
    callStrapi("custom-functions/getBusinessMenu", { businessId }).then((result) => result.categories || []),

  createCategory: (payload) => callStrapi("custom-functions/manageBusinessMenu", {
    ...payload,
    businessId: payload.business,
    entity: "category",
    operation: "create",
  }),

  updateCategory: (id, payload) => callStrapi("custom-functions/manageBusinessMenu", {
    ...payload,
    businessId: payload.business,
    entity: "category",
    operation: "update",
    entityId: id,
  }),

  deleteCategory: (id, businessId) => callStrapi("custom-functions/manageBusinessMenu", {
    entity: "category",
    operation: "delete",
    entityId: id,
    businessId,
  }),

  getMenuItems: (businessId) =>
    callStrapi("custom-functions/getBusinessMenu", { businessId }).then((result) => result.items || []),

  createMenuItem: (payload) => callStrapi("custom-functions/manageBusinessMenu", {
    ...payload,
    businessId: payload.business,
    entity: "item",
    operation: "create",
  }),

  updateMenuItem: (id, payload) => callStrapi("custom-functions/manageBusinessMenu", {
    ...payload,
    businessId: payload.business,
    entity: "item",
    operation: "update",
    entityId: id,
  }),

  deleteMenuItem: (id, businessId) => callStrapi("custom-functions/manageBusinessMenu", {
    entity: "item",
    operation: "delete",
    entityId: id,
    businessId,
  }),

  uploadMenuItemImage: async (menuItemId, file) => {
    const form = new FormData();
    form.append("menuItemId", String(menuItemId));
    form.append("files", file);

    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(
      `${STRAPI_URL.replace(/\/+$/, "")}/api/custom-functions/uploadMenuItemImage`,
      { method: "POST", headers, body: form }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(
        data?.error?.message || data?.message || `Image upload failed (${response.status})`
      );
    }
    return data.media;
  },

  removeMenuItemImage: (menuItemId) =>
    callStrapi("custom-functions/uploadMenuItemImage", { menuItemId, remove: true }),

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

  submitOrderReview: (orderId, customerInstallationId, rating, review) =>
    callStrapi(
      "custom-functions/submitOrderReview",
      { orderId, customerInstallationId, rating, review },
      { auth: false }
    ),

  placeOrder: (payload) =>
    callStrapi("custom-functions/placeOrder", payload, { auth: false }),

  getClientOrders: (customerInstallationId) =>
    callStrapi("custom-functions/getClientOrders", { customerInstallationId }, { auth: false }),

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

  requestBill: (orderId, customerInstallationId) =>
    callStrapi("custom-functions/requestBill", { orderId, customerInstallationId }, { auth: false }),

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
  getAppLinks: () =>
    callStrapi("custom-functions/getAppLinks", {}, { auth: false }),
  updateAppLinks: (payload) =>
    callStrapi("custom-functions/updateAppLinks", payload),

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

export const currencyApi = {
  getActiveCurrencies: () =>
    callStrapi("custom-functions/getActiveCurrencies", {}, { auth: false }),
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
export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/setupPlatformMaster',
      handler: 'platform-admin.setupPlatformMaster',
      config: { auth: { enabled: false } }, // Public — one-time setup
    },
    {
      method: 'POST',
      path: '/custom-functions/platformCreateBusiness',
      handler: 'platform-admin.platformCreateBusiness',
      config: { auth: { enabled: true } },
    },
    {
      method: 'POST',
      path: '/custom-functions/platformGetDashboard',
      handler: 'platform-admin.platformGetDashboard',
      config: { auth: { enabled: true } },
    },
    {
      method: 'POST',
      path: '/custom-functions/platformGetAllBusinesses',
      handler: 'platform-admin.platformGetAllBusinesses',
      config: { auth: { enabled: true } },
    },
    {
      method: 'POST',
      path: '/custom-functions/platformToggleBusiness',
      handler: 'platform-admin.platformToggleBusiness',
      config: { auth: { enabled: true } },
    },
    {
      method: 'POST',
      path: '/custom-functions/platformUpdateBusinessPlan',
      handler: 'platform-admin.platformUpdateBusinessPlan',
      config: { auth: { enabled: true } },
    },
  ],
};

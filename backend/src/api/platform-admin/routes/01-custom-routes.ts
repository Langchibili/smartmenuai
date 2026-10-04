export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/setupPlatformMaster',
      handler: 'platform-admin.setupPlatformMaster',
      config: { auth: false }, // Public — one-time setup
    },
    {
      method: 'POST',
      path: '/custom-functions/getAppLinks',
      handler: 'platform-admin.getAppLinks',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/updateAppLinks',
      handler: 'platform-admin.updateAppLinks',
    },
    {
      method: 'POST',
      path: '/custom-functions/platformCreateBusiness',
      handler: 'platform-admin.platformCreateBusiness',
    },
    {
      method: 'POST',
      path: '/custom-functions/platformGetDashboard',
      handler: 'platform-admin.platformGetDashboard',
    },
    {
      method: 'POST',
      path: '/custom-functions/platformGetAllBusinesses',
      handler: 'platform-admin.platformGetAllBusinesses',
    },
    {
      method: 'POST',
      path: '/custom-functions/platformToggleBusiness',
      handler: 'platform-admin.platformToggleBusiness',
    },
    {
      method: 'POST',
      path: '/custom-functions/platformUpdateBusinessPlan',
      handler: 'platform-admin.platformUpdateBusinessPlan',
    },
  ],
};

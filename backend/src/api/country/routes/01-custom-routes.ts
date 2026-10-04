export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/getLocationCatalog',
      handler: 'country.getLocationCatalog',
      config: { auth: false },
    },
  ],
};

export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/getActiveCurrencies',
      handler: 'currency.getActiveCurrencies',
      config: { auth: false },
    },
  ],
};

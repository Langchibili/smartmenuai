export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/getCustomerHistory',
      handler: 'customer.getCustomerHistory',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/getCustomerOrder',
      handler: 'customer.getCustomerOrder',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/getDealAndPromos',
      handler: 'customer.getDealAndPromos',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/getBusinessCustomerAnalytics',
      handler: 'customer.getBusinessCustomerAnalytics',
    },
  ],
};

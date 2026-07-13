export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/getPublicMenu',
      handler: 'order.getPublicMenu',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/getClientOrders',
      handler: 'order.getClientOrders',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/placeOrder',
      handler: 'order.placeOrder',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/updateOrderStatus',
      handler: 'order.updateOrderStatus',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/getBusinessOrders',
      handler: 'order.getBusinessOrders',
      config: { auth: { enabled: false } },
    },
  ],
};

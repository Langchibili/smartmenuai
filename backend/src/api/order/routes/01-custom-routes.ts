export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/getPublicMenu',
      handler: 'order.getPublicMenu',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/getClientOrders',
      handler: 'order.getClientOrders',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/placeOrder',
      handler: 'order.placeOrder',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/updateOrderStatus',
      handler: 'order.updateOrderStatus',
    },
    {
      method: 'POST',
      path: '/custom-functions/getBusinessOrders',
      handler: 'order.getBusinessOrders',
    },
  ],
};

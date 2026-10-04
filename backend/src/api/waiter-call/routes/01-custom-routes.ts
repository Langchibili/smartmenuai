export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/callWaiter',
      handler: 'waiter-call.callWaiter',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/requestBill',
      handler: 'waiter-call.requestBill',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/acknowledgeWaiterCall',
      handler: 'waiter-call.acknowledgeWaiterCall',
    },
    {
      method: 'POST',
      path: '/custom-functions/resolveWaiterCall',
      handler: 'waiter-call.resolveWaiterCall',
    },
    {
      method: 'POST',
      path: '/custom-functions/getActiveWaiterCalls',
      handler: 'waiter-call.getActiveWaiterCalls',
    },
    {
      method: 'POST',
      path: '/custom-functions/toggleWaiterAvailability',
      handler: 'waiter-call.toggleWaiterAvailability',
    },
    {
      method: 'POST',
      path: '/custom-functions/getWaiterDashboard',
      handler: 'waiter-call.getWaiterDashboard',
    },
  ],
};

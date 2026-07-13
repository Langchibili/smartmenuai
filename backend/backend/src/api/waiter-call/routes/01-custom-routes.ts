export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/callWaiter',
      handler: 'waiter-call.callWaiter',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/acknowledgeWaiterCall',
      handler: 'waiter-call.acknowledgeWaiterCall',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/resolveWaiterCall',
      handler: 'waiter-call.resolveWaiterCall',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/getActiveWaiterCalls',
      handler: 'waiter-call.getActiveWaiterCalls',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/toggleWaiterAvailability',
      handler: 'waiter-call.toggleWaiterAvailability',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/getWaiterDashboard',
      handler: 'waiter-call.getWaiterDashboard',
      config: { auth: { enabled: false } },
    },
  ],
};

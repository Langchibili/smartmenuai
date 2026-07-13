export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/createBusinessTable',
      handler: 'table.createBusinessTable',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/getBusinessTables',
      handler: 'table.getBusinessTables',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/updateTableStatus',
      handler: 'table.updateTableStatus',
      config: { auth: { enabled: false } },
    },
    {
      method: 'POST',
      path: '/custom-functions/assignWaiterToTable',
      handler: 'table.assignWaiterToTable',
      config: { auth: { enabled: false } },
    },
  ],
};

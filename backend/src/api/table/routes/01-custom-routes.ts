export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/createBusinessTable',
      handler: 'table.createBusinessTable',
    },
    {
      method: 'POST',
      path: '/custom-functions/getBusinessTables',
      handler: 'table.getBusinessTables',
    },
    {
      method: 'POST',
      path: '/custom-functions/updateTableStatus',
      handler: 'table.updateTableStatus',
    },
    {
      method: 'POST',
      path: '/custom-functions/assignWaiterToTable',
      handler: 'table.assignWaiterToTable',
    },
  ],
};

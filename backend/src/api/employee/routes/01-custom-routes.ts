export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/getBusinessEmployees',
      handler: 'employee.getBusinessEmployees',
    },
    {
      method: 'POST',
      path: '/custom-functions/updateBusinessEmployee',
      handler: 'employee.updateBusinessEmployee',
    },
  ],
};

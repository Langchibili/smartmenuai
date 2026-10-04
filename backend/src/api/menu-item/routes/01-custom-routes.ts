export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/getBusinessMenu',
      handler: 'menu-item.getBusinessMenu',
    },
    {
      method: 'POST',
      path: '/custom-functions/manageBusinessMenu',
      handler: 'menu-item.manageBusinessMenu',
    },
    {
      method: 'POST',
      path: '/custom-functions/uploadMenuItemImage',
      handler: 'menu-item.uploadMenuItemImage',
    },
  ],
};

export default {
  routes: [
    {
      method: 'POST',
      path: '/custom-functions/sendEmployeeInvite',
      handler: 'employee-invitation.sendEmployeeInvite',
    },
    {
      method: 'POST',
      path: '/custom-functions/validateInviteToken',
      handler: 'employee-invitation.validateInviteToken',
      config: { auth: false },
    },
    {
      method: 'POST',
      path: '/custom-functions/acceptInvite',
      handler: 'employee-invitation.acceptInvite',
    },
  ],
};
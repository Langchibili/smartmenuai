export default {
  routes: [
    { method: 'POST', path: '/devices/register', handler: 'device.registerDevices', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/devices/updatecurrentloc', handler: 'device.updateUserCurrentLocation', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/devices/user/:userId', handler: 'device.getUserDevices', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/devices/pending-orders/:deviceId', handler: 'device.getPendingOrdersByDevice', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/devices/pending-waiter-calls/:deviceId', handler: 'device.getPendingWaiterCallsByDevice', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/devices/acceptorder/:deviceId', handler: 'device.acceptOrderByDevice', config: { policies: [], middlewares: [] } },
    { method: 'POST', path: '/devices/acknowledgecall/:deviceId', handler: 'device.acknowledgeCallByDevice', config: { policies: [], middlewares: [] } },
    { method: 'GET', path: '/device/:deviceId/permissions', handler: 'device.checkDevicePermissions', config: { policies: [], middlewares: [] } },
    { method: 'PUT', path: '/devices/:userId/:deviceId', handler: 'device.updateDevice', config: { policies: [], middlewares: [] } },
    { method: 'DELETE', path: '/devices/:userId/:deviceId', handler: 'device.removeDevice', config: { policies: [], middlewares: [] } },
  ],
};
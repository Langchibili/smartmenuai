import { factories } from '@strapi/strapi';
import socket from '../../../services/socket-client';

export default factories.createCoreController('api::device.device', ({ strapi }) => ({

  async find(ctx) {
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    const { results, pagination } = await strapi.service('api::device.device').find(sanitizedQuery);
    return this.transformResponse(await this.sanitizeOutput(results, ctx), { pagination });
  },

  async findOne(ctx) {
    const { id } = ctx.params;
    const entity = await strapi.service('api::device.device').findOne(id, await this.sanitizeQuery(ctx));
    if (!entity) return ctx.notFound('Device not found');
    return this.transformResponse(await this.sanitizeOutput(entity, ctx));
  },

  async create(ctx) {
    const sanitizedInput = await this.sanitizeInput(ctx.request.body, ctx);
    const entity = await strapi.service('api::device.device').create({ data: sanitizedInput });
    return this.transformResponse(await this.sanitizeOutput(entity, ctx));
  },

  async update(ctx) {
    const { id } = ctx.params;
    const sanitizedInput = await this.sanitizeInput(ctx.request.body, ctx);
    const existing = await strapi.service('api::device.device').findOne(id);
    if (!existing) return ctx.notFound('Device not found');
    const entity = await strapi.service('api::device.device').update(id, { data: sanitizedInput });
    return this.transformResponse(await this.sanitizeOutput(entity, ctx));
  },

  async delete(ctx) {
    const { id } = ctx.params;
    const existing = await strapi.service('api::device.device').findOne(id);
    if (!existing) return ctx.notFound('Device not found');
    const entity = await strapi.service('api::device.device').delete(id);
    return this.transformResponse(await this.sanitizeOutput(entity, ctx));
  },

  async registerDevices(ctx) {
    const { userId, devices } = ctx.request.body;
    if (!Array.isArray(devices)) return ctx.badRequest('Devices array is required');
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId);
    if (!user) return ctx.notFound('User not found');

    const registered = [];
    for (const device of devices) {
      const { deviceId, notificationToken, deviceInfo, frontendName } = device;
      const existing = await strapi.entityService.findMany('api::device.device', {
        filters: { deviceId }, limit: 1,
      });
      const base = {
        ...(deviceInfo || {}), frontendName,
        lastSeen: new Date().toISOString(), active: true,
        updatedAt: new Date().toISOString(),
      };
      if (existing.length) {
        const updated = await strapi.entityService.update('api::device.device', existing[0].id, {
          data: { notificationToken, deviceInfo: { ...((existing[0].deviceInfo as any) || {}), ...base }, user: userId },
        });
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: userId },
          data: { activeDevice: existing[0].id, devices: { connect: [existing[0].id] } },
        });
        registered.push(updated);
      } else {
        const created = await strapi.entityService.create('api::device.device', {
          data: { deviceId, notificationToken, deviceInfo: { ...base, registeredAt: new Date().toISOString() }, user: userId },
        });
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: userId },
          data: { devices: { connect: [created.id] }, activeDevice: created.id },
        });
        registered.push(created);
      }
    }
    ctx.send({ success: true, deviceCount: registered.length, devices: registered });
  },

  // ── Single-shot current location update (no persistent tracking) ─────────
  async updateUserCurrentLocation(ctx) {
    try {
      const { deviceId, location } = ctx.request.body;
      if (!deviceId) return ctx.badRequest('Device ID is required');
      if (!location || !location.latitude || !location.longitude)
        return ctx.badRequest('Location with latitude/longitude required');

      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId }, populate: ['user'],
      });
      if (!device) return ctx.notFound('Device not found');
      if (!device.user) return ctx.badRequest('Device is not associated with a user');

      const locationDetails: any = {
        latitude: location.latitude,
        longitude: location.longitude,
        ...(location.accuracy !== undefined && { accuracy: location.accuracy }),
        ...(location.heading !== undefined && { heading: location.heading }),
        timestamp: location.timestamp ? new Date(location.timestamp).toISOString() : new Date().toISOString(),
      };

      const updatedUser = await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: device.user.id },
        data: { currentLocation: locationDetails },
      });

      await strapi.db.query('api::device.device').update({
        where: { id: device.id },
        data: { deviceInfo: { ...(device.deviceInfo || {}), lastSeen: new Date().toISOString(), lastLocation: locationDetails } },
      });

      ctx.send({ success: true, userId: device.user.id, location: updatedUser.currentLocation });
    } catch (error) {
      console.error('Error updating user location:', error);
      ctx.internalServerError('Failed to update user location');
    }
  },

  async updateDevice(ctx) {
    const { userId, deviceId } = ctx.params;
    const updateData = ctx.request.body;
    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device) return ctx.notFound('Device not found');
    if (device.user.id !== parseInt(userId)) return ctx.forbidden('Device does not belong to this user');
    const updated = await strapi.db.query('api::device.device').update({
      where: { id: device.id },
      data: {
        notificationToken: updateData.notificationToken || device.notificationToken,
        deviceInfo: { ...(device.deviceInfo || {}), ...(updateData.deviceInfo || {}), lastSeen: new Date().toISOString() },
      },
    });
    ctx.send({ success: true, device: updated });
  },

  async getUserDevices(ctx) {
    const { userId } = ctx.params;
    const user = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: userId } });
    if (!user) return ctx.notFound('User not found');
    const devices = await strapi.db.query('api::device.device').findMany({ where: { user: userId } });
    ctx.send({ success: true, devices: devices || [] });
  },

  async removeDevice(ctx) {
    const { userId, deviceId } = ctx.params;
    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device) return ctx.notFound('Device not found');
    if (device.user.id !== parseInt(userId)) return ctx.forbidden('Device does not belong to this user');
    await strapi.db.query('api::device.device').delete({ where: { id: device.id } });
    ctx.send({ success: true });
  },

  async checkDevicePermissions(ctx) {
    const { deviceId } = ctx.params;
    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId } });
    if (!device) return ctx.notFound('Device not found');
    const hasPermissions = !!(device.deviceInfo?.permissions && Object.keys(device.deviceInfo.permissions).length > 0);
    ctx.send({ permissions: device?.deviceInfo?.permissions, success: true, hasPermissions, deviceId });
  },

  async count(ctx) {
    const count = await strapi.service('api::device.device').count(await this.sanitizeQuery(ctx));
    return { data: { count, timestamp: new Date().toISOString() } };
  },

  async bulkCreate(ctx) {
    const { devices } = ctx.request.body;
    if (!Array.isArray(devices) || !devices.length) return ctx.badRequest('Devices array required');
    const created = [];
    for (const d of devices) {
      const sanitized = await this.sanitizeInput(d, ctx);
      created.push(await strapi.service('api::device.device').create({ data: sanitized }));
    }
    return this.transformResponse(await this.sanitizeOutput(created, ctx), { message: `Created ${created.length} devices` });
  },

  async bulkDelete(ctx) {
    const { ids } = ctx.request.body;
    if (!Array.isArray(ids) || !ids.length) return ctx.badRequest('IDs array required');
    const deleted = [];
    for (const id of ids) {
      const entity = await strapi.service('api::device.device').delete(id);
      if (entity) deleted.push(entity);
    }
    return this.transformResponse(await this.sanitizeOutput(deleted, ctx), { message: `Deleted ${deleted.length} devices` });
  },

  async search(ctx) {
    const { query, field = 'deviceId' } = ctx.query as { query: string; field?: string };
    if (!query) return ctx.badRequest('Query required');
    const { results, pagination } = await strapi.service('api::device.device').find({
      ...(await this.sanitizeQuery(ctx)),
      filters: { [field as string]: { $contains: query } },
    });
    return this.transformResponse(await this.sanitizeOutput(results, ctx), { pagination });
  },

  // ── Smart Menu specific: notifications targeting ──────────────────────────

  // Orders relevant to this device's user (owner sees all business orders,
  // waiter sees orders on tables assigned to them)
  async getPendingOrdersByDevice(ctx) {
    const { deviceId } = ctx.params;
    const device = await strapi.db.query('api::device.device').findOne({
      where: { deviceId }, populate: ['user'],
    });
    if (!device) return ctx.notFound('Device not found');
    if (!device.user) return ctx.badRequest('Device not associated with a user');

    const employee = await strapi.db.query('api::employee.employee').findOne({
      where: { user: device.user.id }, populate: ['business', 'branch'],
    });
    if (!employee) return ctx.send({ success: true, data: [] });

    const where: any = { business: employee.business?.id, status: { $notIn: ['completed', 'cancelled'] } };

    let orders = await strapi.db.query('api::order.order').findMany({
      where, populate: ['table'], orderBy: { createdAt: 'desc' }, limit: 50,
    });

    if (employee.role === 'waiter') {
      const assignedTables = await strapi.db.query('api::table.table').findMany({
        where: { assigned_waiter: employee.id },
      });
      const tableIds = new Set(assignedTables.map((t) => t.id));
      orders = orders.filter((o) => o.table && tableIds.has(o.table.id));
    }

    ctx.send({
      success: true,
      data: orders.map((o) => ({
        orderId: o.id, orderNumber: o.order_number, status: o.status,
        items: o.items, total: o.total, subtotal: o.subtotal, notes: o.notes,
        table: o.table ? { id: o.table.id, table_number: o.table.table_number, table_name: o.table.table_name } : null,
        createdAt: o.createdAt,
      })),
    });
  },

  async getPendingWaiterCallsByDevice(ctx) {
    const { deviceId } = ctx.params;
    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device) return ctx.notFound('Device not found');
    if (!device.user) return ctx.badRequest('Device not associated with a user');

    const employee = await strapi.db.query('api::employee.employee').findOne({
      where: { user: device.user.id }, populate: ['business'],
    });
    if (!employee) return ctx.send({ success: true, data: [] });

    let calls = await strapi.db.query('api::waiter-call.waiter-call').findMany({
      where: { business: employee.business?.id, status: { $in: ['pending', 'acknowledged'] } },
      populate: ['table'], orderBy: { createdAt: 'asc' },
    });

    if (employee.role === 'waiter') {
      const assignedTables = await strapi.db.query('api::table.table').findMany({
        where: { assigned_waiter: employee.id },
      });
      const tableIds = new Set(assignedTables.map((t) => t.id));
      calls = calls.filter((c) => c.table && tableIds.has(c.table.id));
    }

    ctx.send({
      success: true,
      data: calls.map((c) => ({
        callId: c.id, message: c.message, status: c.status,
        table: c.table ? { id: c.table.id, table_number: c.table.table_number, table_name: c.table.table_name } : null,
        createdAt: c.createdAt,
      })),
    });
  },

  async acceptOrderByDevice(ctx) {
    const { deviceId } = ctx.params;
    const { orderId, status } = ctx.request.body;
    if (!orderId) return ctx.badRequest('orderId is required');

    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device || !device.user) return ctx.notFound('Device not found');

    const employee = await strapi.db.query('api::employee.employee').findOne({ where: { user: device.user.id } });
    if (!employee) return ctx.badRequest('No employee record for this device');

    const order = await strapi.db.query('api::order.order').update({
      where: { id: orderId },
      data: { status: status || 'accepted', waiter: employee.id },
    });

    socket.emit('orders_event', {
      type: 'update', data: { business_id: order.business, order_id: order.id, status: order.status },
    });

    ctx.send({ success: true, order: { id: order.id, status: order.status } });
  },

  async acknowledgeCallByDevice(ctx) {
    const { deviceId } = ctx.params;
    const { callId } = ctx.request.body;
    if (!callId) return ctx.badRequest('callId is required');

    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device || !device.user) return ctx.notFound('Device not found');

    const employee = await strapi.db.query('api::employee.employee').findOne({ where: { user: device.user.id } });
    if (!employee) return ctx.badRequest('No employee record for this device');

    const call = await strapi.db.query('api::waiter-call.waiter-call').update({
      where: { id: callId },
      data: { status: 'acknowledged', waiter: employee.id },
    });

    socket.emit('waiter_calls_event', {
      type: 'acknowledged', data: { business_id: call.business, id: call.id, status: 'acknowledged', waiter_id: employee.id },
    });

    ctx.send({ success: true });
  },
}));
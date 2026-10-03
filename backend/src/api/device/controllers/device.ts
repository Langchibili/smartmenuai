import { factories } from '@strapi/strapi';
import socket from '../../../services/socket-client';

export default factories.createCoreController('api::device.device', ({ strapi }) => ({

  async find(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const sanitizedQuery = await this.sanitizeQuery(ctx);
    sanitizedQuery.filters = {
      $and: [
        sanitizedQuery.filters || {},
        { user: { id: user.id } },
      ],
    };
    const { results, pagination } = await strapi.service('api::device.device').find(sanitizedQuery);
    return this.transformResponse(await this.sanitizeOutput(results, ctx), { pagination });
  },

  async findOne(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const entity = await strapi.db.query('api::device.device').findOne({
      where: { id, user: user.id },
    });
    if (!entity || String(entity.user?.id) !== String(user.id)) return ctx.notFound('Device not found');
    return this.transformResponse(await this.sanitizeOutput(entity, ctx));
  },

  async create(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const sanitizedInput = (await this.sanitizeInput(ctx.request.body, ctx)) as {
      data?: Record<string, unknown>;
    };
    const deviceId = sanitizedInput.data?.deviceId;
    if (typeof deviceId !== 'string' || !deviceId.trim()) return ctx.badRequest('deviceId is required');
    const existing = await strapi.db.query('api::device.device').findOne({
      where: { deviceId },
      populate: ['user'],
    });
    if (existing && String(existing.user?.id) !== String(user.id)) {
      return ctx.forbidden('Device is registered to another user');
    }
    const data = { ...(sanitizedInput.data || {}), user: user.id };
    const entity = existing
      ? await strapi.service('api::device.device').update(existing.id, { data })
      : await strapi.service('api::device.device').create({ data });
    return this.transformResponse(await this.sanitizeOutput(entity, ctx));
  },

  async update(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const sanitizedInput = (await this.sanitizeInput(ctx.request.body, ctx)) as {
      data?: Record<string, unknown>;
    };
    const existing = await strapi.db.query('api::device.device').findOne({
      where: { id },
      populate: ['user'],
    });
    if (!existing || String(existing.user?.id) !== String(user.id)) return ctx.notFound('Device not found');
    const data = { ...(sanitizedInput.data || {}) };
    delete data.user;
    const entity = await strapi.service('api::device.device').update(id, { data });
    return this.transformResponse(await this.sanitizeOutput(entity, ctx));
  },

  async delete(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const { id } = ctx.params;
    const existing = await strapi.db.query('api::device.device').findOne({
      where: { id },
      populate: ['user'],
    });
    if (!existing || String(existing.user?.id) !== String(user.id)) return ctx.notFound('Device not found');
    const entity = await strapi.service('api::device.device').delete(id);
    return this.transformResponse(await this.sanitizeOutput(entity, ctx));
  },

  async registerDevices(ctx) {
    const { userId, devices } = ctx.request.body;
    const authenticatedUser = ctx.state.user;
    if (!authenticatedUser) return ctx.unauthorized();
    if (String(authenticatedUser.id) !== String(userId)) return ctx.forbidden('Devices can only be registered to the authenticated user');
    if (!Array.isArray(devices)) return ctx.badRequest('Devices array is required');
    const user = await strapi.entityService.findOne('plugin::users-permissions.user', userId);
    if (!user) return ctx.notFound('User not found');

    const registered = [];
    for (const device of devices) {
      const { deviceId, notificationToken, deviceInfo, frontendName } = device;
      if (!deviceId) return ctx.badRequest('Each device must include a deviceId');
      const existing = await strapi.db.query('api::device.device').findOne({
        where: { deviceId },
        populate: ['user'],
      });
      const base = {
        ...(deviceInfo || {}), frontendName,
        lastSeen: new Date().toISOString(), active: true,
        updatedAt: new Date().toISOString(),
      };
      if (existing) {
        if (String(existing.user?.id) !== String(userId)) {
          return ctx.forbidden('Device is registered to another user');
        }
        const updated = await strapi.entityService.update('api::device.device', existing.id, {
          data: { notificationToken, deviceInfo: { ...((existing.deviceInfo as any) || {}), ...base }, user: userId },
        });
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: userId },
          data: { activeDevice: existing.id, devices: { connect: [existing.id] } },
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
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      if (
        !location ||
        !Number.isFinite(location.latitude) ||
        !Number.isFinite(location.longitude) ||
        Math.abs(location.latitude) > 90 ||
        Math.abs(location.longitude) > 180
      )
        return ctx.badRequest('Location with latitude/longitude required');

      const device = await strapi.db.query('api::device.device').findOne({
        where: { deviceId }, populate: ['user'],
      });
      if (!device) return ctx.notFound('Device not found');
      if (!device.user) return ctx.badRequest('Device is not associated with a user');
      if (String(device.user.id) !== String(user.id)) {
        return ctx.forbidden('Location can only be updated for your own device');
      }

      const locationDetails: any = {
        latitude: location.latitude,
        longitude: location.longitude,
        ...(location.accuracy !== undefined && { accuracy: location.accuracy }),
        ...(location.heading !== undefined && { heading: location.heading }),
        timestamp: location.timestamp && Number.isFinite(Number(location.timestamp))
          ? new Date(Number(location.timestamp)).toISOString()
          : new Date().toISOString(),
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
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (String(user.id) !== String(userId)) return ctx.forbidden();
    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device) return ctx.notFound('Device not found');
    if (!device.user || String(device.user.id) !== String(user.id)) return ctx.forbidden('Device does not belong to this user');
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
    const authenticatedUser = ctx.state.user;
    if (!authenticatedUser) return ctx.unauthorized();
    if (String(authenticatedUser.id) !== String(userId)) return ctx.forbidden();
    const targetUser = await strapi.db.query('plugin::users-permissions.user').findOne({ where: { id: userId } });
    if (!targetUser) return ctx.notFound('User not found');
    const devices = await strapi.db.query('api::device.device').findMany({ where: { user: userId } });
    ctx.send({ success: true, devices: devices || [] });
  },

  async removeDevice(ctx) {
    const { userId, deviceId } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (String(user.id) !== String(userId)) return ctx.forbidden();
    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device) return ctx.notFound('Device not found');
    if (!device.user || String(device.user.id) !== String(user.id)) return ctx.forbidden('Device does not belong to this user');
    await strapi.db.query('api::device.device').delete({ where: { id: device.id } });
    ctx.send({ success: true });
  },

  async checkDevicePermissions(ctx) {
    const { deviceId } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device) return ctx.notFound('Device not found');
    if (!device.user || String(device.user.id) !== String(user.id)) return ctx.forbidden();
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
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const device = await strapi.db.query('api::device.device').findOne({
      where: { deviceId }, populate: ['user'],
    });
    if (!device) return ctx.notFound('Device not found');
    if (!device.user) return ctx.badRequest('Device not associated with a user');
    if (String(device.user.id) !== String(user.id)) return ctx.forbidden();

    const employee = await strapi.db.query('api::employee.employee').findOne({
      where: { user: device.user.id }, populate: ['business', 'branch'],
    });
    if (!employee) return ctx.send({ success: true, data: [] });

    const where: any = { business: employee.business?.id, orderStatus: { $notIn: ['completed', 'cancelled'] } };
    if (employee.role === 'waiter') {
      where.$or = [
        { waiter: employee.id },
        { table: { assigned_waiter: employee.id } },
      ];
    } else if (employee.role === 'manager') {
      where.table = { branch: employee.branch?.id };
    }

    const orders = await strapi.db.query('api::order.order').findMany({
      where, populate: ['table'], orderBy: { createdAt: 'desc' }, limit: 50,
    });

    ctx.send({
      success: true,
      data: orders.map((o) => ({
        orderId: o.id, orderNumber: o.order_number, status: o.orderStatus,
        items: o.items, total: o.total, subtotal: o.subtotal, notes: o.notes,
        table: o.table ? { id: o.table.id, table_number: o.table.table_number, table_name: o.table.table_name } : null,
        createdAt: o.createdAt,
      })),
    });
  },

  async getPendingWaiterCallsByDevice(ctx) {
    const { deviceId } = ctx.params;
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device) return ctx.notFound('Device not found');
    if (!device.user) return ctx.badRequest('Device not associated with a user');
    if (String(device.user.id) !== String(user.id)) return ctx.forbidden();

    const employee = await strapi.db.query('api::employee.employee').findOne({
      where: { user: device.user.id }, populate: ['business', 'branch'],
    });
    if (!employee) return ctx.send({ success: true, data: [] });

    const where: any = {
      business: employee.business?.id,
      status: { $in: ['pending', 'acknowledged'] },
    };
    if (employee.role === 'waiter') {
      where.$or = [{ waiter: employee.id }, { waiter: null }];
    } else if (employee.role === 'manager') {
      where.table = { branch: employee.branch?.id };
    }
    const calls = await strapi.db.query('api::waiter-call.waiter-call').findMany({
      where,
      populate: ['table'], orderBy: { createdAt: 'asc' },
    });

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
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device || !device.user) return ctx.notFound('Device not found');
    if (String(device.user.id) !== String(user.id)) return ctx.forbidden();

    const employee = await strapi.db.query('api::employee.employee').findOne({
      where: { user: user.id, is_active: true },
      populate: { business: { populate: ['owner'] } },
    });
    if (!employee || !['owner', 'manager', 'waiter'].includes(employee.role)) return ctx.forbidden();
    const existingOrder = await strapi.db.query('api::order.order').findOne({
      where: { id: orderId, business: employee.business?.id },
      populate: ['table', 'business'],
    });
    if (!existingOrder) return ctx.notFound('Order not found');
    if (employee.role === 'waiter' && String(existingOrder.waiter?.id) !== String(employee.id)) return ctx.forbidden();
    if (!['accepted', 'preparing', 'served', 'completed', 'cancelled'].includes(status || 'accepted')) {
      return ctx.badRequest('Invalid order status');
    }

    const order = await strapi.db.query('api::order.order').update({
      where: { id: orderId },
      data: { orderStatus: status || 'accepted', ...(employee.role === 'waiter' ? { waiter: employee.id } : {}) },
    });

    ctx.send({ success: true, order: { id: order.id, status: order.orderStatus } });
  },

  async acknowledgeCallByDevice(ctx) {
    const { deviceId } = ctx.params;
    const { callId } = ctx.request.body;
    if (!callId) return ctx.badRequest('callId is required');
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();

    const device = await strapi.db.query('api::device.device').findOne({ where: { deviceId }, populate: ['user'] });
    if (!device || !device.user) return ctx.notFound('Device not found');
    if (String(device.user.id) !== String(user.id)) return ctx.forbidden();

    const employee = await strapi.db.query('api::employee.employee').findOne({
      where: { user: user.id, is_active: true },
      populate: { business: { populate: ['owner'] } },
    });
    if (!employee || employee.role !== 'waiter') return ctx.forbidden();
    const existingCall = await strapi.db.query('api::waiter-call.waiter-call').findOne({
      where: { id: callId, business: employee.business?.id },
      populate: ['waiter'],
    });
    if (!existingCall) return ctx.notFound('Waiter call not found');
    if (existingCall.waiter?.id && String(existingCall.waiter.id) !== String(employee.id)) return ctx.forbidden();
    if (!['pending', 'acknowledged'].includes(existingCall.status)) return ctx.badRequest('Waiter call is no longer active');

    const call = await strapi.db.query('api::waiter-call.waiter-call').update({
      where: { id: callId },
      data: { status: 'acknowledged', waiter: employee.id },
    });

    socket.emit('waiter_calls_event', {
      type: 'acknowledged',
      data: {
        business_id: employee.business?.id,
        id: call.id,
        callId: call.id,
        status: 'acknowledged',
        owner_id: employee.business?.owner?.id || null,
        waiter_id: user.id,
        assigned_waiter_id: user.id,
      },
    });

    ctx.send({ success: true });
  },
}));
import { factories } from '@strapi/strapi';
import socket from '../../../services/socket-client';

export default factories.createCoreController('api::waiter-call.waiter-call', ({ strapi }) => ({

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/callWaiter
  // { businessId, tableId, tableNumber?, waiterId?, message? }
  // Customer requests a waiter. Sets table status to 'needs_waiter' and emits
  // a socket event so all available waiters see the alert immediately.
  // ─────────────────────────────────────────────────────────────────────────────
  async callWaiter(ctx) {
    const { businessId, tableId, tableNumber, waiterId, message = '' } = ctx.request.body;
    if (!businessId || !tableId) return ctx.badRequest('businessId and tableId are required');

    const table = await strapi.db.query('api::table.table').findOne({
      where: { id: tableId, business: businessId },
      populate: { assigned_waiter: { populate: ['user'] }, branch: true },
    });
    if (!table) return ctx.badRequest('Table does not belong to this business');
    const business = await strapi.db.query('api::business.business').findOne({
      where: { id: businessId },
      populate: ['owner'],
    });
    if (!business) return ctx.notFound('Business not found');
    const platformSettings = await strapi.db.query('api::platform-admin.platform-admin').findOne({
      where: { role: 'platform_master', is_active: true },
      select: ['waiter_call_delay'],
    });
    const delayMinutes = Math.max(1, Number(platformSettings?.waiter_call_delay) || 1);
    const latestCall = await strapi.db.query('api::waiter-call.waiter-call').findMany({
      where: {
        table: tableId,
        business: businessId,
        $or: [{ request_type: 'waiter' }, { request_type: { $null: true } }],
      },
      select: ['createdAt'],
      orderBy: { createdAt: 'desc' },
      limit: 1,
    });
    const availableAt = latestCall[0]?.createdAt
      ? new Date(latestCall[0].createdAt).getTime() + delayMinutes * 60 * 1000
      : 0;
    const retryAfterSeconds = Math.max(0, Math.ceil((availableAt - Date.now()) / 1000));
    if (retryAfterSeconds > 0) {
      return ctx.send({
        success: false,
        retryAfterSeconds,
        message: 'Please wait before calling a waiter again.',
      });
    }
    const activeWaiters = await strapi.db.query('api::employee.employee').findMany({
      where: {
        business: businessId,
        role: 'waiter',
        is_active: true,
        ...(table.branch?.id ? { branch: table.branch.id } : {}),
      },
      populate: ['user'],
    });
    const selectedWaiter = waiterId
      ? activeWaiters.find((employee) => String(employee.id) === String(waiterId))
      : null;
    if (waiterId && !selectedWaiter) return ctx.badRequest('Waiter does not belong to this business');
    const assignedWaiter = selectedWaiter ||
      activeWaiters.find((employee) => String(employee.id) === String(table.assigned_waiter?.id)) ||
      null;
    const cleanMessage = typeof message === 'string' ? message.slice(0, 500) : '';

    const call = await strapi.db.query('api::waiter-call.waiter-call').create({
      data: {
        message: cleanMessage,
        request_type: 'waiter',
        status: 'pending',
        table: tableId,
        business: businessId,
        waiter: assignedWaiter?.id || null,
        publishedAt: new Date(),
      },
    });
    await strapi.db.query('api::table.table').update({ where: { id: tableId }, data: { status: 'needs_waiter' } });

    socket.emit('waiter_calls_event', {
      type: 'create',
      data: {
        id: call.id,
        callId: call.id,
        request_type: 'waiter',
        business_id: businessId,
        table_id: tableId,
        table_number: table.table_number || tableNumber,
        message: cleanMessage,
        status: 'pending',
        owner_id: business?.owner?.id || null,
        assigned_waiter_id: assignedWaiter?.user?.id || null,
        available_waiter_ids: activeWaiters.map((employee) => employee.user?.id).filter(Boolean),
      },
    });
    socket.emit('table_status_updated', {
      business_id: businessId,
      owner_id: business.owner?.id || null,
      waiter_id: assignedWaiter?.user?.id || null,
      table_id: tableId,
      table_number: table.table_number,
      status: 'needs_waiter',
    });

    ctx.send({ success: true, callId: call.id, cooldownSeconds: delayMinutes * 60 });
  },

  async requestBill(ctx) {
    const { orderId, customerInstallationId } = ctx.request.body || {};
    if (!orderId || typeof customerInstallationId !== 'string' ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(customerInstallationId)) {
      return ctx.badRequest('A valid order and customer installation are required');
    }

    const order = await strapi.db.query('api::order.order').findOne({
      where: {
        id: orderId,
        customer_installation_id: customerInstallationId,
        orderStatus: { $notIn: ['completed', 'cancelled'] },
      },
      populate: {
        business: { populate: ['owner'] },
        table: { populate: ['assigned_waiter', 'branch'] },
      },
    });
    if (!order?.table || !order.business) return ctx.notFound('Active customer order not found');

    const activeCall = await strapi.db.query('api::waiter-call.waiter-call').findMany({
      where: {
        table: order.table.id,
        business: order.business.id,
        request_type: 'bill',
        status: { $in: ['pending', 'acknowledged'] },
      },
      select: ['id'],
      limit: 1,
    });
    if (activeCall.length) return ctx.send({ success: true, alreadyRequested: true });

    const activeWaiters = await strapi.db.query('api::employee.employee').findMany({
      where: {
        business: order.business.id,
        role: 'waiter',
        is_active: true,
        ...(order.table.branch?.id ? { branch: order.table.branch.id } : {}),
      },
      populate: ['user'],
    });
    const assignedWaiter = activeWaiters.find(
      (employee) => String(employee.id) === String(order.table.assigned_waiter?.id)
    ) || null;
    const message = 'Customer requests the bill.';
    const call = await strapi.db.query('api::waiter-call.waiter-call').create({
      data: {
        message,
        request_type: 'bill',
        status: 'pending',
        table: order.table.id,
        business: order.business.id,
        waiter: assignedWaiter?.id || null,
        publishedAt: new Date(),
      },
    });

    await strapi.db.query('api::table.table').update({
      where: { id: order.table.id },
      data: { status: 'bill_requested' },
    });
    socket.emit('waiter_calls_event', {
      type: 'create',
      data: {
        id: call.id,
        callId: call.id,
        request_type: 'bill',
        business_id: order.business.id,
        table_id: order.table.id,
        table_number: order.table.table_number,
        message,
        status: 'pending',
        owner_id: order.business.owner?.id || null,
        assigned_waiter_id: assignedWaiter?.user?.id || null,
        available_waiter_ids: activeWaiters.map((employee) => employee.user?.id).filter(Boolean),
      },
    });
    socket.emit('table_status_updated', {
      business_id: order.business.id,
      owner_id: order.business.owner?.id || null,
      waiter_id: assignedWaiter?.user?.id || null,
      table_id: order.table.id,
      table_number: order.table.table_number,
      status: 'bill_requested',
    });
    ctx.send({ success: true, callId: call.id });
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/acknowledgeWaiterCall
  // { callId, waiterId }
  // Waiter claims a call. Status moves to 'acknowledged' so other waiters know
  // it is being handled.
  // ─────────────────────────────────────────────────────────────────────────────
  async acknowledgeWaiterCall(ctx) {
    try {
      const { callId, waiterId } = ctx.request.body;
      if (!callId) return ctx.badRequest('callId is required');

      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const details = await strapi.db.query('api::waiter-call.waiter-call').findOne({
        where: { id: callId },
        populate: {
          business: { populate: ['owner'] },
          waiter: { populate: ['user'] },
          table: { populate: ['branch'] },
        },
      });
      if (!details) return ctx.notFound('Waiter call not found');
      if (details.status !== 'pending' && details.status !== 'acknowledged') {
        return ctx.badRequest('Waiter call is no longer active');
      }
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: details.business?.id, is_active: true },
        populate: ['user', 'branch'],
      });
      if (!employee || !['owner', 'manager', 'waiter'].includes(employee.role)) return ctx.forbidden();
      if (employee.role !== 'owner' && String(employee.branch?.id) !== String(details.table?.branch?.id)) {
        return ctx.forbidden();
      }
      if (employee.role === 'waiter' && waiterId && String(waiterId) !== String(employee.id)) return ctx.forbidden();

      let assignedWaiter = employee.role === 'waiter' ? employee : null;
      if (waiterId && employee.role !== 'waiter') {
        assignedWaiter = await strapi.db.query('api::employee.employee').findOne({
          where: {
            id: waiterId,
            business: details.business?.id,
            role: 'waiter',
            is_active: true,
            ...(employee.role === 'manager' && employee.branch?.id ? { branch: employee.branch.id } : {}),
          },
          populate: ['user'],
        });
        if (!assignedWaiter) return ctx.badRequest('Waiter does not belong to this business');
      }
      if (employee.role === 'waiter' && details.waiter?.id && String(details.waiter.id) !== String(employee.id)) {
        return ctx.forbidden('This call has been assigned to another waiter');
      }

      const call = await strapi.db.query('api::waiter-call.waiter-call').update({
        where: { id: callId },
        data: { status: 'acknowledged', waiter: assignedWaiter?.id || details.waiter?.id || null },
      });

      socket.emit('waiter_calls_event', {
        type: 'acknowledged',
        data: {
          id: call.id,
          callId: call.id,
          business_id: details?.business?.id,
          owner_id: details?.business?.owner?.id || null,
          assigned_waiter_id: assignedWaiter?.user?.id || details?.waiter?.user?.id || null,
          waiter_id: assignedWaiter?.user?.id || details?.waiter?.user?.id || null,
          table_id: details?.table?.id,
          status: 'acknowledged',
        },
      });

      ctx.send({ success: true });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/resolveWaiterCall
  // { callId, tableId? }
  // Marks a call as completed and reverts table status back to 'occupied' (or
  // 'available' if there are no remaining active orders on that table).
  // ─────────────────────────────────────────────────────────────────────────────
  async resolveWaiterCall(ctx) {
    try {
      const { callId } = ctx.request.body;
      if (!callId) return ctx.badRequest('callId is required');

      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const call = await strapi.db.query('api::waiter-call.waiter-call').findOne({
        where: { id: callId },
        populate: {
          business: { populate: ['owner'] },
          waiter: { populate: ['user'] },
          table: { populate: ['branch'] },
        },
      });
      if (!call) return ctx.notFound('Waiter call not found');
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: call.business?.id, is_active: true },
        populate: ['user', 'branch'],
      });
      if (!employee || !['owner', 'manager', 'waiter'].includes(employee.role)) return ctx.forbidden();
      if (employee.role !== 'owner' && String(employee.branch?.id) !== String(call.table?.branch?.id)) {
        return ctx.forbidden();
      }
      if (employee.role === 'waiter' && call.waiter?.id && String(call.waiter.id) !== String(employee.id)) return ctx.forbidden();
      if (call.status !== 'pending' && call.status !== 'acknowledged') {
        return ctx.badRequest('Waiter call is no longer active');
      }
      await strapi.db.query('api::waiter-call.waiter-call').update({
        where: { id: callId },
        data: { status: 'completed' },
      });

      if (call.table?.id) {
        const activeOrders = await strapi.db.query('api::order.order').count({
          where: {
            table: call.table.id,
            orderStatus: { $notIn: ['completed', 'cancelled'] },
          },
        });
        const nextTableStatus = activeOrders > 0 ? 'occupied' : 'available';
        await strapi.db.query('api::table.table').update({
          where: { id: call.table.id },
          data: { status: nextTableStatus },
        });
        socket.emit('table_status_updated', {
          business_id: call.business?.id,
          owner_id: call.business?.owner?.id || null,
          waiter_id: call.waiter?.user?.id || null,
          table_id: call.table.id,
          table_number: call.table.table_number,
          status: nextTableStatus,
        });
      }

      socket.emit('waiter_calls_event', {
        type: 'resolved',
        data: {
          id: callId,
          callId,
          business_id: call.business?.id,
          owner_id: call.business?.owner?.id || null,
          waiter_id: call.waiter?.user?.id || null,
          table_id: call.table?.id,
          table_number: call.table?.table_number,
          status: 'completed',
        },
      });

      ctx.send({ success: true });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/getActiveWaiterCalls
  // { businessId, branchId? }
  // Returns all pending and acknowledged calls for the business — used by the
  // waiter alerts screen and manager dashboard.
  // ─────────────────────────────────────────────────────────────────────────────
  async getActiveWaiterCalls(ctx) {
    try {
      const { businessId } = ctx.request.body;
      if (!businessId) return ctx.badRequest('businessId is required');

      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: businessId, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager', 'waiter'].includes(employee.role)) return ctx.forbidden();
      const where: any = {
        business: businessId,
        status: { $in: ['pending', 'acknowledged'] },
      };
      if (employee.role === 'waiter') {
        where.$or = [{ waiter: employee.id }, { waiter: { id: { $null: true } } }];
      }
      if (employee.role === 'manager') {
        if (!employee.branch?.id) return ctx.forbidden();
        where.table = { branch: employee.branch.id };
      } else if (employee.role === 'waiter' && employee.branch?.id) {
        where.table = { branch: employee.branch.id };
      }
      const calls = await strapi.db.query('api::waiter-call.waiter-call').findMany({
        where,
        populate: ['table', 'waiter'],
        orderBy: { createdAt: 'asc' },
      });

      ctx.send({
        calls: calls.map((c) => ({
          id: c.id,
          message: c.message,
          request_type: c.request_type || 'waiter',
          status: c.status,
          table: c.table
            ? {
              id: c.table.id,
              table_number: c.table.table_number,
              table_name: c.table.table_name,
            }
            : null,
          waiter: c.waiter
            ? { id: c.waiter.id, full_name: c.waiter.full_name }
            : null,
          created_at: c.createdAt,
        })),
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/toggleWaiterAvailability
  // { employeeId, is_active }
  // Waiter toggles their shift on/off. When off, they won't receive new calls.
  // ─────────────────────────────────────────────────────────────────────────────
  async toggleWaiterAvailability(ctx) {
    try {
      const { employeeId, is_active } = ctx.request.body;
      if (!employeeId) return ctx.badRequest('employeeId is required');
      if (typeof is_active !== 'boolean') return ctx.badRequest('is_active must be a boolean');
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { id: employeeId, user: user.id, role: 'waiter' },
      });
      if (!employee) return ctx.forbidden();

      await strapi.db.query('api::employee.employee').update({
        where: { id: employee.id },
        data: { is_active },
      });

      ctx.send({ success: true });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/getWaiterDashboard
  // { employeeId, businessId }
  // Single call that returns everything a waiter needs: their assigned tables,
  // active waiter calls for the business, and their in-progress orders.
  // ─────────────────────────────────────────────────────────────────────────────
  async getWaiterDashboard(ctx) {
    try {
      const { employeeId, businessId } = ctx.request.body;
      if (!employeeId || !businessId) {
        return ctx.badRequest('employeeId and businessId are required');
      }
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { id: employeeId, user: user.id, business: businessId, is_active: true, role: 'waiter' },
        populate: ['branch'],
      });
      if (!employee) return ctx.forbidden();

      const [assignedTables, activeCalls, activeOrders] = await Promise.all([
        strapi.db.query('api::table.table').findMany({
          where: { assigned_waiter: employee.id, business: businessId },
          orderBy: { table_number: 'asc' },
        }),
        strapi.db.query('api::waiter-call.waiter-call').findMany({
          where: {
            business: businessId,
            status: { $in: ['pending', 'acknowledged'] },
            $or: [{ waiter: employee.id }, { waiter: { id: { $null: true } } }],
            ...(employee.branch?.id ? { table: { branch: employee.branch.id } } : {}),
          },
          populate: ['table'],
          orderBy: { createdAt: 'asc' },
        }),
        strapi.db.query('api::order.order').findMany({
          where: {
            business: businessId,
            waiter: employee.id,
            orderStatus: { $notIn: ['completed', 'cancelled'] },
            ...(employee.branch?.id ? { table: { branch: employee.branch.id } } : {}),
          },
          populate: ['table'],
          orderBy: { createdAt: 'desc' },
          limit: 20,
        }),
      ]);

      ctx.send({
        assignedTables: assignedTables.map((t) => ({
          id: t.id,
          table_number: t.table_number,
          table_name: t.table_name,
          status: t.status,
          capacity: t.capacity,
        })),
        activeCalls: activeCalls.map((c) => ({
          id: c.id,
          message: c.message,
          status: c.status,
          table: c.table
            ? { id: c.table.id, table_number: c.table.table_number }
            : null,
          created_at: c.createdAt,
        })),
        activeOrders: activeOrders.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          status: o.orderStatus,
          total: o.total,
          items: o.items,
          table: o.table
            ? { id: o.table.id, table_number: o.table.table_number }
            : null,
          created_at: o.createdAt,
        })),
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },
}));

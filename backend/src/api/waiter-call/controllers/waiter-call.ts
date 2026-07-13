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

    const call = await strapi.db.query('api::waiter-call.waiter-call').create({
      data: { message, status: 'pending', table: tableId, business: businessId, waiter: waiterId || null, publishedAt: new Date() },
    });
    await strapi.db.query('api::table.table').update({ where: { id: tableId }, data: { status: 'needs_waiter' } });

    const table = await strapi.db.query('api::table.table').findOne({ where: { id: tableId }, populate: ['assigned_waiter'] });
    const business = await strapi.db.query('api::business.business').findOne({ where: { id: businessId }, populate: ['owner'] });

    socket.emit('waiter_calls_event', {
      type: 'create',
      data: {
        id: call.id, business_id: businessId, table_id: tableId, table_number: tableNumber,
        message, status: 'pending',
        owner_id: business?.owner?.id || null,
        assigned_waiter_id: table?.assigned_waiter?.id || waiterId || null,
      },
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

      const call = await strapi.db.query('api::waiter-call.waiter-call').update({
        where: { id: callId },
        data: { status: 'acknowledged', waiter: waiterId || null },
      });

      socket.emit('waiter_calls_event', {
        type: 'acknowledged',
        data: { id: call.id, status: 'acknowledged', waiter_id: waiterId },
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
      const { callId, tableId } = ctx.request.body;
      if (!callId) return ctx.badRequest('callId is required');

      await strapi.db.query('api::waiter-call.waiter-call').update({
        where: { id: callId },
        data: { status: 'completed' },
      });

      if (tableId) {
        const activeOrders = await strapi.db.query('api::order.order').count({
          where: {
            table: tableId,
            status: { $notIn: ['completed', 'cancelled'] },
          },
        });
        await strapi.db.query('api::table.table').update({
          where: { id: tableId },
          data: { status: activeOrders > 0 ? 'occupied' : 'available' },
        });
      }

      socket.emit('waiter_calls_event', {
        type: 'resolved',
        data: { id: callId, status: 'completed' },
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

      const calls = await strapi.db.query('api::waiter-call.waiter-call').findMany({
        where: {
          business: businessId,
          status: { $in: ['pending', 'acknowledged'] },
        },
        populate: ['table', 'waiter'],
        orderBy: { createdAt: 'asc' },
      });

      ctx.send({
        calls: calls.map((c) => ({
          id: c.id,
          message: c.message,
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

      await strapi.db.query('api::employee.employee').update({
        where: { id: employeeId },
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

      const [assignedTables, activeCalls, activeOrders] = await Promise.all([
        strapi.db.query('api::table.table').findMany({
          where: { assigned_waiter: employeeId },
          orderBy: { table_number: 'asc' },
        }),
        strapi.db.query('api::waiter-call.waiter-call').findMany({
          where: {
            business: businessId,
            status: { $in: ['pending', 'acknowledged'] },
          },
          populate: ['table'],
          orderBy: { createdAt: 'asc' },
        }),
        strapi.db.query('api::order.order').findMany({
          where: {
            business: businessId,
            waiter: employeeId,
            status: { $notIn: ['completed', 'cancelled'] },
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
          status: o.status,
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

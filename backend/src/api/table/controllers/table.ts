import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::table.table', ({ strapi }) => ({

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/createBusinessTable
  // { businessId, branchId?, tableName?, tableNumber, capacity?, assignedWaiterId? }
  // Creates a single table and immediately generates + saves its QR menu URL.
  // If no branchId is supplied, finds or creates the business's first branch.
  // ─────────────────────────────────────────────────────────────────────────────
  async createBusinessTable(ctx) {
    try {
      const {
        businessId,
        branchId,
        tableName,
        tableNumber,
        capacity,
        assignedWaiterId,
      } = ctx.request.body;

      if (!businessId) return ctx.send({ success: false, error: 'businessId is required' });

      // Resolve branch
      let finalBranchId = branchId;
      if (!finalBranchId) {
        const existing = await strapi.db.query('api::branch.branch').findOne({
          where: { business: businessId },
        });
        if (existing) {
          finalBranchId = existing.id;
        } else {
          const branch = await strapi.db.query('api::branch.branch').create({
            data: {
              branch_name: 'Main Branch',
              business: businessId,
              is_active: true,
              publishedAt: new Date(),
            },
          });
          finalBranchId = branch.id;
        }
      }

      // Create the table record first to get its ID
      const table = await strapi.db.query('api::table.table').create({
        data: {
          table_name: tableName || `Table ${tableNumber}`,
          table_number: tableNumber,
          capacity: capacity || 4,
          status: 'available',
          business: businessId,
          branch: finalBranchId,
          assigned_waiter: assignedWaiterId || null,
          publishedAt: new Date(),
        },
      });

      // Build and save the QR / menu URL now that we have the real table ID
      const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const qrCodeUrl = `${appUrl}/m/${businessId}/${finalBranchId}/${table.id}`;

      await strapi.db.query('api::table.table').update({
        where: { id: table.id },
        data: { qr_code_url: qrCodeUrl },
      });

      ctx.send({
        success: true,
        table: {
          id: table.id,
          table_number: table.table_number,
          table_name: table.table_name,
          qr_code_url: qrCodeUrl,
        },
      });
    } catch (err) {
      ctx.send({ success: false, error: err.message });
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/getBusinessTables
  // { businessId, branchId? }
  // Returns all tables for a business (or a specific branch), ordered by number.
  // ─────────────────────────────────────────────────────────────────────────────
  async getBusinessTables(ctx) {
    try {
      const { businessId, branchId } = ctx.request.body;
      if (!businessId) return ctx.badRequest('businessId is required');

      const where: any = { business: businessId };
      if (branchId) where.branch = branchId;

      const tables = await strapi.db.query('api::table.table').findMany({
        where,
        populate: ['branch', 'assigned_waiter'],
        orderBy: { table_number: 'asc' },
      });

      ctx.send({
        tables: tables.map((t) => ({
          id: t.id,
          table_number: t.table_number,
          table_name: t.table_name,
          capacity: t.capacity,
          status: t.status,
          qr_code_url: t.qr_code_url,
          branch: t.branch
            ? { id: t.branch.id, branch_name: t.branch.branch_name }
            : null,
          assigned_waiter: t.assigned_waiter
            ? { id: t.assigned_waiter.id, full_name: t.assigned_waiter.full_name }
            : null,
        })),
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/updateTableStatus
  // { tableId, status }
  // Updates a table's status and emits a socket event so the live table board
  // updates in real time for all staff.
  // ─────────────────────────────────────────────────────────────────────────────
  async updateTableStatus(ctx) {
    try {
      const { tableId, status } = ctx.request.body;
      const validStatuses = [
        'available',
        'occupied',
        'needs_waiter',
        'ordering',
        'bill_requested',
      ];

      if (!tableId || !validStatuses.includes(status)) {
        return ctx.badRequest('tableId and a valid status are required');
      }

      await strapi.db.query('api::table.table').update({
        where: { id: tableId },
        data: { status },
      });

      try {
        const socket = require('../../../services/socket-client').default;
        socket.emit('table_status_updated', { tableId, status });
      } catch (_) {
        // Socket not critical — table status still updated in DB
      }

      ctx.send({ success: true });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/assignWaiterToTable
  // { tableId, waiterId }
  // Assigns (or unassigns when waiterId is null) a waiter to a table.
  // ─────────────────────────────────────────────────────────────────────────────
  async assignWaiterToTable(ctx) {
    try {
      const { tableId, waiterId } = ctx.request.body;
      if (!tableId) return ctx.badRequest('tableId is required');

      await strapi.db.query('api::table.table').update({
        where: { id: tableId },
        data: { assigned_waiter: waiterId || null },
      });

      ctx.send({ success: true });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },
}));

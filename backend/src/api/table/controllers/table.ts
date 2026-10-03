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

      if (!businessId) return ctx.badRequest('businessId is required');
      const parsedTableNumber = Number(tableNumber);
      const parsedCapacity = capacity === undefined || capacity === null || capacity === ''
        ? 4
        : Number(capacity);
      if (!Number.isInteger(parsedTableNumber) || parsedTableNumber < 1) {
        return ctx.badRequest('tableNumber must be a positive integer');
      }
      if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 100) {
        return ctx.badRequest('capacity must be an integer between 1 and 100');
      }
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: businessId, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();
      if (employee.role === 'manager' && !employee.branch?.id) return ctx.forbidden();

      // Resolve branch
      if (employee.role === 'manager' && branchId && String(branchId) !== String(employee.branch?.id)) {
        return ctx.forbidden();
      }
      let finalBranchId = employee.role === 'manager' ? employee.branch?.id : branchId;
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
      const branch = await strapi.db.query('api::branch.branch').findOne({
        where: { id: finalBranchId, business: businessId },
      });
      if (!branch) return ctx.badRequest('Branch does not belong to this business');

      if (assignedWaiterId) {
        const waiter = await strapi.db.query('api::employee.employee').findOne({
          where: {
            id: assignedWaiterId,
            business: businessId,
            branch: finalBranchId,
            role: 'waiter',
            is_active: true,
          },
        });
        if (!waiter) return ctx.badRequest('Assigned waiter does not belong to this branch');
      }

      const existingTable = await strapi.db.query('api::table.table').findOne({
        where: { table_number: parsedTableNumber, branch: finalBranchId },
      });
      if (existingTable) return ctx.badRequest('A table with this number already exists in the branch');

      // Create the table record first to get its ID
      const table = await strapi.db.query('api::table.table').create({
        data: {
          table_name: tableName || `Table ${parsedTableNumber}`,
          table_number: parsedTableNumber,
          capacity: parsedCapacity,
          status: 'available',
          business: businessId,
          branch: finalBranchId,
          assigned_waiter: assignedWaiterId || null,
          publishedAt: new Date(),
        },
      });

      // Build and save the QR / menu URL now that we have the real table ID
      const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3007').replace(/\/$/, '');
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
      ctx.throw(500, err.message);
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
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: businessId, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();

      const where: any = { business: businessId };
      if (employee.role === 'manager') {
        if (branchId && String(branchId) !== String(employee.branch?.id)) return ctx.forbidden();
        where.branch = employee.branch?.id;
      } else if (branchId) {
        where.branch = branchId;
      }

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

      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const table = await strapi.db.query('api::table.table').findOne({
        where: { id: tableId },
        populate: ['business', 'branch'],
      });
      if (!table) return ctx.notFound('Table not found');
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: table.business?.id, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();
      if (employee.role === 'manager' && String(employee.branch?.id) !== String(table.branch?.id)) {
        return ctx.forbidden();
      }

      await strapi.db.query('api::table.table').update({ where: { id: tableId }, data: { status } });

      try {
        const socket = require('../../../services/socket-client').default;
        const table = await strapi.db.query('api::table.table').findOne({
          where: { id: tableId },
          populate: {
            business: { populate: ['owner'] },
            assigned_waiter: { populate: ['user'] },
          },
        });
        socket.emit('table_status_updated', {
          business_id: table?.business?.id,
          owner_id: table?.business?.owner?.id || null,
          waiter_id: table?.assigned_waiter?.user?.id || null,
          table_id: tableId,
          table_number: table?.table_number,
          status,
        });
      } catch (error) {
        strapi.log.warn(`[Table status socket event] ${error.message}`);
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

      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const table = await strapi.db.query('api::table.table').findOne({
        where: { id: tableId },
        populate: ['business', 'branch'],
      });
      if (!table) return ctx.notFound('Table not found');
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: table.business?.id, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();
      if (employee.role === 'manager' && String(employee.branch?.id) !== String(table.branch?.id)) {
        return ctx.forbidden();
      }

      if (waiterId) {
        const waiter = await strapi.db.query('api::employee.employee').findOne({
          where: {
            id: waiterId,
            business: table.business?.id,
            role: 'waiter',
            is_active: true,
            ...(table.branch?.id ? { branch: table.branch.id } : {}),
          },
        });
        if (!waiter) return ctx.badRequest('Assigned waiter does not belong to this business');
      }

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

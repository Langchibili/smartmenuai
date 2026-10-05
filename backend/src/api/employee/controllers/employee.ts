/**
 * employee controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::employee.employee', ({ strapi }) => ({
  async getBusinessEmployees(ctx) {
    const { businessId, role, is_active: isActive } = ctx.request.body || {};
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!businessId) return ctx.badRequest('businessId is required');

    const owner = await strapi.db.query('api::employee.employee').findOne({
      where: { user: user.id, business: businessId, role: 'owner', is_active: true },
    });
    if (!owner) return ctx.forbidden();

    const allowedRoles = ['owner', 'manager', 'waiter'];
    if (role && !allowedRoles.includes(role)) return ctx.badRequest('Invalid employee role filter');
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      return ctx.badRequest('is_active filter must be a boolean');
    }
    const employees = await strapi.db.query('api::employee.employee').findMany({
      where: {
        business: businessId,
        ...(role ? { role } : {}),
        ...(isActive !== undefined ? { is_active: isActive } : {}),
      },
      populate: ['user', 'branch'],
      orderBy: { full_name: 'asc' },
    });

    ctx.send({
      data: employees.map((employee) => ({
        id: employee.id,
        full_name: employee.full_name,
        phone: employee.phone,
        role: employee.role,
        is_active: employee.is_active,
        permissions: employee.permissions,
        user: employee.user
          ? { id: employee.user.id, email: employee.user.email }
          : null,
        branch: employee.branch
          ? { id: employee.branch.id, branch_name: employee.branch.branch_name }
          : null,
      })),
    });
  },

  async updateBusinessEmployee(ctx) {
    const { businessId, employeeId, is_active: isActive } = ctx.request.body || {};
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized();
    if (!businessId || !employeeId || typeof isActive !== 'boolean') {
      return ctx.badRequest('businessId, employeeId, and boolean is_active are required');
    }

    const owner = await strapi.db.query('api::employee.employee').findOne({
      where: { user: user.id, business: businessId, role: 'owner', is_active: true },
    });
    if (!owner) return ctx.forbidden();

    const employee = await strapi.db.query('api::employee.employee').findOne({
      where: { id: employeeId, business: businessId },
    });
    if (!employee) return ctx.notFound('Employee not found in this business');
    if (employee.role === 'owner' && !isActive) {
      return ctx.badRequest('Owner accounts cannot be deactivated from employee management');
    }

    await strapi.db.query('api::employee.employee').update({
      where: { id: employeeId },
      data: { is_active: isActive },
    });

    ctx.send({ success: true, employee: { id: employeeId, is_active: isActive } });
  },
}));

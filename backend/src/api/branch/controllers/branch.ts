/**
 * branch controller
 */

import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::branch.branch', ({ strapi }) => ({
  async saveBusinessBranch(ctx) {
    try {
      const {
        businessId,
        branchId,
        branch_name,
        location = '',
        address = '',
        phone = '',
        countryId,
        cityId,
      } = ctx.request.body || {};
      if (!businessId || !branch_name?.trim() || !countryId || !cityId) {
        return ctx.badRequest('businessId, branch name, country, and city are required');
      }
      for (const [name, value, maxLength] of [
        ['branch name', branch_name, 150],
        ['location', location, 255],
        ['address', address, 500],
        ['phone', phone, 50],
      ]) {
        if (typeof value !== 'string' || value.length > maxLength) {
          return ctx.badRequest(`${name} must be a string no longer than ${maxLength} characters`);
        }
      }

      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Not authenticated');
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: businessId, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();
      if (employee.role === 'manager' && !employee.branch?.id) return ctx.forbidden();

      const country = await strapi.db.query('api::country.country').findOne({
        where: { id: countryId, isActive: true },
      });
      if (!country) return ctx.badRequest('Select a valid country');
      const city = await strapi.db.query('api::city.city').findOne({
        where: { id: cityId, country: country.id, isActive: true },
      });
      if (!city) return ctx.badRequest('Select a city in the chosen country');

      const branchData = {
        branch_name: branch_name.trim(),
        location: location.trim(),
        address: address.trim(),
        phone: phone.trim(),
        city: city.name,
        country_record: country.id,
        city_record: city.id,
      };
      let savedBranch;
      if (branchId) {
        const existingBranch = await strapi.db.query('api::branch.branch').findOne({
          where: { id: branchId, business: businessId },
        });
        if (!existingBranch) return ctx.notFound('Branch not found in this business');
        if (employee.role === 'manager' && String(employee.branch?.id) !== String(branchId)) {
          return ctx.forbidden();
        }
        savedBranch = await strapi.db.query('api::branch.branch').update({
          where: { id: existingBranch.id },
          data: branchData,
        });
      } else {
        savedBranch = await strapi.db.query('api::branch.branch').create({
          data: {
            ...branchData,
            business: businessId,
            is_active: true,
            publishedAt: new Date(),
          },
        });
      }

      const branch = await strapi.db.query('api::branch.branch').findOne({
        where: { id: savedBranch.id },
        populate: ['country_record', 'city_record'],
      });
      ctx.send({
        branch: {
          id: branch.id,
          branch_name: branch.branch_name,
          location: branch.location,
          address: branch.address,
          phone: branch.phone,
          city: branch.city_record?.name || branch.city,
          country_record: branch.country_record
            ? { id: branch.country_record.id, name: branch.country_record.name }
            : null,
          city_record: branch.city_record
            ? { id: branch.city_record.id, name: branch.city_record.name }
            : null,
        },
      });
    } catch (error) {
      strapi.log.error(`[saveBusinessBranch] ${error?.stack || error?.message || error}`);
      ctx.throw(500, 'Unable to save branch');
    }
  },
}));

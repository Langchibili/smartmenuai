import { factories } from '@strapi/strapi';
import { getAdminSettings } from '../../../utils/admin-settings';
import crypto from 'crypto';

export default factories.createCoreController('api::business.business', ({ strapi }) => ({

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/createBusinessWithBranchAndTables
  // Called by a newly registered business owner during onboarding step 2.
  // Creates: business → branch → N tables → owner employee record → updates profile.
  // ─────────────────────────────────────────────────────────────────────────────
  async createBusinessWithBranchAndTables(ctx) {
    try {
      const {
        businessName,
        businessType,
        logo,
        phone,
        address,
        countryId,
        cityId,
        currencyId,
        currency,
        planType,
        branchName,
        numberOfTables,
      } = ctx.request.body;

      if (!businessName) return ctx.badRequest('businessName is required');

      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();

      const countryRecord = await strapi.db.query('api::country.country').findOne({
        where: { id: countryId, isActive: true },
      });
      if (!countryRecord) return ctx.badRequest('Select a valid country');
      const cityRecord = await strapi.db.query('api::city.city').findOne({
        where: { id: cityId, country: countryRecord.id, isActive: true },
      });
      if (!cityRecord) return ctx.badRequest('Select a city in the chosen country');

      let currencyRecord = null;
      if (currencyId) {
        currencyRecord = await strapi.db.query('api::currency.currency').findOne({
          where: { id: currencyId, isActive: true },
        });
        if (!currencyRecord) return ctx.badRequest('Select an active currency');
      } else if (currency) {
        currencyRecord = await strapi.db.query('api::currency.currency').findOne({
          where: { code: String(currency).toUpperCase(), isActive: true },
        });
        if (!currencyRecord && String(currency).toUpperCase() !== 'ZMW') {
          return ctx.badRequest('Select an active currency');
        }
      } else {
        const adminSettings = await getAdminSettings(strapi);
        const defaultCurrencyId = adminSettings.default_currency?.id;
        currencyRecord = defaultCurrencyId
          ? await strapi.db.query('api::currency.currency').findOne({
              where: { id: defaultCurrencyId, isActive: true },
            })
          : null;
        if (!currencyRecord) {
          currencyRecord = await strapi.db.query('api::currency.currency').findOne({
            where: { code: 'ZMW', isActive: true },
          });
        }
      }

      // 1. Create business
      const business = await strapi.db.query('api::business.business').create({
        data: {
          business_name: businessName,
          business_type: businessType || 'restaurant',
          logo: logo || null,
          phone: phone || '',
          address: address || '',
          city: cityRecord.name,
          country: countryRecord.name,
          city_record: cityRecord.id,
          country_record: countryRecord.id,
          currency: currencyRecord?.code || 'ZMW',
          currency_record: currencyRecord?.id || null,
          plan_type: planType || 'basic',
          is_active: true,
          is_published: false,
          owner: user?.id || null,
          publishedAt: new Date(),
        },
      });

      // 2. Create default branch
      const branch = await strapi.db.query('api::branch.branch').create({
        data: {
          branch_name: branchName || 'Main Branch',
          business: business.id,
          city: cityRecord.name,
          country_record: countryRecord.id,
          city_record: cityRecord.id,
          address: address || '',
          is_active: true,
          publishedAt: new Date(),
        },
      });

      // 3. Create tables; the table lifecycle generates and attaches each QR image.
      const tableCount = Math.min(Math.max(parseInt(numberOfTables) || 1, 1), 100);

      for (let i = 1; i <= tableCount; i++) {
        await strapi.db.query('api::table.table').create({
          data: {
            table_name: `Table ${i}`,
            table_number: i,
            capacity: 4,
            status: 'available',
            business: business.id,
            branch: branch.id,
            publishedAt: new Date(),
          },
        });
      }

      // Create and attach the owner profile before its employee record.
      const profiles = strapi.db.query('api::user-profile.user-profile');
      const linkedUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['user_profile'],
      });
      let profile = linkedUser?.user_profile ||
        await profiles.findOne({ where: { user: user.id } });
      if (!profile) {
        profile = await profiles.create({
          data: {
            full_name: user.username || user.email || '',
            account_type: 'business_owner',
            onboarding_step: 0,
            onboarding_complete: false,
            must_change_password: false,
            is_platform_admin: false,
          },
        });
      }
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: user.id },
        data: { user_profile: profile.id },
      });

      // 4. Create owner employee record.
      if (user.id) {
        await strapi.db.query('api::employee.employee').create({
          data: {
            full_name: user.username || user.email || '',
            role: 'owner',
            is_active: true,
            permissions: {
              manage_menu: true,
              manage_orders: true,
              manage_employees: true,
              view_reports: true,
              manage_tables: true,
              manage_billing: true,
            },
            user: user.id,
            owner_profile: profile.id,
            business: business.id,
            branch: branch.id,
            publishedAt: new Date(),
          },
        });

        // 5. Advance onboarding step to 2 (business created).
        await profiles.update({
          where: { id: profile.id },
          data: {
            account_type: 'business_owner',
            onboarding_step: 2,
            onboarding_complete: false,
            business: business.id,
          },
        });
      }

      ctx.send({
        success: true,
        businessId: business.id,
        branchId: branch.id,
        tablesCreated: tableCount,
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/getMyBusiness
  // Returns the current user's business, employee record, and onboarding profile.
  // Used on every dashboard load to hydrate app state.
  // ─────────────────────────────────────────────────────────────────────────────
  async getMyBusiness(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Not authenticated');
      const { fullName, accountType } = ctx.request.body || {};
      const validAccountTypes = ['business_owner', 'employee'];

      let employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id },
        populate: {
          business: { populate: ['country_record', 'city_record'] },
          branch: { populate: ['country_record', 'city_record'] },
          owner_profile: true,
        },
      });

      const profiles = strapi.db.query('api::user-profile.user-profile');
      const linkedUser = await strapi.db.query('plugin::users-permissions.user').findOne({
        where: { id: user.id },
        populate: ['user_profile'],
      });
      let profile = linkedUser?.user_profile ||
        await profiles.findOne({ where: { user: user.id } });
      if (!profile) {
        profile = await profiles.create({
          data: {
            full_name: fullName || user.username || user.email || '',
            account_type: validAccountTypes.includes(accountType)
              ? accountType
              : employee ? 'employee' : 'business_owner',
            onboarding_step: 0,
            onboarding_complete: false,
            must_change_password: false,
            is_platform_admin: false,
          },
        });
      } else {
        const updates: Record<string, unknown> = {};
        if (fullName && !profile.full_name) updates.full_name = fullName;
        if (validAccountTypes.includes(accountType) && !profile.account_type) {
          updates.account_type = accountType;
        }
        if (Object.keys(updates).length) {
          profile = await profiles.update({
            where: { id: profile.id },
            data: updates,
          });
        }
      }

      if (String(linkedUser?.user_profile?.id || '') !== String(profile.id)) {
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: { user_profile: profile.id },
        });
      }

      if (!employee) {
        return ctx.send({
          business: null,
          employee: null,
          profile: {
            onboarding_step: profile.onboarding_step,
            onboarding_complete: profile.onboarding_complete,
            account_type: profile.account_type,
            must_change_password: profile.must_change_password,
            is_platform_admin: profile.is_platform_admin,
          },
        });
      }

      const business = await strapi.db.query('api::business.business').findOne({
        where: { id: employee.business?.id },
        populate: {
          logo: true,
          country_record: true,
          city_record: true,
          branches: { populate: ['country_record', 'city_record'] },
          currency_record: true,
        },
      });

      if (employee.role !== 'owner' && business?.id && !employee.owner_profile) {
        const ownerEmployee = await strapi.db.query('api::employee.employee').findOne({
          where: { business: business.id, role: 'owner' },
          populate: ['user'],
        });
        const ownerProfile = ownerEmployee?.user
          ? await profiles.findOne({ where: { user: ownerEmployee.user.id } })
          : null;
        if (ownerProfile) {
          await strapi.db.query('api::employee.employee').update({
            where: { id: employee.id },
            data: { owner_profile: ownerProfile.id },
          });
        }
      }

      if (employee.role === 'owner' && business?.id) {
        const businessEmployees = await strapi.db.query('api::employee.employee').findMany({
          where: { business: business.id },
          populate: ['owner_profile'],
        });
        await Promise.all(
          businessEmployees
            .filter((businessEmployee) => !businessEmployee.owner_profile)
            .map((businessEmployee) =>
              strapi.db.query('api::employee.employee').update({
                where: { id: businessEmployee.id },
                data: { owner_profile: profile.id },
              })
            )
        );
      }

      const adminSettings = await getAdminSettings(strapi);
      const businessTerminology = adminSettings.business_terminology?.[
        String(business?.business_type || '').toLocaleLowerCase()
      ] || {};

      ctx.send({
        business: business
          ? {
              id: business.id,
              business_name: business.business_name,
              business_type: business.business_type,
              terminology: businessTerminology,
              plan_type: business.plan_type,
              currency: business.currency_record?.code ||
                business.currency ||
                adminSettings.default_currency?.code ||
                'ZMW',
              currency_record: business.currency_record
                ? {
                    id: business.currency_record.id,
                    name: business.currency_record.name,
                    code: business.currency_record.code,
                    symbol: business.currency_record.symbol,
                  }
                : null,
              city: business.city,
              country: business.country,
              country_record: business.country_record
                ? { id: business.country_record.id, name: business.country_record.name, code: business.country_record.code }
                : null,
              city_record: business.city_record
                ? { id: business.city_record.id, name: business.city_record.name }
                : null,
              service_charge_percent: business.service_charge_percent,
              is_active: business.is_active,
              is_published: business.is_published,
              logo: business.logo?.url || null,
              branches: (business.branches || []).map((b) => ({
                id: b.id,
                branch_name: b.branch_name,
                address: b.address,
                city: b.city_record?.name || b.city || null,
                country: b.country_record?.name || null,
                country_record: b.country_record
                  ? { id: b.country_record.id, name: b.country_record.name, code: b.country_record.code }
                  : null,
                city_record: b.city_record
                  ? { id: b.city_record.id, name: b.city_record.name }
                  : null,
              })),
            }
          : null,
        employee: {
          id: employee.id,
          full_name: employee.full_name,
          role: employee.role,
          permissions: employee.permissions,
          branch_id: employee.branch?.id || null,
        },
        profile: profile
          ? {
              onboarding_step: profile.onboarding_step,
              onboarding_complete: profile.onboarding_complete,
              account_type: profile.account_type,
              must_change_password: profile.must_change_password,
              is_platform_admin: profile.is_platform_admin,
            }
          : null,
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/updateOnboardingStep
  // { step: number, complete?: boolean }
  // Frontend calls this after each onboarding step is finished.
  // ─────────────────────────────────────────────────────────────────────────────
  async updateOnboardingStep(ctx) {
    try {
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Not authenticated');

      const { step, complete } = ctx.request.body;

      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { user: user.id },
      });

      if (!profile) return ctx.notFound('User profile not found');

      await strapi.db.query('api::user-profile.user-profile').update({
        where: { id: profile.id },
        data: {
          onboarding_step: step ?? profile.onboarding_step,
          onboarding_complete: complete ?? profile.onboarding_complete,
        },
      });

      ctx.send({ success: true });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  async updateBusinessLocation(ctx) {
    try {
      const { businessId, countryId, cityId, address = '' } = ctx.request.body || {};
      if (!businessId || !countryId || !cityId) {
        return ctx.badRequest('businessId, countryId and cityId are required');
      }
      if (typeof address !== 'string' || address.length > 500) {
        return ctx.badRequest('address must be a string no longer than 500 characters');
      }
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Not authenticated');
      const owner = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: businessId, role: 'owner', is_active: true },
      });
      if (!owner) return ctx.forbidden();
      const country = await strapi.db.query('api::country.country').findOne({
        where: { id: countryId, isActive: true },
      });
      if (!country) return ctx.badRequest('Select a valid country');
      const city = await strapi.db.query('api::city.city').findOne({
        where: { id: cityId, country: country.id, isActive: true },
      });
      if (!city) return ctx.badRequest('Select a city in the chosen country');

      await strapi.db.query('api::business.business').update({
        where: { id: businessId },
        data: {
          country: country.name,
          city: city.name,
          country_record: country.id,
          city_record: city.id,
          address: address.trim(),
        },
      });
      ctx.send({
        success: true,
        country: { id: country.id, name: country.name, code: country.code },
        city: { id: city.id, name: city.name },
        address: address.trim(),
      });
    } catch (err) {
      strapi.log.error(`[updateBusinessLocation] ${err?.stack || err?.message || err}`);
      ctx.throw(500, 'Unable to update business location');
    }
  },

  async updateBusinessCurrency(ctx) {
    try {
      const { businessId, currencyId } = ctx.request.body || {};
      if (!businessId || !currencyId) {
        return ctx.badRequest('businessId and currencyId are required');
      }
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Not authenticated');
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: businessId, is_active: true },
      });
      if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();
      const currency = await strapi.db.query('api::currency.currency').findOne({
        where: { id: currencyId, isActive: true },
      });
      if (!currency) return ctx.badRequest('Select an active currency');

      await strapi.db.query('api::business.business').update({
        where: { id: businessId },
        data: { currency: currency.code, currency_record: currency.id },
      });
      ctx.send({
        success: true,
        currency: {
          id: currency.id,
          name: currency.name,
          code: currency.code,
          symbol: currency.symbol,
        },
      });
    } catch (err) {
      strapi.log.error(`[updateBusinessCurrency] ${err?.stack || err?.message || err}`);
      ctx.throw(500, 'Unable to update business currency');
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/getBusinessReports
  // { businessId, dateFrom?, dateTo? }
  // Returns summary stats + top items + orders-by-day chart data.
  // ─────────────────────────────────────────────────────────────────────────────
  async getBusinessReports(ctx) {
    try {
      const { businessId, dateFrom, dateTo } = ctx.request.body;
      if (!businessId) return ctx.badRequest('businessId is required');

      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Not authenticated');
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: businessId, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();
      if (employee.role === 'manager' && !employee.branch?.id) return ctx.forbidden();

      const dateFilter: any = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);

      const ordersWhere: any = { business: businessId };
      if (employee.role === 'manager') {
        ordersWhere.table = { branch: employee.branch.id };
      }
      if (Object.keys(dateFilter).length) ordersWhere.createdAt = dateFilter;

      const [allOrders, completedOrders, cancelledOrders] = await Promise.all([
        strapi.db.query('api::order.order').findMany({ where: ordersWhere }),
        strapi.db.query('api::order.order').findMany({
          where: { ...ordersWhere, orderStatus: 'completed' },
        }),
        strapi.db.query('api::order.order').findMany({
          where: { ...ordersWhere, orderStatus: 'cancelled' },
        }),
      ]);

      const totalRevenue = completedOrders.reduce((s, o) => s + (o.total || 0), 0);
      const avgOrderValue =
        completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;

      // Top selling items
      const itemCounts: Record<string, { name: string; count: number; revenue: number }> = {};
      for (const order of completedOrders) {
        for (const item of order.items || []) {
          if (!itemCounts[item.name]) {
            itemCounts[item.name] = { name: item.name, count: 0, revenue: 0 };
          }
          itemCounts[item.name].count += item.quantity || 1;
          itemCounts[item.name].revenue += (item.price || 0) * (item.quantity || 1);
        }
      }
      const topItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Orders by day for chart
      const ordersByDay: Record<string, number> = {};
      for (const order of allOrders) {
        const day = new Date(order.createdAt).toISOString().slice(0, 10);
        ordersByDay[day] = (ordersByDay[day] || 0) + 1;
      }

      // Revenue by day for chart
      const revenueByDay: Record<string, number> = {};
      for (const order of completedOrders) {
        const day = new Date(order.createdAt).toISOString().slice(0, 10);
        revenueByDay[day] = +(((revenueByDay[day] || 0) + (order.total || 0)).toFixed(2));
      }

      ctx.send({
        summary: {
          totalOrders: allOrders.length,
          completedOrders: completedOrders.length,
          cancelledOrders: cancelledOrders.length,
          pendingOrders: allOrders.length - completedOrders.length - cancelledOrders.length,
          totalRevenue: +totalRevenue.toFixed(2),
          avgOrderValue: +avgOrderValue.toFixed(2),
        },
        topItems,
        ordersByDay,
        revenueByDay,
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },
}));

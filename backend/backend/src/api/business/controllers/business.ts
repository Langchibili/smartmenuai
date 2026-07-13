import { factories } from '@strapi/strapi';
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
        city,
        country,
        currency,
        planType,
        branchName,
        numberOfTables,
      } = ctx.request.body;

      if (!businessName) return ctx.badRequest('businessName is required');

      const user = ctx.state.user;

      // 1. Create business
      const business = await strapi.db.query('api::business.business').create({
        data: {
          business_name: businessName,
          business_type: businessType || 'restaurant',
          logo: logo || null,
          phone: phone || '',
          address: address || '',
          city: city || '',
          country: country || '',
          currency: currency || 'USD',
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
          is_active: true,
          publishedAt: new Date(),
        },
      });

      // 3. Create tables and generate QR URLs
      const tableCount = Math.min(Math.max(parseInt(numberOfTables) || 1, 1), 100);
      const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      for (let i = 1; i <= tableCount; i++) {
        const table = await strapi.db.query('api::table.table').create({
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
        // Save the QR menu URL now that we have the table ID
        await strapi.db.query('api::table.table').update({
          where: { id: table.id },
          data: { qr_code_url: `${appUrl}/m/${business.id}/${branch.id}/${table.id}` },
        });
      }

      // 4. Create owner employee record
      if (user?.id) {
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
            business: business.id,
            branch: branch.id,
            publishedAt: new Date(),
          },
        });

        // 5. Advance onboarding step to 2 (business created)
        const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
          where: { user: user.id },
        });
        if (profile) {
          await strapi.db.query('api::user-profile.user-profile').update({
            where: { id: profile.id },
            data: { onboarding_step: 2, business: business.id },
          });
        }
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

      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id },
        populate: ['business', 'branch'],
      });

      if (!employee) {
        return ctx.send({ business: null, employee: null, profile: null });
      }

      const business = await strapi.db.query('api::business.business').findOne({
        where: { id: employee.business?.id },
        populate: ['logo', 'branches'],
      });

      const profile = await strapi.db.query('api::user-profile.user-profile').findOne({
        where: { user: user.id },
      });

      ctx.send({
        business: business
          ? {
              id: business.id,
              business_name: business.business_name,
              business_type: business.business_type,
              plan_type: business.plan_type,
              currency: business.currency,
              city: business.city,
              country: business.country,
              service_charge_percent: business.service_charge_percent,
              is_active: business.is_active,
              is_published: business.is_published,
              logo: business.logo?.url || null,
              branches: (business.branches || []).map((b) => ({
                id: b.id,
                branch_name: b.branch_name,
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

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/getBusinessReports
  // { businessId, dateFrom?, dateTo? }
  // Returns summary stats + top items + orders-by-day chart data.
  // ─────────────────────────────────────────────────────────────────────────────
  async getBusinessReports(ctx) {
    try {
      const { businessId, dateFrom, dateTo } = ctx.request.body;
      if (!businessId) return ctx.badRequest('businessId is required');

      const dateFilter: any = {};
      if (dateFrom) dateFilter.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.$lte = new Date(dateTo);

      const ordersWhere: any = { business: businessId };
      if (Object.keys(dateFilter).length) ordersWhere.createdAt = dateFilter;

      const [allOrders, completedOrders, cancelledOrders] = await Promise.all([
        strapi.db.query('api::order.order').findMany({ where: ordersWhere }),
        strapi.db.query('api::order.order').findMany({
          where: { ...ordersWhere, status: 'completed' },
        }),
        strapi.db.query('api::order.order').findMany({
          where: { ...ordersWhere, status: 'cancelled' },
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

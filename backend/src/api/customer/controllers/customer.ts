import { factories } from '@strapi/strapi';

const isInstallationId = (value) =>
  typeof value === 'string' && /^[a-zA-Z0-9_-]{16,128}$/.test(value);

const countryTokens = (country) =>
  [country?.code, country?.name]
    .filter(Boolean)
    .map((value) => String(value).trim().toLocaleLowerCase());

const mapOrder = (order) => {
  const business = order.business;
  const branch = order.table?.branch;
  return {
    id: order.id,
    order_number: order.order_number,
    numeric_order_number: order.numeric_order_number,
    status: order.orderStatus,
    payment_status: order.payment_status,
    items: order.items || [],
    menu_snapshot: order.menu_snapshot || null,
    subtotal: order.subtotal,
    service_charge: order.service_charge,
    total: order.total,
    notes: order.notes,
    created_date: order.createdAt,
    table: order.table
      ? {
          id: order.table.id,
          table_number: order.table.table_number,
          branch_id: branch?.id || null,
        }
      : null,
    branch: branch
      ? {
          id: branch.id,
          branch_name: branch.branch_name,
          address: branch.address,
          city: branch.city_record?.name || branch.city || null,
        }
      : null,
    business: business
      ? {
          id: business.id,
          business_name: business.business_name,
          address: business.address,
          city: business.city_record?.name || business.city || null,
          country: business.country_record?.name || business.country || null,
          currency: business.currency,
        }
      : null,
  };
};

export default factories.createCoreController('api::customer.customer', ({ strapi }) => ({
  async getCustomerHistory(ctx) {
    const { customerInstallationId } = ctx.request.body || {};
    if (!isInstallationId(customerInstallationId)) {
      return ctx.badRequest('A valid customer installation ID is required');
    }

    try {
      const orders = await strapi.db.query('api::order.order').findMany({
        where: { customer_installation_id: customerInstallationId },
        populate: {
          business: { populate: ['country_record', 'city_record'] },
          table: { populate: { branch: { populate: ['country_record', 'city_record'] } } },
        },
        orderBy: { createdAt: 'desc' },
        limit: 100,
      });
      ctx.send({ orders: orders.map(mapOrder) });
    } catch (err) {
      strapi.log.error(`[getCustomerHistory] ${err?.stack || err?.message || err}`);
      ctx.throw(500, 'Unable to load customer history');
    }
  },

  async getCustomerOrder(ctx) {
    const { customerInstallationId, numericOrderNumber } = ctx.request.body || {};
    const number = Number(numericOrderNumber);
    if (!isInstallationId(customerInstallationId)) {
      return ctx.badRequest('A valid customer installation ID is required');
    }
    if (!Number.isInteger(number) || number < 10000 || number > 99999) {
      return ctx.badRequest('A 5-digit order number is required');
    }

    try {
      const orders = await strapi.db.query('api::order.order').findMany({
        where: {
          customer_installation_id: customerInstallationId,
          numeric_order_number: number,
          orderStatus: { $notIn: ['completed', 'cancelled'] },
        },
        populate: {
          business: { populate: ['country_record', 'city_record'] },
          table: { populate: { branch: { populate: ['country_record', 'city_record'] } } },
        },
        orderBy: { createdAt: 'desc' },
        limit: 1,
      });
      ctx.send({ order: orders[0] ? mapOrder(orders[0]) : null });
    } catch (err) {
      strapi.log.error(`[getCustomerOrder] ${err?.stack || err?.message || err}`);
      ctx.throw(500, 'Unable to look up customer order');
    }
  },

  async getDealAndPromos(ctx) {
    const { businessId, customerInstallationId } = ctx.request.body || {};
    if (!businessId) return ctx.badRequest('businessId is required');
    if (!isInstallationId(customerInstallationId)) {
      return ctx.badRequest('A valid customer installation ID is required');
    }

    try {
      const [currentBusiness, orders, promotions] = await Promise.all([
        strapi.db.query('api::business.business').findOne({
          where: { id: businessId, is_active: true },
          populate: ['country_record', 'city_record'],
        }),
        strapi.db.query('api::order.order').findMany({
          where: { customer_installation_id: customerInstallationId },
          select: ['items'],
          orderBy: { createdAt: 'desc' },
          limit: 100,
        }),
        strapi.db.query('api::promotion.promotion').findMany({
          where: { is_active: true },
          populate: {
            image: true,
            business: { populate: ['country_record', 'city_record'] },
            branch: { populate: ['country_record', 'city_record'] },
            applicable_items: true,
          },
          orderBy: { createdAt: 'desc' },
          limit: 500,
        }),
      ]);

      if (!currentBusiness) return ctx.notFound('Business not found');
      const currentCountry = new Set([
        ...countryTokens(currentBusiness.country_record),
        ...countryTokens({ name: currentBusiness.country }),
      ]);
      if (!currentCountry.size) return ctx.send({ deals: [] });

      const today = new Date().toISOString().slice(0, 10);
      const itemCounts = new Map();
      for (const order of orders) {
        for (const item of order.items || []) {
          itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + Number(item.quantity || 0));
        }
      }
      const favoriteItems = new Set(
        [...itemCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name.toLocaleLowerCase())
      );

      const deals = promotions
        .filter((promotion) => {
          if (!promotion.business?.is_active || String(promotion.business.id) === String(businessId)) return false;
          if (promotion.start_date && promotion.start_date > today) return false;
          if (promotion.end_date && promotion.end_date < today) return false;
          const promotionCountry = new Set([
            ...countryTokens(promotion.business.country_record),
            ...countryTokens({ name: promotion.business.country }),
          ]);
          return [...promotionCountry].some((token) => currentCountry.has(token));
        })
        .map((promotion) => {
          const matchingItems = (promotion.applicable_items || [])
            .filter((item) => favoriteItems.has(String(item.name).toLocaleLowerCase()));
          const business = promotion.business;
          const branch = promotion.branch;
          return {
            id: promotion.id,
            title: promotion.title,
            description: promotion.description,
            type: promotion.type,
            start_date: promotion.start_date,
            end_date: promotion.end_date,
            image: promotion.image?.url || null,
            relevance_score: matchingItems.length,
            relevance: matchingItems.length ? 'Matches items you often order' : null,
            business: {
              id: business.id,
              business_name: business.business_name,
              address: branch?.address || business.address || null,
              city: branch?.city_record?.name || branch?.city || business.city_record?.name || business.city || null,
              country: business.country_record?.name || business.country || null,
              country_code: business.country_record?.code || null,
            },
            branch: branch
              ? {
                  id: branch.id,
                  branch_name: branch.branch_name,
                  address: branch.address,
                  city: branch.city_record?.name || branch.city || null,
                }
              : null,
          };
        })
        .sort((a, b) => b.relevance_score - a.relevance_score);

      ctx.send({ deals });
    } catch (err) {
      strapi.log.error(`[getDealAndPromos] ${err?.stack || err?.message || err}`);
      ctx.throw(500, 'Unable to load deals and promotions');
    }
  },

  async getBusinessCustomerAnalytics(ctx) {
    const { businessId, dateFrom, dateTo } = ctx.request.body || {};
    if (!businessId) return ctx.badRequest('businessId is required');
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Not authenticated');

    try {
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: businessId, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();
      if (employee.role === 'manager' && !employee.branch?.id) return ctx.forbidden();

      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.$gte = new Date(dateFrom);
      if (dateTo) createdAt.$lte = new Date(dateTo);
      const where: any = { business: businessId };
      if (employee.role === 'manager') where.table = { branch: employee.branch.id };
      if (Object.keys(createdAt).length) where.createdAt = createdAt;

      const orders = await strapi.db.query('api::order.order').findMany({
        where,
        select: ['customer_installation_id', 'items'],
      });
      const customers = new Map();
      const itemCounts = new Map();
      for (const order of orders) {
        if (order.customer_installation_id) {
          customers.set(
            order.customer_installation_id,
            (customers.get(order.customer_installation_id) || 0) + 1
          );
        }
        for (const item of order.items || []) {
          const current = itemCounts.get(item.name) || { name: item.name, orders: 0, quantity: 0 };
          current.orders += 1;
          current.quantity += Number(item.quantity || 0);
          itemCounts.set(item.name, current);
        }
      }

      const customerCounts = [...customers.values()];
      const repeatCustomers = customerCounts.filter((count) => count > 1).length;
      const topItems = [...itemCounts.values()]
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      ctx.send({
        totalOrders: orders.length,
        knownCustomers: customerCounts.length,
        repeatCustomers,
        repeatCustomerRate: customerCounts.length
          ? Number((repeatCustomers / customerCounts.length).toFixed(4))
          : 0,
        topItems,
      });
    } catch (err) {
      strapi.log.error(`[getBusinessCustomerAnalytics] ${err?.stack || err?.message || err}`);
      ctx.throw(500, 'Unable to load customer analytics');
    }
  },
}));

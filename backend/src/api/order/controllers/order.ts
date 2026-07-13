import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::order.order', ({ strapi }) => ({

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/getPublicMenu
  // { businessId, tableId? }
  // Public — no auth. Returns everything the customer menu page needs in one call:
  // business info, table info, menu settings, categories, items (with variants &
  // modifiers), and active promotions.
  // ─────────────────────────────────────────────────────────────────────────────
  async getPublicMenu(ctx) {
    try {
      const { businessId, tableId } = ctx.request.body;
      if (!businessId) return ctx.badRequest('businessId is required');

      const [business, table, menuSettings, categories, items, promotions] = await Promise.all([
        strapi.db.query('api::business.business').findOne({
          where: { id: businessId },
          populate: ['logo'],
        }),
        tableId
          ? strapi.db.query('api::table.table').findOne({
              where: { id: tableId },
              populate: ['assigned_waiter', 'branch'],
            })
          : Promise.resolve(null),
        strapi.db.query('api::business-menu-setting.business-menu-setting').findOne({
          where: { business: businessId },
          populate: ['cover_image_url'],
        }),
        strapi.db.query('api::menu-category.menu-category').findMany({
          where: { business: businessId, is_active: true },
          orderBy: { sort_order: 'asc' },
        }),
        strapi.db.query('api::menu-item.menu-item').findMany({
          where: { business: businessId, is_available: true },
          populate: ['image', 'menu_category', 'variants', 'modifiers'],
        }),
        strapi.db.query('api::promotion.promotion').findMany({
          where: { business: businessId, is_active: true },
          populate: ['image'],
        }),
      ]);

      if (!business) return ctx.notFound('Business not found');

      ctx.send({
        business: {
          id: business.id,
          business_name: business.business_name,
          business_type: business.business_type,
          plan_type: business.plan_type,
          currency: business.currency,
          city: business.city,
          country: business.country,
          service_charge_percent: business.service_charge_percent || 0,
          logo: business.logo?.url || null,
        },
        table: table
          ? {
              id: table.id,
              table_number: table.table_number,
              table_name: table.table_name,
              status: table.status,
              capacity: table.capacity,
              branch_id: table.branch?.id || null,
              assigned_waiter_id: table.assigned_waiter?.id || null,
              assigned_waiter_name: table.assigned_waiter?.full_name || null,
            }
          : null,
        menuSettings: menuSettings
          ? {
              theme_style: menuSettings.theme_style,
              layout_style: menuSettings.layout_style,
              header_style: menuSettings.header_style,
              category_style: menuSettings.category_style,
              product_card_style: menuSettings.product_card_style,
              primary_color: menuSettings.primary_color,
              accent_color: menuSettings.accent_color,
              button_color: menuSettings.button_color,
              text_color: menuSettings.text_color,
              background_color: menuSettings.background_color,
              card_color: menuSettings.card_color,
              show_hero: menuSettings.show_hero,
              hero_text: menuSettings.hero_text,
              welcome_message: menuSettings.welcome_message,
              promo_text: menuSettings.promo_text,
              display_name: menuSettings.display_name,
              tagline: menuSettings.tagline,
              opening_hours: menuSettings.opening_hours,
              location_text: menuSettings.location_text,
              cover_image_url: menuSettings.cover_image_url?.url || null,
              show_ai_recommendations: menuSettings.show_ai_recommendations,
            }
          : null,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          sort_order: c.sort_order,
        })),
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          description: i.description,
          price: i.price,
          image: i.image?.url || null,
          is_available: i.is_available,
          is_popular: i.is_popular,
          is_featured: i.is_featured,
          is_special_offer: i.is_special_offer,
          is_sponsored: i.is_sponsored,
          preparation_time: i.preparation_time,
          tags: i.tags,
          category_id: i.menu_category?.id || null,
          variants: (i.variants || [])
            .filter((v) => v.is_active)
            .map((v) => ({ id: v.id, name: v.name, price: v.price })),
          modifiers: (i.modifiers || [])
            .filter((m) => m.is_active)
            .map((m) => ({
              id: m.id,
              name: m.name,
              price: m.price,
              is_required: m.is_required,
            })),
        })),
        promotions: promotions.map((p) => ({
          id: p.id,
          title: p.title,
          description: p.description,
          type: p.type,
          image: p.image?.url || null,
          start_time: p.start_time,
          end_time: p.end_time,
          start_date: p.start_date,
          end_date: p.end_date,
        })),
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/getClientOrders
  // { customerSessionId }
  // Public — returns all orders for the current customer session (tab tracker).
  // ─────────────────────────────────────────────────────────────────────────────
  async getClientOrders(ctx) {
    try {
      const { customerSessionId } = ctx.request.body;
      if (!customerSessionId) return ctx.send({ orders: [] });

      const orders = await strapi.db.query('api::order.order').findMany({
        where: { customer_session_id: customerSessionId },
        orderBy: { createdAt: 'desc' },
        limit: 50,
      });

      ctx.send({
        orders: orders.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          status: o.status,
          payment_status: o.payment_status,
          items: o.items,
          subtotal: o.subtotal,
          service_charge: o.service_charge,
          total: o.total,
          notes: o.notes,
          created_date: o.createdAt,
        })),
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/placeOrder
  // { businessId, tableId, tableNumber?, waiterId?, customerSessionId, items[], notes? }
  // Public — customer places an order. Calculates service charge, generates order
  // number, updates table status to 'ordering'.
  // ─────────────────────────────────────────────────────────────────────────────
  async placeOrder(ctx) {
    try {
      const {
        businessId,
        tableId,
        waiterId,
        customerSessionId,
        items = [],
        notes = '',
      } = ctx.request.body;

      if (!businessId || !tableId || !items.length) {
        return ctx.badRequest('businessId, tableId and items are required');
      }

      const subtotal = items.reduce((s, i) => s + (i.price * i.quantity), 0);
      const business = await strapi.db.query('api::business.business').findOne({
        where: { id: businessId },
      });
      const serviceChargePercent = business?.service_charge_percent || 0;
      const serviceCharge = +(subtotal * (serviceChargePercent / 100)).toFixed(2);
      const total = +(subtotal + serviceCharge).toFixed(2);
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      const order = await strapi.db.query('api::order.order').create({
        data: {
          order_number: orderNumber,
          status: 'pending',
          payment_status: 'unpaid',
          subtotal,
          service_charge: serviceCharge,
          total,
          notes,
          customer_session_id: customerSessionId,
          items: items.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            notes: i.notes || '',
            status: 'pending',
            variant_name: i.variant_name || null,
            modifiers: i.modifiers || [],
          })),
          table: tableId,
          business: businessId,
          waiter: waiterId || null,
          publishedAt: new Date(),
        },
      });

      // Move table into 'ordering' state
      await strapi.db.query('api::table.table').update({
        where: { id: tableId },
        data: { status: 'ordering' },
      });

      ctx.send({ success: true, order: { id: order.id, order_number: order.order_number } });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/updateOrderStatus
  // { orderId, status, waiterId? }
  // Used by waiters and managers to advance an order through its lifecycle.
  // When an order reaches 'completed' or 'cancelled', frees the table if no
  // other active orders remain on it.
  // ─────────────────────────────────────────────────────────────────────────────
  async updateOrderStatus(ctx) {
    try {
      const { orderId, status, waiterId } = ctx.request.body;
      const validStatuses = ['pending', 'accepted', 'preparing', 'served', 'completed', 'cancelled'];

      if (!orderId || !validStatuses.includes(status)) {
        return ctx.badRequest('orderId and a valid status are required');
      }

      const updateData: any = { status };
      if (waiterId) updateData.waiter = waiterId;

      const order = await strapi.db.query('api::order.order').update({
        where: { id: orderId },
        data: updateData,
        populate: ['table'],
      });

      // Free the table when all orders on it are done
      if (['completed', 'cancelled'].includes(status) && order.table?.id) {
        const activeOrders = await strapi.db.query('api::order.order').count({
          where: {
            table: order.table.id,
            status: { $notIn: ['completed', 'cancelled'] },
            id: { $ne: orderId },
          },
        });

        if (activeOrders === 0) {
          await strapi.db.query('api::table.table').update({
            where: { id: order.table.id },
            data: { status: 'available' },
          });
        }
      }

      ctx.send({ success: true, order: { id: order.id, status: order.status } });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /custom-functions/getBusinessOrders
  // { businessId, branchId?, status?, limit? }
  // Used by owner/manager/waiter dashboards to list orders.
  // ─────────────────────────────────────────────────────────────────────────────
  async getBusinessOrders(ctx) {
    try {
      const { businessId, branchId, status, limit = 50 } = ctx.request.body;
      if (!businessId) return ctx.badRequest('businessId is required');

      const where: any = { business: businessId };
      if (status) where.status = status;
      // branchId filtering via table relation is not directly supported in findMany;
      // fetch and filter in memory when branchId is provided.

      const orders = await strapi.db.query('api::order.order').findMany({
        where,
        populate: ['table', 'waiter'],
        orderBy: { createdAt: 'desc' },
        limit: Math.min(limit, 200),
      });

      const filtered = branchId
        ? orders.filter((o) => String(o.table?.branch) === String(branchId))
        : orders;

      ctx.send({
        orders: filtered.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          status: o.status,
          payment_status: o.payment_status,
          items: o.items,
          subtotal: o.subtotal,
          service_charge: o.service_charge,
          total: o.total,
          notes: o.notes,
          customer_session_id: o.customer_session_id,
          table: o.table
            ? {
                id: o.table.id,
                table_number: o.table.table_number,
                table_name: o.table.table_name,
              }
            : null,
          waiter: o.waiter
            ? { id: o.waiter.id, full_name: o.waiter.full_name }
            : null,
          created_date: o.createdAt,
        })),
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },
}));

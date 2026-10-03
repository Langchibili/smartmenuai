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
      const { businessId, tableId, branchId } = ctx.request.body;
      if (!businessId) return ctx.badRequest('businessId is required');

      const [business, table, menuSettings, categories, items, promotions] = await Promise.all([
        strapi.db.query('api::business.business').findOne({
          where: { id: businessId },
          populate: ['logo'],
        }),
        tableId
          ? strapi.db.query('api::table.table').findOne({
              where: { id: tableId },
              populate: ['assigned_waiter', 'branch', 'business'],
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
      if (tableId && (
        !table ||
        String(table.business?.id || table.business) !== String(businessId) ||
        (branchId && String(table.branch?.id || table.branch) !== String(branchId))
      )) {
        return ctx.notFound('Table not found for this business');
      }

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
          status: o.orderStatus,
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
        customerSessionId,
        items = [],
        notes = '',
      } = ctx.request.body;

      if (!businessId || !tableId || !items.length) {
        return ctx.badRequest('businessId, tableId and items are required');
      }

      const table = await strapi.db.query('api::table.table').findOne({
        where: { id: tableId, business: businessId },
        populate: { assigned_waiter: { populate: ['user'] } },
      });
      if (!table) return ctx.badRequest('Table does not belong to this business');
      const business = await strapi.db.query('api::business.business').findOne({
        where: { id: businessId },
        populate: ['owner'],
      });
      if (!business) return ctx.notFound('Business not found');

      const normalizedItems = [];
      for (const item of items) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
          return ctx.badRequest('Each item quantity must be between 1 and 50');
        }
        const menuItem = await strapi.db.query('api::menu-item.menu-item').findOne({
          where: { id: item.id, business: businessId, is_available: true },
        });
        if (!menuItem) return ctx.badRequest('An item is unavailable or does not belong to this business');
        normalizedItems.push({
          id: menuItem.id,
          name: menuItem.name,
          quantity,
          price: Number(menuItem.price),
          notes: typeof item.notes === 'string' ? item.notes.slice(0, 500) : '',
        });
      }

      const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const serviceChargePercent = business?.service_charge_percent || 0;
      const serviceCharge = +(subtotal * (serviceChargePercent / 100)).toFixed(2);
      const total = +(subtotal + serviceCharge).toFixed(2);
      const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

      const order = await strapi.entityService.create('api::order.order', {
        data: {
          order_number: orderNumber,
          orderStatus: 'pending',
          payment_status: 'unpaid',
          subtotal,
          service_charge: serviceCharge,
          total,
          notes,
          customer_session_id: customerSessionId,
          items: normalizedItems.map((item) => ({
            menu_item: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            notes: item.notes,
            status: 'pending' as const,
          })),
          table: tableId,
          business: businessId,
          waiter: table.assigned_waiter?.id || null,
          publishedAt: new Date(),
        },
      });

      // Move table into 'ordering' state
      await strapi.db.query('api::table.table').update({
        where: { id: tableId },
        data: { status: 'ordering' },
      });
      const socket = require('../../../services/socket-client').default;
      socket.emit('table_status_updated', {
        business_id: businessId,
        owner_id: business?.owner?.id || null,
        waiter_id: table.assigned_waiter?.user?.id || null,
        table_id: tableId,
        table_number: table.table_number,
        status: 'ordering',
      });

      ctx.send({ success: true, order: { id: order.id, order_number: order.order_number } });
    } catch (err) {
      strapi.log.error(`[placeOrder] ${err?.stack || err?.message || err}`);
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

      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const existingOrder = await strapi.db.query('api::order.order').findOne({
        where: { id: orderId },
        populate: {
          business: { populate: ['owner'] },
          waiter: { populate: ['user'] },
          table: { populate: ['branch'] },
        },
      });
      if (!existingOrder) return ctx.notFound('Order not found');
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: existingOrder.business?.id, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager', 'waiter'].includes(employee.role)) return ctx.forbidden();
      if (
        employee.role === 'manager' &&
        String(employee.branch?.id) !== String(existingOrder.table?.branch?.id)
      ) return ctx.forbidden();
      if (employee.role === 'waiter' && existingOrder.waiter?.id !== employee.id) return ctx.forbidden();

      const updateData: any = { orderStatus: status };
      if (employee.role === 'waiter') updateData.waiter = employee.id;
      else if (waiterId) {
        const assignedWaiter = await strapi.db.query('api::employee.employee').findOne({
          where: {
            id: waiterId,
            business: existingOrder.business.id,
            role: 'waiter',
            is_active: true,
            ...(employee.role === 'manager' && employee.branch?.id ? { branch: employee.branch.id } : {}),
          },
        });
        if (!assignedWaiter) return ctx.badRequest('Waiter does not belong to this business');
        updateData.waiter = assignedWaiter.id;
      }

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
            orderStatus: { $notIn: ['completed', 'cancelled'] },
            id: { $ne: orderId },
          },
        });

        if (activeOrders === 0) {
          await strapi.db.query('api::table.table').update({
            where: { id: order.table.id },
            data: { status: 'available' },
          });
          const table = await strapi.db.query('api::table.table').findOne({
            where: { id: order.table.id },
            populate: {
              business: { populate: ['owner'] },
              assigned_waiter: { populate: ['user'] },
            },
          });
          const socket = require('../../../services/socket-client').default;
          socket.emit('table_status_updated', {
            business_id: table?.business?.id,
            owner_id: table?.business?.owner?.id || null,
            waiter_id: table?.assigned_waiter?.user?.id || null,
            table_id: table?.id,
            table_number: table?.table_number,
            status: 'available',
          });
        }
      }

      ctx.send({ success: true, order: { id: order.id, status: order.orderStatus } });
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
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: businessId, is_active: true },
        populate: ['branch'],
      });
      if (!employee || !['owner', 'manager', 'waiter'].includes(employee.role)) return ctx.forbidden();
      if (employee.role === 'manager') {
        if (branchId && String(branchId) !== String(employee.branch?.id)) return ctx.forbidden();
      }

      const where: any = { business: businessId };
      if (employee.role === 'waiter') where.waiter = employee.id;
      if (status) where.orderStatus = status;
      if (employee.role === 'manager') where.table = { branch: employee.branch?.id };
      else if (branchId) where.table = { branch: branchId };

      const orders = await strapi.db.query('api::order.order').findMany({
        where,
        populate: {
          table: { populate: ['branch'] },
          waiter: { populate: ['user'] },
        },
        orderBy: { createdAt: 'desc' },
        limit: Math.min(limit, 200),
      });

      ctx.send({
        orders: orders.map((o) => ({
          id: o.id,
          order_number: o.order_number,
          status: o.orderStatus,
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

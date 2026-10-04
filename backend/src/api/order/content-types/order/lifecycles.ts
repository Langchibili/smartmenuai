export default {
  async afterCreate(event: any) {
    const { result } = event;
    const strapi = (global as any).strapi;
    try {
      const order = await strapi.db.query('api::order.order').findOne({
        where: { id: result.id },
        populate: {
          business: { populate: ['owner'] },
          table: { populate: { assigned_waiter: { populate: ['user'] } } },
          waiter: { populate: ['user'] },
          items: { populate: ['menu_item'] },
        },
      });
      if (!order) return;

      const socket = require('../../../../services/socket-client').default;
      socket.emit('orders_event', {
        type: 'create',
        data: {
          id: order.id,
          business_id: order.business?.id,
          table_id: order.table?.id,
          order_id: order.id,
          order_number: order.order_number,
          numeric_order_number: order.numeric_order_number,
          status: order.orderStatus,
          total: order.total,
          items: order.items || [],
          notes: order.notes || '',
          item_count: (order.items || []).reduce((count, item) => count + Number(item.quantity || 0), 0),
          owner_id: order.business?.owner?.id || null,
          waiter_id: order.waiter?.user?.id || order.table?.assigned_waiter?.user?.id || null,
          table_number: order.table?.table_number || null,
          created_at: order.createdAt,
        },
      });

      await strapi.db.query('api::activity-log.activity-log').create({
        data: {
          action: 'order_created', target_type: 'order', target_id: String(order.id),
          metadata: { order_number: order.order_number, total: order.total },
          business: order.business?.id || null, publishedAt: new Date(),
        },
      });
    } catch (err) {
      strapi.log.warn(`[Order Lifecycle afterCreate] ${err.message}`);
    }
  },

  async afterUpdate(event: any) {
    const { result, params } = event;
    const strapi = (global as any).strapi;
    if (!params.data?.orderStatus) return;
    try {
      const order = await strapi.db.query('api::order.order').findOne({
        where: { id: result.id },
        populate: {
          business: { populate: ['owner'] },
          waiter: { populate: ['user'] },
          table: true,
        },
      });
      if (!order) return;
      const socket = require('../../../../services/socket-client').default;
      socket.emit('orders_event', {
        type: 'update',
        data: {
          id: order.id,
          business_id: order.business?.id,
          table_id: order.table?.id,
          table_number: order.table?.table_number,
          order_id: order.id,
          order_number: order.order_number,
          numeric_order_number: order.numeric_order_number,
          status: order.orderStatus,
          owner_id: order.business?.owner?.id || null,
          waiter_id: order?.waiter?.user?.id || null,
        },
      });
    } catch (err) {
      strapi.log.warn(`[Order Lifecycle afterUpdate] ${err.message}`);
    }
  },
};
export default {
  async afterCreate(event: any) {
    const { result } = event;
    const strapi = (global as any).strapi;
    try {
      const business = await strapi.db.query('api::business.business').findOne({
        where: { id: result.business }, populate: ['owner'],
      });
      const table = result.table
        ? await strapi.db.query('api::table.table').findOne({ where: { id: result.table }, populate: ['assigned_waiter'] })
        : null;

      const socket = require('../../../../services/socket-client').default;
      socket.emit('orders_event', {
        type: 'create',
        data: {
          business_id: result.business,
          table_id: result.table,
          order_id: result.id,
          order_number: result.order_number,
          status: result.status,
          total: result.total,
          item_count: (result.items || []).length,
          owner_id: business?.owner?.id || null,
          waiter_id: table?.assigned_waiter?.id || null,
          table_number: table?.table_number || null,
        },
      });

      await strapi.db.query('api::activity-log.activity-log').create({
        data: {
          action: 'order_created', target_type: 'order', target_id: String(result.id),
          metadata: { order_number: result.order_number, total: result.total },
          business: result.business || null, publishedAt: new Date(),
        },
      });
    } catch (err) {
      strapi.log.warn(`[Order Lifecycle afterCreate] ${err.message}`);
    }
  },

  async afterUpdate(event: any) {
    const { result, params } = event;
    const strapi = (global as any).strapi;
    if (!params.data?.status) return;
    try {
      const business = await strapi.db.query('api::business.business').findOne({
        where: { id: result.business }, populate: ['owner'],
      });
      const socket = require('../../../../services/socket-client').default;
      socket.emit('orders_event', {
        type: 'update',
        data: {
          business_id: result.business, order_id: result.id,
          order_number: result.order_number, status: result.status,
          owner_id: business?.owner?.id || null,
        },
      });
    } catch (err) {
      strapi.log.warn(`[Order Lifecycle afterUpdate] ${err.message}`);
    }
  },
};
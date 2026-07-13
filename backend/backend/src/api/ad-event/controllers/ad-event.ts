import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::ad-event.ad-event', ({ strapi }) => ({
  async create(ctx) {
    const response = await super.create(ctx);
    const { ad_campaign_id, event_type } = ctx.request.body.data || ctx.request.body || {};
    if (ad_campaign_id && (event_type === 'impression' || event_type === 'click')) {
      const field = event_type === 'impression' ? 'impressions' : 'clicks';
      const campaign = await strapi.db.query('api::ad-campaign.ad-campaign').findOne({ where: { id: ad_campaign_id } });
      if (campaign) {
        await strapi.db.query('api::ad-campaign.ad-campaign').update({
          where: { id: ad_campaign_id },
          data: { [field]: (campaign[field] || 0) + 1 },
        });
      }
    }
    return response;
  },
}));


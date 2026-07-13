import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::ad-campaign.ad-campaign', ({ strapi }) => ({

  // POST /custom-functions/getAdCampaigns
  // { placementKey, businessId, planType, city, country, businessType }
  async getAdCampaigns(ctx) {
    try {
      const { placementKey, businessId, planType, city, country, businessType } = ctx.request.body;
      const today = new Date().toISOString().slice(0, 10);

      let adSettings = null;
      if (businessId) {
        adSettings = await strapi.db.query('api::business-ad-setting.business-ad-setting').findOne({
          where: { business: businessId },
        });
      }

      const platform = await strapi.db.query('api::ad-campaign.ad-campaign').findMany({
        where: { campaign_type: 'platform_direct', status: 'active', placement: placementKey },
        populate: ['image_url', 'video_url', 'mobile_image_url', 'mobile_video_url', 'tablet_image_url', 'tablet_video_url', 'desktop_image_url', 'desktop_video_url'],
        orderBy: { priority: 'asc' },
      });

      const business = businessId
        ? await strapi.db.query('api::ad-campaign.ad-campaign').findMany({
            where: { campaign_type: 'business_own', status: 'active', placement: placementKey, business: businessId },
            populate: ['image_url', 'video_url', 'mobile_image_url', 'mobile_video_url', 'tablet_image_url', 'tablet_video_url', 'desktop_image_url', 'desktop_video_url'],
            orderBy: { priority: 'asc' },
          })
        : [];

      const isActive = (c) => {
        if (c.start_date && c.start_date > today) return false;
        if (c.end_date && c.end_date < today) return false;
        if (c.target_plan_types?.length && planType && !c.target_plan_types.includes(planType)) return false;
        if (c.target_countries?.length && country && !c.target_countries.includes(country)) return false;
        if (c.target_cities?.length && city && !c.target_cities.includes(city)) return false;
        if (c.target_business_types?.length && businessType && !c.target_business_types.includes(businessType)) return false;
        return true;
      };

      let chosen = [];
      let mode = 'platform_ads';
      const rejected = [];

      if (adSettings?.platform_admin_override) {
        mode = adSettings.ad_mode;
        if (mode === 'no_ads') chosen = [];
        else if (mode === 'platform_ads') chosen = platform.filter(isActive);
        else if (mode === 'business_ads_only') chosen = business.filter(isActive);
        else if (mode === 'mixed_ads') chosen = [...platform, ...business].filter(isActive);
      } else if (adSettings?.force_platform_ads) {
        chosen = platform.filter(isActive);
      } else if (!planType || planType === 'basic') {
        chosen = platform.filter(isActive);
        if (chosen.length === 0) chosen = business.filter(isActive);
      } else {
        mode = adSettings?.ad_mode || 'no_ads';
        if (mode === 'business_ads_only') chosen = business.filter(isActive);
        else if (mode === 'platform_ads') chosen = platform.filter(isActive);
        else if (mode === 'mixed_ads') chosen = [...platform, ...business].filter(isActive);
      }

      const mediaUrl = (m) => m?.url || null;
      const mapped = chosen.map(c => ({
        id: c.id,
        campaign_name: c.campaign_name,
        title: c.title,
        description: c.description,
        cta_text: c.cta_text,
        cta_link: c.cta_link,
        image_url: mediaUrl(c.image_url),
        video_url: mediaUrl(c.video_url),
        mobile_image_url: mediaUrl(c.mobile_image_url),
        mobile_video_url: mediaUrl(c.mobile_video_url),
        tablet_image_url: mediaUrl(c.tablet_image_url),
        tablet_video_url: mediaUrl(c.tablet_video_url),
        desktop_image_url: mediaUrl(c.desktop_image_url),
        desktop_video_url: mediaUrl(c.desktop_video_url),
        impressions: c.impressions,
        clicks: c.clicks,
      }));

      ctx.send({
        campaigns: mapped,
        useAdSense: false,
        debug: { adMode: mode, total_fetched: platform.length + business.length, total_matched: mapped.length, rejected },
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

}));


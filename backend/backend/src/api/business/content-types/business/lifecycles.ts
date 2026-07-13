// api/business/content-types/business/lifecycles.ts
// Automatically creates default BusinessMenuSetting and BusinessAdSetting
// every time a new Business is created, so the frontend never has to check
// whether these records exist before reading them.

export default {
  async afterCreate(event: any) {
    const { result } = event;
    const strapi = (global as any).strapi;

    try {
      await strapi.db.query('api::business-menu-setting.business-menu-setting').create({
        data: {
          business: result.id,
          theme_style: 'modern_dark',
          layout_style: 'classic_list',
          header_style: 'floating_glass',
          category_style: 'rounded_pills',
          product_card_style: 'large_image',
          show_hero: true,
          show_ai_recommendations: true,
          status: 'draft',
          publishedAt: new Date(),
        },
      });
    } catch (err) {
      strapi.log.error(
        `[Business Lifecycle] Failed to create menu settings for business ${result.id}: ${err.message}`
      );
    }

    try {
      await strapi.db.query('api::business-ad-setting.business-ad-setting').create({
        data: {
          business: result.id,
          ad_mode: 'platform_ads',
          platform_admin_override: false,
          force_platform_ads: false,
          allow_google_adsense: false,
          publishedAt: new Date(),
        },
      });
    } catch (err) {
      strapi.log.error(
        `[Business Lifecycle] Failed to create ad settings for business ${result.id}: ${err.message}`
      );
    }

    strapi.log.info(
      `[Business Lifecycle] Auto-provisioned settings for business ${result.id} ("${result.business_name}")`
    );
  },
};

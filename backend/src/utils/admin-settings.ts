const DEFAULT_ADMIN_SETTINGS = {
  waiter_call_delay: 1,
  request_bill_delay: 1,
  business_terminology: {
    bar: {
      menu: 'drinks',
      waiter: 'atteindant',
    },
  },
};

export async function getAdminSettings(strapi: any) {
  const settings = await strapi.db.query('api::admn-setting.admn-setting').findOne({
    where: {},
  });
  return {
    ...DEFAULT_ADMIN_SETTINGS,
    ...settings,
    business_terminology: settings?.business_terminology || DEFAULT_ADMIN_SETTINGS.business_terminology,
  };
}

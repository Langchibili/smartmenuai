const DEFAULT_ADMIN_SETTINGS = {
  waiter_call_delay: 1,
  request_bill_delay: 1,
  default_currency: {
    name: 'Zambian Kwacha',
    code: 'ZMW',
    symbol: 'K',
  },
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
    populate: ['default_currency'],
  });
  return {
    ...DEFAULT_ADMIN_SETTINGS,
    ...settings,
    default_currency: settings?.default_currency || DEFAULT_ADMIN_SETTINGS.default_currency,
    business_terminology: settings?.business_terminology || DEFAULT_ADMIN_SETTINGS.business_terminology,
  };
}

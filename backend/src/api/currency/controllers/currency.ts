import { factories } from '@strapi/strapi';
import { getAdminSettings } from '../../../utils/admin-settings';

export default factories.createCoreController('api::currency.currency', ({ strapi }) => ({
  async getActiveCurrencies(ctx) {
    try {
      const currencies = await strapi.db.query('api::currency.currency').findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: ['id', 'name', 'code', 'symbol', 'exchangeRate'],
      });
      const settings = await getAdminSettings(strapi);
      ctx.send({
        currencies,
        defaultCurrency: settings.default_currency
          ? {
              id: settings.default_currency.id || null,
              name: settings.default_currency.name,
              code: settings.default_currency.code,
              symbol: settings.default_currency.symbol,
            }
          : null,
      });
    } catch (error) {
      strapi.log.error(`[getActiveCurrencies] ${error?.stack || error?.message || error}`);
      ctx.throw(500, 'Unable to load currency options');
    }
  },
}));

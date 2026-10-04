import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::country.country', ({ strapi }) => ({
  async getLocationCatalog(ctx) {
    try {
      const { countryId, search } = ctx.request.body || {};
      const countries = await strapi.db.query('api::country.country').findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: ['id', 'name', 'code', 'phoneCode'],
      });

      let cities = [];
      if (countryId) {
        const where: any = { country: countryId, isActive: true };
        if (typeof search === 'string' && search.trim()) {
          where.name = { $containsi: search.trim().slice(0, 100) };
        }
        cities = await strapi.db.query('api::city.city').findMany({
          where,
          orderBy: { name: 'asc' },
          limit: 100,
          select: ['id', 'name', 'population'],
        });
      }

      ctx.send({ countries, cities });
    } catch (err) {
      strapi.log.error(`[getLocationCatalog] ${err?.stack || err?.message || err}`);
      ctx.throw(500, 'Unable to load country and city options');
    }
  },
}));

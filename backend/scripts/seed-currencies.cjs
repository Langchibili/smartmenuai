const { createStrapi } = require('@strapi/strapi');

const currencies = [
  { name: 'United States Dollar', code: 'USD', symbol: '$' },
  { name: 'Euro', code: 'EUR', symbol: '€' },
  { name: 'British Pound Sterling', code: 'GBP', symbol: '£' },
  { name: 'Japanese Yen', code: 'JPY', symbol: '¥' },
  { name: 'Chinese Yuan Renminbi', code: 'CNY', symbol: '¥' },
  { name: 'Australian Dollar', code: 'AUD', symbol: 'A$' },
  { name: 'Canadian Dollar', code: 'CAD', symbol: 'C$' },
  { name: 'Swiss Franc', code: 'CHF', symbol: 'CHF' },
  { name: 'Indian Rupee', code: 'INR', symbol: '₹' },
  { name: 'South African Rand', code: 'ZAR', symbol: 'R' },
  { name: 'Zambian Kwacha', code: 'ZMW', symbol: 'K' },
];

async function seedCurrencies() {
  const strapi = await createStrapi({ distDir: 'dist' }).load();
  try {
    const currencyQuery = strapi.db.query('api::currency.currency');
    const existing = await currencyQuery.findMany({
      select: ['id', 'name', 'code', 'symbol'],
    });
    const existingByCode = new Map(
      existing.map((currency) => [String(currency.code).toUpperCase(), currency])
    );
    let inserted = 0;

    await strapi.db.transaction(async () => {
      for (const currency of currencies) {
        const record = existingByCode.get(currency.code);
        if (record) {
          if (record.name !== currency.name || record.symbol !== currency.symbol) {
            strapi.log.warn(
              `[currency seeder] Preserving existing ${currency.code} record (${record.name}, ${record.symbol}).`
            );
          }
          continue;
        }
        await currencyQuery.create({
          data: { ...currency, exchangeRate: 1, isActive: true },
        });
        inserted += 1;
      }
    });

    strapi.log.info(`Currency catalog added ${inserted} currencies; existing records were preserved.`);
  } finally {
    try {
      require('../dist/src/services/socket-client').default.disconnect();
    } finally {
      await strapi.destroy();
    }
  }
}

seedCurrencies().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

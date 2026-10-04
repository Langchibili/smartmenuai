const { createStrapi } = require('@strapi/strapi');
const WorldCities = require('worldcities');
const sourceCountries = require('worldcities/data/countries.json');

// Source: worldcities 0.1.8 (Unlicense), with city and country data derived from GeoNames.
const normalize = (value) => String(value || '').trim().toLocaleLowerCase();

async function seedLocationCatalog() {
  const strapi = await createStrapi({ distDir: 'dist' }).load();
  try {
    const countryQuery = strapi.db.query('api::country.country');
    const existingCountries = await countryQuery.findMany({
      select: ['id', 'name', 'code'],
    });
    const countriesByCode = new Map(existingCountries.map((country) => [String(country.code).toUpperCase(), country]));
    const countriesByName = new Map(existingCountries.map((country) => [normalize(country.name), country]));
    const countryConflicts = sourceCountries.filter((source) => {
      const country = WorldCities.getCountry(source[0]);
      const byCode = countriesByCode.get(country.countryCode.toUpperCase());
      const byName = countriesByName.get(normalize(country.name));
      return (byCode && normalize(byCode.name) !== normalize(country.name)) ||
        (byName && String(byName.code).toUpperCase() !== country.countryCode.toUpperCase());
    });
    if (countryConflicts.length) {
      throw new Error(`Country name/code conflicts found; no catalog records were inserted (${countryConflicts.length}).`);
    }

    const allCities = WorldCities.City.getAllByName('.*');
    const citiesByCountry = new Map();
    for (const city of allCities) {
      const code = city.country.countryCode;
      const cities = citiesByCountry.get(code) || [];
      cities.push(city);
      citiesByCountry.set(code, cities);
    }

    await strapi.db.transaction(async () => {
      const countryIdsByCode = new Map();
      let countriesInserted = 0;
      let citiesInserted = 0;

      for (const source of sourceCountries) {
        const country = WorldCities.getCountry(source[0]);
        let record = countriesByCode.get(country.countryCode.toUpperCase());
        if (!record) {
          record = await countryQuery.create({
            data: {
              name: country.name,
              code: country.countryCode,
              phoneCode: country.callingCode || '',
              isActive: true,
            },
          });
          countriesByCode.set(String(record.code).toUpperCase(), record);
          countriesByName.set(normalize(record.name), record);
          countriesInserted += 1;
        }
        countryIdsByCode.set(country.countryCode, record.id);
      }

      for (const source of sourceCountries) {
        const country = WorldCities.getCountry(source[0]);
        const countryId = countryIdsByCode.get(country.countryCode);
        const cities = citiesByCountry.get(country.countryCode) || [];
        const selected = cities
          .slice()
          .sort((left, right) => Number(right.population || 0) - Number(left.population || 0))
          .slice(0, 5);
        const capital = cities.find((city) => normalize(city.name) === normalize(country.capital));
        if (capital && !selected.some((city) => normalize(city.name) === normalize(capital.name))) {
          selected.push(capital);
        }

        const existing = await strapi.db.query('api::city.city').findMany({
          where: { country: countryId },
          select: ['name'],
        });
        const existingNames = new Set(existing.map((city) => normalize(city.name)));
        for (const city of selected) {
          const key = normalize(city.name);
          if (!key || existingNames.has(key)) continue;
          await strapi.db.query('api::city.city').create({
            data: {
              name: city.name,
              population: Math.max(0, Math.floor(Number(city.population) || 0)),
              latitude: Number.isFinite(Number(city.latitude)) ? Number(city.latitude) : null,
              longitude: Number.isFinite(Number(city.longitude)) ? Number(city.longitude) : null,
              country: countryId,
              isActive: true,
            },
          });
          existingNames.add(key);
          citiesInserted += 1;
        }
      }

      strapi.log.info(`Location catalog added ${countriesInserted} countries and ${citiesInserted} cities; existing records were preserved.`);
    });
  } finally {
    const socket = require('../dist/src/services/socket-client').default;
    socket.disconnect();
    await strapi.destroy();
  }
}

seedLocationCatalog().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

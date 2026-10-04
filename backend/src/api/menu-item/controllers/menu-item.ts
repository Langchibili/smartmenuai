/**
 * menu-item controller
 */

import { factories } from '@strapi/strapi';

const MENU_ITEM_FIELDS = [
  'name',
  'description',
  'price',
  'preparation_time',
  'tags',
  'is_available',
  'is_popular',
  'is_featured',
  'is_special_offer',
];

async function getMenuEmployee(strapi, userId, businessId) {
  if (!userId) return null;
  return strapi.db.query('api::employee.employee').findOne({
    where: { user: userId, business: businessId, is_active: true },
  });
}

function selectFields(source, fields) {
  return Object.fromEntries(fields
    .filter((field) => source[field] !== undefined)
    .map((field) => [field, source[field]]));
}

export default factories.createCoreController('api::menu-item.menu-item', ({ strapi }) => ({
  async getBusinessMenu(ctx) {
    const { businessId } = ctx.request.body ?? {};
    if (!businessId) return ctx.badRequest('businessId is required');
    if (!ctx.state.user) return ctx.unauthorized('Not authenticated');

    const employee = await getMenuEmployee(strapi, ctx.state.user.id, businessId);
    if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();

    const [categories, items] = await Promise.all([
      strapi.db.query('api::menu-category.menu-category').findMany({
        where: { business: businessId },
        orderBy: { sort_order: 'asc' },
      }),
      strapi.db.query('api::menu-item.menu-item').findMany({
        where: { business: businessId },
        populate: ['image', 'menu_category', 'variants', 'modifiers'],
        orderBy: { name: 'asc' },
      }),
    ]);

    ctx.send({ categories, items });
  },

  async manageBusinessMenu(ctx) {
    const {
      businessId,
      entity,
      operation,
      entityId,
      menu_category: categoryId,
    } = ctx.request.body ?? {};
    if (!businessId) return ctx.badRequest('businessId is required');
    if (!ctx.state.user) return ctx.unauthorized('Not authenticated');
    if (!['category', 'item'].includes(entity)) return ctx.badRequest('entity must be category or item');
    if (!['create', 'update', 'delete'].includes(operation)) {
      return ctx.badRequest('operation must be create, update, or delete');
    }
    if (operation !== 'create' && !entityId) return ctx.badRequest('entityId is required');

    const employee = await getMenuEmployee(strapi, ctx.state.user.id, businessId);
    if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();

    if (entity === 'category') {
      const categories = strapi.db.query('api::menu-category.menu-category');
      if (operation === 'create') {
        const name = String(ctx.request.body.name ?? '').trim();
        if (!name) return ctx.badRequest('Category name is required');
        const category = await categories.create({
          data: {
            name,
            icon: ctx.request.body.icon || null,
            sort_order: Number(ctx.request.body.sort_order) || 0,
            business: businessId,
            publishedAt: new Date(),
          },
        });
        ctx.send({ category });
        return;
      }

      const existing = await categories.findOne({
        where: { id: entityId, business: businessId },
      });
      if (!existing) return ctx.notFound('Menu category not found');

      if (operation === 'delete') {
        await categories.delete({ where: { id: existing.id } });
        ctx.send({ success: true });
        return;
      }

      const name = String(ctx.request.body.name ?? '').trim();
      if (!name) return ctx.badRequest('Category name is required');
      const category = await categories.update({
        where: { id: existing.id },
        data: {
          name,
          icon: ctx.request.body.icon || null,
          business: businessId,
        },
      });
      ctx.send({ category });
      return;
    }

    const menuItems = strapi.db.query('api::menu-item.menu-item');
    if (operation === 'create' || operation === 'update') {
      const existing = operation === 'update'
        ? await menuItems.findOne({ where: { id: entityId, business: businessId } })
        : null;
      if (operation === 'update' && !existing) return ctx.notFound('Menu item not found');

      const name = ctx.request.body.name === undefined
        ? String(existing?.name ?? '').trim()
        : String(ctx.request.body.name).trim();
      const price = ctx.request.body.price === undefined
        ? Number(existing?.price)
        : Number(ctx.request.body.price);
      if (!name) return ctx.badRequest('Menu item name is required');
      if (!Number.isFinite(price) || price < 0) return ctx.badRequest('Menu item price must be a non-negative number');

      if (categoryId) {
        const category = await strapi.db.query('api::menu-category.menu-category').findOne({
          where: { id: categoryId, business: businessId },
        });
        if (!category) return ctx.badRequest('Menu category does not belong to this business');
      }

      const data = {
        ...selectFields(ctx.request.body, MENU_ITEM_FIELDS),
        ...(ctx.request.body.name !== undefined ? { name } : {}),
        ...(ctx.request.body.price !== undefined ? { price } : {}),
        ...(Object.prototype.hasOwnProperty.call(ctx.request.body, 'menu_category')
          ? { menu_category: categoryId || null }
          : {}),
      };
      if (operation === 'create') {
        const item = await menuItems.create({
          data: {
            ...data,
            name,
            price,
            business: businessId,
            menu_category: categoryId || null,
            publishedAt: new Date(),
          },
        });
        const populated = await menuItems.findOne({
          where: { id: item.id },
          populate: ['image', 'menu_category', 'variants', 'modifiers'],
        });
        ctx.send({ item: populated });
        return;
      }

      const item = await menuItems.update({
        where: { id: existing.id },
        data,
      });
      const populated = await menuItems.findOne({
        where: { id: item.id },
        populate: ['image', 'menu_category', 'variants', 'modifiers'],
      });
      ctx.send({ item: populated });
      return;
    }

    const existing = await menuItems.findOne({
      where: { id: entityId, business: businessId },
    });
    if (!existing) return ctx.notFound('Menu item not found');
    await menuItems.delete({ where: { id: existing.id } });
    ctx.send({ success: true });
  },

  async uploadMenuItemImage(ctx) {
    const { menuItemId, remove } = ctx.request.body ?? {};
    if (!menuItemId) return ctx.badRequest('menuItemId is required');
    if (!ctx.state.user) return ctx.unauthorized('Not authenticated');

    const item = await strapi.db.query('api::menu-item.menu-item').findOne({
      where: { id: menuItemId },
      populate: ['business'],
    });
    if (!item?.business?.id) return ctx.notFound('Menu item not found');
    const employee = await getMenuEmployee(strapi, ctx.state.user.id, item.business.id);
    if (!employee || !['owner', 'manager'].includes(employee.role)) return ctx.forbidden();

    if (remove === true || remove === 'true') {
      await strapi.db.query('api::menu-item.menu-item').update({
        where: { id: item.id },
        data: { image: null },
      });
      ctx.send({ media: null });
      return;
    }

    const fileInput = ctx.request.files?.files;
    const file = Array.isArray(fileInput) ? fileInput[0] : fileInput;
    if (!file) return ctx.badRequest('An image file is required');
    if (!String(file.mimetype ?? '').startsWith('image/')) {
      return ctx.badRequest('Only image uploads are supported');
    }
    if (Number(file.size) > 5 * 1024 * 1024) {
      return ctx.badRequest('Image must be 5 MB or smaller');
    }

    const uploaded = await strapi.plugin('upload').service('upload').upload({
      data: {
        ref: 'api::menu-item.menu-item',
        refId: String(item.id),
        field: 'image',
      },
      files: [file],
    });
    const media = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    if (!media?.id || !media.url) {
      return ctx.internalServerError('Image upload completed without returning media details');
    }
    ctx.send({
      media: {
        id: media.id,
        name: media.name,
        url: media.url,
        mime: media.mime,
        size: media.size,
        formats: media.formats,
      },
    });
  },
}));

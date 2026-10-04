import type { Schema, Struct } from '@strapi/strapi';

export interface OrderOrderItem extends Struct.ComponentSchema {
  collectionName: 'components_order_items';
  info: {
    displayName: 'OrderItem';
    icon: 'shopping-cart';
  };
  attributes: {
    image: Schema.Attribute.String;
    menu_item: Schema.Attribute.Relation<
      'oneToOne',
      'api::menu-item.menu-item'
    >;
    name: Schema.Attribute.String;
    notes: Schema.Attribute.Text;
    price: Schema.Attribute.Decimal;
    quantity: Schema.Attribute.Integer & Schema.Attribute.DefaultTo<1>;
    status: Schema.Attribute.Enumeration<['pending', 'preparing', 'served']>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'order.order-item': OrderOrderItem;
    }
  }
}

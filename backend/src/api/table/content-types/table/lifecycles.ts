import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { unlink, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

export default {
  async afterCreate(event: any) {
    const strapi = (global as any).strapi;
    const tableId = event.result?.id;
    if (!tableId) throw new Error('Cannot generate a table QR code without a saved table ID');

    const table = await strapi.db.query('api::table.table').findOne({
      where: { id: tableId },
      populate: ['business', 'branch'],
    });
    const businessId = table?.business?.id;
    const branchId = table?.branch?.id;
    if (!businessId || !branchId) {
      throw new Error(`Cannot generate a QR code for table ${tableId} without its business and branch`);
    }

    const appUrl = (process.env.FRONTEND_URL || 'http://localhost:3007').replace(/\/+$/, '');
    const qrCodeUrl = `${appUrl}/m/${businessId}/${branchId}/${tableId}`;
    const buffer = await QRCode.toBuffer(qrCodeUrl, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'H',
    });
    const fileName = `table_${tableId}_qr.png`;
    const filePath = join(tmpdir(), `smartmenu-${tableId}-${randomBytes(8).toString('hex')}.png`);
    await writeFile(filePath, buffer);

    let uploaded: any;
    try {
      uploaded = await strapi.plugin('upload').service('upload').upload({
        data: {
          ref: 'api::table.table',
          refId: String(tableId),
          field: 'qr_code_image',
          fileInfo: {
            name: fileName,
            alternativeText: `QR code for ${table.table_name || `Table ${table.table_number}`}`,
            caption: `Menu QR code for ${table.table_name || `Table ${table.table_number}`}`,
          },
        },
        files: [{
          filepath: filePath,
          originalFilename: fileName,
          mimetype: 'image/png',
          size: buffer.length,
        }],
      });
    } finally {
      try {
        await unlink(filePath);
      } catch (error) {
        strapi.log.warn(`[Table QR lifecycle] Failed to remove temporary QR image: ${error.message}`);
      }
    }

    const media = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    if (!media?.id) {
      throw new Error(`QR image upload returned no media record for table ${tableId}`);
    }

    await strapi.db.query('api::table.table').update({
      where: { id: tableId },
      data: {
        qr_code_url: qrCodeUrl,
        qr_code_image: media.id,
      },
    });
  },
};

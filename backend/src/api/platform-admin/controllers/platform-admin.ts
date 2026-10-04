import { factories } from '@strapi/strapi';
import { getAdminSettings } from '../../../utils/admin-settings';
import crypto from 'crypto';

// ─────────────────────────────────────────────────────────────────────────────
// Helper — verify the caller is an active platform admin.
// Returns the admin record or null (and has already sent an error response).
// ─────────────────────────────────────────────────────────────────────────────
async function requirePlatformAdmin(ctx: any, strapi: any) {
  const user = ctx.state.user;
  if (!user) {
    ctx.unauthorized('Not authenticated');
    return null;
  }
  const admin = await strapi.db
    .query('api::platform-admin.platform-admin')
    .findOne({ where: { user: user.id, is_active: true } });
  if (!admin) {
    ctx.forbidden('Platform admin access required');
    return null;
  }
  return admin;
}

export default factories.createCoreController(
  'api::platform-admin.platform-admin',
  ({ strapi }) => ({

    // ─────────────────────────────────────────────────────────────────────────
    // POST /custom-functions/setupPlatformMaster   (PUBLIC — one-time only)
    // { email, password, fullName }
    // Creates the first platform master account. Guards against re-creation
    // unless the email matches PLATFORM_OWNER_EMAIL env var.
    // ─────────────────────────────────────────────────────────────────────────
    async setupPlatformMaster(ctx) {
      try {
        const { email, password, fullName } = ctx.request.body;
        if (!email || !password) return ctx.badRequest('email and password are required');

        const existing = await strapi.db
          .query('api::platform-admin.platform-admin')
          .findOne({ where: { role: 'platform_master', is_active: true } });

        const platformOwnerEmail = process.env.PLATFORM_OWNER_EMAIL;
        if (existing && email !== platformOwnerEmail) {
          return ctx.forbidden('Platform master is already configured');
        }

        // Resolve or create the auth user
        let user = await strapi.db
          .query('plugin::users-permissions.user')
          .findOne({ where: { email } });

        if (!user) {
          const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
          const settings = (await pluginStore.get({ key: 'advanced' })) as any;
          const defaultRole = await strapi.db
            .query('plugin::users-permissions.role')
            .findOne({ where: { type: settings?.default_role || 'authenticated' } });

          user = await strapi.plugins['users-permissions'].services.user.add({
            username: fullName || email.split('@')[0],
            email,
            password,
            role: defaultRole?.id,
            confirmed: true,
            blocked: false,
          });
        }

        // Create or update the platform-admin record
        if (existing) {
          await strapi.db.query('api::platform-admin.platform-admin').update({
            where: { id: existing.id },
            data: { user: user.id, is_active: true },
          });
        } else {
          await strapi.db.query('api::platform-admin.platform-admin').create({
            data: {
              email,
              role: 'platform_master',
              is_active: true,
              user: user.id,
              publishedAt: new Date(),
            },
          });
        }

        // Create / update user profile
        const existingProfile = await strapi.db
          .query('api::user-profile.user-profile')
          .findOne({ where: { user: user.id } });

        if (!existingProfile) {
          await strapi.db.query('api::user-profile.user-profile').create({
            data: {
              full_name: fullName || '',
              is_platform_admin: true,
              onboarding_complete: true,
              onboarding_step: 99,
              user: user.id,
              publishedAt: new Date(),
            },
          });
        } else {
          await strapi.db.query('api::user-profile.user-profile').update({
            where: { id: existingProfile.id },
            data: { is_platform_admin: true, onboarding_complete: true, onboarding_step: 99 },
          });
        }

        const jwt = strapi.plugins['users-permissions'].services.jwt.issue({ id: user.id });

        ctx.send({
          success: true,
          token: jwt,
          user: { id: user.id, email: user.email, role: 'platform_master' },
        });
      } catch (err) {
        ctx.throw(500, err.message);
      }
    },

    async getAppLinks(ctx) {
      try {
        const settings = await getAdminSettings(strapi);
        ctx.send({
          appLinks: {
            android: settings.android_app_link || '',
            ios: settings.ios_app_link || '',
          },
          email: settings.email || '',
          supportPhoneNumber: settings.support_phone_number || '',
          waiterCallDelay: settings.waiter_call_delay || 1,
          requestBillDelay: settings.request_bill_delay || 1,
          businessTerminology: settings.business_terminology || {},
        });
      } catch (err) {
        strapi.log.error(`[getAppLinks] ${err?.stack || err?.message || err}`);
        ctx.throw(500, 'Unable to load app download links');
      }
    },

    async updateAppLinks(ctx) {
      try {
        const admin = await requirePlatformAdmin(ctx, strapi);
        if (!admin) return;

        const {
          android,
          ios,
          email,
          supportPhoneNumber,
          waiterCallDelay,
          requestBillDelay,
          businessTerminology,
        } = ctx.request.body || {};
        const delay = Number(waiterCallDelay);
        const billDelay = Number(requestBillDelay);
        const normalizedEmail = typeof email === 'string' ? email.trim() : '';
        const normalizedPhone = typeof supportPhoneNumber === 'string'
          ? supportPhoneNumber.trim()
          : '';
        const terminology = businessTerminology;
        const isValidLink = (value) => {
          if (typeof value !== 'string' || value.length > 2048) return false;
          if (!value.trim()) return true;
          try {
            return new URL(value).protocol === 'https:';
          } catch {
            return false;
          }
        };
        if (!isValidLink(android) || !isValidLink(ios)) {
          return ctx.badRequest('App links must be valid HTTPS URLs (or blank)');
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
          return ctx.badRequest('A valid support email address is required');
        }
        if (normalizedPhone.length > 50) {
          return ctx.badRequest('Support phone number must be 50 characters or fewer');
        }
        if (
          !terminology ||
          typeof terminology !== 'object' ||
          Array.isArray(terminology) ||
          JSON.stringify(terminology).length > 10000 ||
          Object.values(terminology).some((words) =>
            !words ||
            typeof words !== 'object' ||
            Array.isArray(words) ||
            Object.values(words).some((word) => typeof word !== 'string' || word.length > 80)
          )
        ) {
          return ctx.badRequest('Business terminology must be a JSON object of string values');
        }
        if (!Number.isInteger(delay) || delay < 1 || delay > 1440) {
          return ctx.badRequest('Waiter call delay must be a whole number from 1 to 1440 minutes');
        }
        if (!Number.isInteger(billDelay) || billDelay < 1 || billDelay > 1440) {
          return ctx.badRequest('Request bill delay must be a whole number from 1 to 1440 minutes');
        }

        const existingSettings = await strapi.db
          .query('api::admn-setting.admn-setting')
          .findOne({ where: {} });
        const settingsData = {
          email: normalizedEmail,
          support_phone_number: normalizedPhone || null,
          android_app_link: android.trim() || null,
          ios_app_link: ios.trim() || null,
          waiter_call_delay: delay,
          request_bill_delay: billDelay,
          business_terminology: terminology,
        };
        if (existingSettings) {
          await strapi.db.query('api::admn-setting.admn-setting').update({
            where: { id: existingSettings.id },
            data: settingsData,
          });
        } else {
          await strapi.db.query('api::admn-setting.admn-setting').create({
            data: settingsData,
          });
        }
        ctx.send({ success: true });
      } catch (err) {
        strapi.log.error(`[updateAppLinks] ${err?.stack || err?.message || err}`);
        ctx.throw(500, 'Unable to save app download links');
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // POST /custom-functions/platformCreateBusiness   (auth required)
    // { businessName, businessType, ownerEmail, ownerFullName,
    //   phone, address, city, country, currency, planType }
    // Platform master creates a business + owner user (with temp password).
    // Sends credential email if the owner is a new user.
    // ─────────────────────────────────────────────────────────────────────────
    async platformCreateBusiness(ctx) {
      try {
        const admin = await requirePlatformAdmin(ctx, strapi);
        if (!admin) return;

        const {
          businessName,
          businessType,
          ownerEmail,
          ownerFullName,
          phone,
          address,
          city,
          country,
          currency,
          planType,
        } = ctx.request.body;

        if (!businessName || !ownerEmail) {
          return ctx.badRequest('businessName and ownerEmail are required');
        }

        // Resolve or create owner user
        let ownerUser = await strapi.db
          .query('plugin::users-permissions.user')
          .findOne({ where: { email: ownerEmail } });

        const tempPassword = crypto.randomBytes(8).toString('hex');
        let isNewUser = false;

        if (!ownerUser) {
          isNewUser = true;
          const pluginStore = strapi.store({ type: 'plugin', name: 'users-permissions' });
          const settings = (await pluginStore.get({ key: 'advanced' })) as any;
          const defaultRole = await strapi.db
            .query('plugin::users-permissions.role')
            .findOne({ where: { type: settings?.default_role || 'authenticated' } });

          ownerUser = await strapi.plugins['users-permissions'].services.user.add({
            username: ownerFullName || ownerEmail.split('@')[0],
            email: ownerEmail,
            password: tempPassword,
            role: defaultRole?.id,
            confirmed: true,
            blocked: false,
          });
        }

        // Create business (lifecycle auto-creates menu + ad settings)
        const business = await strapi.db.query('api::business.business').create({
          data: {
            business_name: businessName,
            business_type: businessType || 'restaurant',
            phone: phone || '',
            address: address || '',
            city: city || '',
            country: country || '',
            currency: currency || 'USD',
            plan_type: planType || 'basic',
            is_active: true,
            is_published: false,
            owner: ownerUser.id,
            publishedAt: new Date(),
          },
        });

        // Create default branch
        const branch = await strapi.db.query('api::branch.branch').create({
          data: {
            branch_name: 'Main Branch',
            business: business.id,
            is_active: true,
            publishedAt: new Date(),
          },
        });

        // Create owner employee record
        await strapi.db.query('api::employee.employee').create({
          data: {
            full_name: ownerFullName || ownerEmail,
            role: 'owner',
            is_active: true,
            permissions: {
              manage_menu: true,
              manage_orders: true,
              manage_employees: true,
              view_reports: true,
              manage_tables: true,
              manage_billing: true,
            },
            user: ownerUser.id,
            business: business.id,
            branch: branch.id,
            publishedAt: new Date(),
          },
        });

        // Create user profile (marks must_change_password for new users)
        const existingProfile = await strapi.db
          .query('api::user-profile.user-profile')
          .findOne({ where: { user: ownerUser.id } });

        if (!existingProfile) {
          await strapi.db.query('api::user-profile.user-profile').create({
            data: {
              full_name: ownerFullName || '',
              account_type: 'business_owner',
              must_change_password: isNewUser,
              onboarding_step: isNewUser ? 1 : 2,
              onboarding_complete: false,
              user: ownerUser.id,
              business: business.id,
              publishedAt: new Date(),
            },
          });
        }

        // Email credentials to new users
        if (isNewUser) {
          try {
            await strapi.plugins['email'].services.email.send({
              to: ownerEmail,
              subject: `Your Smart Menu AI account is ready — ${businessName}`,
              text: [
                `Hi ${ownerFullName || 'there'},`,
                '',
                `Your business "${businessName}" has been set up on Smart Menu AI.`,
                '',
                `Login details:`,
                `  Email:    ${ownerEmail}`,
                `  Password: ${tempPassword}`,
                '',
                `Please log in and change your password immediately.`,
                '',
                process.env.FRONTEND_URL || 'https://your-app.com',
              ].join('\n'),
            });
          } catch (mailErr) {
            strapi.log.warn(`[platformCreateBusiness] Email failed: ${mailErr.message}`);
          }
        }

        ctx.send({
          success: true,
          businessId: business.id,
          branchId: branch.id,
          ownerUserId: ownerUser.id,
          isNewUser,
          tempPassword: isNewUser ? tempPassword : null,
        });
      } catch (err) {
        ctx.throw(500, err.message);
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // POST /custom-functions/platformGetDashboard   (auth required)
    // Returns platform-wide KPIs and the 5 most recently created businesses.
    // ─────────────────────────────────────────────────────────────────────────
    async platformGetDashboard(ctx) {
      try {
        const admin = await requirePlatformAdmin(ctx, strapi);
        if (!admin) return;

        const [totalBusinesses, totalOrders, totalEmployees, totalCampaigns] =
          await Promise.all([
            strapi.db.query('api::business.business').count({}),
            strapi.db.query('api::order.order').count({}),
            strapi.db.query('api::employee.employee').count({}),
            strapi.db.query('api::ad-campaign.ad-campaign').count({
              where: { status: 'active' },
            }),
          ]);

        const recentBusinesses = await strapi.db
          .query('api::business.business')
          .findMany({
            orderBy: { createdAt: 'desc' },
            limit: 5,
            populate: ['owner'],
          });

        ctx.send({
          stats: { totalBusinesses, totalOrders, totalEmployees, totalCampaigns },
          recentBusinesses: recentBusinesses.map((b) => ({
            id: b.id,
            business_name: b.business_name,
            business_type: b.business_type,
            plan_type: b.plan_type,
            is_active: b.is_active,
            owner_email: b.owner?.email || null,
            created_at: b.createdAt,
          })),
        });
      } catch (err) {
        ctx.throw(500, err.message);
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // POST /custom-functions/platformGetAllBusinesses   (auth required)
    // Returns every business with owner email and branch count.
    // ─────────────────────────────────────────────────────────────────────────
    async platformGetAllBusinesses(ctx) {
      try {
        const admin = await requirePlatformAdmin(ctx, strapi);
        if (!admin) return;

        const businesses = await strapi.db.query('api::business.business').findMany({
          populate: ['owner', 'logo', 'branches'],
          orderBy: { createdAt: 'desc' },
        });

        ctx.send({
          businesses: businesses.map((b) => ({
            id: b.id,
            business_name: b.business_name,
            business_type: b.business_type,
            plan_type: b.plan_type,
            is_active: b.is_active,
            is_published: b.is_published,
            city: b.city,
            country: b.country,
            logo: b.logo?.url || null,
            owner_email: b.owner?.email || null,
            branch_count: (b.branches || []).length,
            created_at: b.createdAt,
          })),
        });
      } catch (err) {
        ctx.throw(500, err.message);
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // POST /custom-functions/platformToggleBusiness   (auth required)
    // { businessId, is_active }
    // Suspend or reactivate a business.
    // ─────────────────────────────────────────────────────────────────────────
    async platformToggleBusiness(ctx) {
      try {
        const admin = await requirePlatformAdmin(ctx, strapi);
        if (!admin) return;

        const { businessId, is_active } = ctx.request.body;
        if (!businessId) return ctx.badRequest('businessId is required');

        await strapi.db.query('api::business.business').update({
          where: { id: businessId },
          data: { is_active },
        });

        ctx.send({ success: true });
      } catch (err) {
        ctx.throw(500, err.message);
      }
    },

    // ─────────────────────────────────────────────────────────────────────────
    // POST /custom-functions/platformUpdateBusinessPlan   (auth required)
    // { businessId, planType }
    // Upgrade / downgrade a business between basic and premium.
    // ─────────────────────────────────────────────────────────────────────────
    async platformUpdateBusinessPlan(ctx) {
      try {
        const admin = await requirePlatformAdmin(ctx, strapi);
        if (!admin) return;

        const { businessId, planType } = ctx.request.body;
        if (!businessId || !planType) {
          return ctx.badRequest('businessId and planType are required');
        }

        await strapi.db.query('api::business.business').update({
          where: { id: businessId },
          data: { plan_type: planType },
        });

        // If downgrading to basic, force platform ads back on
        if (planType === 'basic') {
          const adSetting = await strapi.db
            .query('api::business-ad-setting.business-ad-setting')
            .findOne({ where: { business: businessId } });
          if (adSetting) {
            await strapi.db.query('api::business-ad-setting.business-ad-setting').update({
              where: { id: adSetting.id },
              data: { ad_mode: 'platform_ads' },
            });
          }
        }

        ctx.send({ success: true });
      } catch (err) {
        ctx.throw(500, err.message);
      }
    },
  })
);

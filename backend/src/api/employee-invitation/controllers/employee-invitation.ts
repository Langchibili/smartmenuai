import { factories } from '@strapi/strapi';
import crypto from 'crypto';

const INVITE_BASE = process.env.FRONTEND_URL || 'http://localhost:3007';

export default factories.createCoreController('api::employee-invitation.employee-invitation', ({ strapi }) => ({

  // POST /custom-functions/sendEmployeeInvite
  // { invited_name, invited_email, phone, role, branch_id, business_id, business_name }
  async sendEmployeeInvite(ctx) {
    try {
      const { invited_name, invited_email, phone, role, branch_id, business_id, business_name } = ctx.request.body;
      if (!invited_name || !invited_email || !role || !business_id) {
        return ctx.send({ error: 'invited_name, invited_email, role and business_id are required' }, 400);
      }
      if (!['manager', 'waiter'].includes(role)) return ctx.badRequest('role must be manager or waiter');
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized();
      const employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: business_id, role: 'owner', is_active: true },
      });
      if (!employee) return ctx.forbidden();

      const business = await strapi.db.query('api::business.business').findOne({
        where: { id: business_id },
      });
      if (!business) return ctx.notFound('Business not found');
      if (branch_id) {
        const branch = await strapi.db.query('api::branch.branch').findOne({
          where: { id: branch_id, business: business_id },
        });
        if (!branch) return ctx.badRequest('Branch does not belong to this business');
      }

      // Cancel any prior pending invite for the same email + business
      const existing = await strapi.db.query('api::employee-invitation.employee-invitation').findMany({
        where: { invited_email, business: business_id, status: 'pending' },
      });
      for (const inv of existing) {
        await strapi.db.query('api::employee-invitation.employee-invitation').update({
          where: { id: inv.id },
          data: { status: 'cancelled' },
        });
      }

      const token = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const invitation = await strapi.db.query('api::employee-invitation.employee-invitation').create({
        data: {
          invited_name,
          invited_email,
          phone: phone || '',
          role,
          branch: branch_id || null,
          business: business_id,
          invite_token: token,
          status: 'pending',
          expires_at: expiresAt,
          publishedAt: new Date(),
        },
      });

      const inviteLink = `${INVITE_BASE}/accept-invite?token=${token}`;

      let emailSent = false;
      try {
        await strapi.plugins['email'].services.email.send({
          to: invited_email,
          subject: `You've been invited to join ${business_name || business.business_name} on Smart Menu`,
          text: `Hi ${invited_name},\n\nYou've been invited to join ${business_name || business.business_name} as a ${role}.\n\nAccept your invite here: ${inviteLink}\n\nThis link expires in 7 days.`,
        });
        emailSent = true;
      } catch (mailErr) {
        strapi.log.warn(`[sendEmployeeInvite] Email send failed: ${mailErr.message}`);
        emailSent = false;
      }

      ctx.send({
        success: true,
        invitationId: invitation.id,
        inviteLink,
        emailSent,
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // POST /custom-functions/validateInviteToken  { token }
  async validateInviteToken(ctx) {
    try {
      const { token } = ctx.request.body;
      if (!token) return ctx.send({ valid: false, reason: 'invalid' });

      const invitation = await strapi.db.query('api::employee-invitation.employee-invitation').findOne({
        where: { invite_token: token },
        populate: ['business', 'branch'],
      });

      if (!invitation) return ctx.send({ valid: false, reason: 'invalid' });
      if (invitation.status === 'accepted') return ctx.send({ valid: false, reason: 'accepted' });
      if (invitation.status === 'cancelled') return ctx.send({ valid: false, reason: 'invalid' });
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        if (invitation.status !== 'expired') {
          await strapi.db.query('api::employee-invitation.employee-invitation').update({
            where: { id: invitation.id },
            data: { status: 'expired' },
          });
        }
        return ctx.send({ valid: false, reason: 'expired' });
      }

      ctx.send({
        valid: true,
        invitation: {
          id: invitation.id,
          invited_name: invitation.invited_name,
          invited_email: invitation.invited_email,
          role: invitation.role,
        },
        business: invitation.business ? {
          id: invitation.business.id,
          business_name: invitation.business.business_name,
        } : null,
        branch: invitation.branch ? {
          id: invitation.branch.id,
          branch_name: invitation.branch.branch_name,
        } : null,
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

  // POST /custom-functions/acceptInvite  { token }  — requires authenticated user (ctx.state.user)
  async acceptInvite(ctx) {
    try {
      const { token } = ctx.request.body;
      const user = ctx.state.user;
      if (!user) return ctx.unauthorized('Not authenticated');
      if (!token) return ctx.badRequest('Token is required');

      const invitation = await strapi.db.query('api::employee-invitation.employee-invitation').findOne({
        where: { invite_token: token },
        populate: ['business', 'branch'],
      });

      if (!invitation) return ctx.notFound('Invalid invite link');
      if (invitation.invited_email.toLowerCase() !== user.email.toLowerCase()) {
        return ctx.forbidden('This invite was sent to a different email address');
      }
      if (invitation.status === 'accepted') {
        const acceptedEmployee = await strapi.db.query('api::employee.employee').findOne({
          where: { user: user.id, business: invitation.business.id },
        });
        if (acceptedEmployee) {
          return ctx.send({
            success: true,
            employeeId: acceptedEmployee.id,
            business_id: invitation.business.id,
            role: invitation.role,
          });
        }
        return ctx.badRequest('Invitation has already been accepted');
      }
      if (invitation.status !== 'pending') {
        return ctx.badRequest('Invitation is no longer pending');
      }
      if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
        await strapi.db.query('api::employee-invitation.employee-invitation').update({
          where: { id: invitation.id },
          data: { status: 'expired' },
        });
        return ctx.badRequest('Invitation has expired');
      }

      const DEFAULT_PERMISSIONS = {
        manager: { view_orders: true, manage_menu: true, assign_waiters: true, view_daily_reports: true, approve_cancellations: true },
        waiter: { view_assigned_tables: true, receive_orders: true, update_order_status: true, receive_waiter_calls: true },
      };

      const ownerEmployee = await strapi.db.query('api::employee.employee').findOne({
        where: { business: invitation.business.id, role: 'owner' },
        populate: ['user'],
      });
      const profiles = strapi.db.query('api::user-profile.user-profile');
      const ownerProfile = ownerEmployee?.user
        ? await profiles.findOne({ where: { user: ownerEmployee.user.id } })
        : null;
      let profile = await profiles.findOne({ where: { user: user.id } });
      if (!profile) {
        profile = await profiles.create({
          data: {
            full_name: invitation.invited_name,
            account_type: 'employee',
            onboarding_step: 0,
            onboarding_complete: false,
            must_change_password: false,
            is_platform_admin: false,
          },
        });
        await strapi.db.query('plugin::users-permissions.user').update({
          where: { id: user.id },
          data: { user_profile: profile.id },
        });
      }

      let employee = await strapi.db.query('api::employee.employee').findOne({
        where: { user: user.id, business: invitation.business.id },
      });
      if (!employee) {
        employee = await strapi.db.query('api::employee.employee').create({
          data: {
            full_name: invitation.invited_name,
            phone: invitation.phone || '',
            role: invitation.role,
            is_active: true,
            permissions: DEFAULT_PERMISSIONS[invitation.role] || {},
            user: user.id,
            owner_profile: ownerProfile?.id || null,
            business: invitation.business.id,
            branch: invitation.branch?.id || null,
            publishedAt: new Date(),
          },
        });
      } else if (ownerProfile && !employee.owner_profile) {
        employee = await strapi.db.query('api::employee.employee').update({
          where: { id: employee.id },
          data: { owner_profile: ownerProfile.id },
        });
      }

      await strapi.db.query('api::employee-invitation.employee-invitation').update({
        where: { id: invitation.id },
        data: { status: 'accepted' },
      });

      ctx.send({
        success: true,
        employeeId: employee.id,
        business_id: invitation.business.id,
        role: invitation.role,
      });
    } catch (err) {
      ctx.throw(500, err.message);
    }
  },

}));

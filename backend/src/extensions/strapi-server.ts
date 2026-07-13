// src/extensions/users-permissions/strapi-server.ts
// Extends Strapi's built-in register endpoint so that every new user
// automatically gets a UserProfile record. The profile tracks:
//   - account_type   (set by the frontend on the next onboarding step)
//   - onboarding_step
//   - must_change_password
// The frontend sends { accountType?, fullName? } alongside the standard
// { username, email, password } fields.

export default (plugin: any) => {
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx: any) => {
    // Run default Strapi registration first
    await originalRegister(ctx);

    // Only proceed if registration succeeded and we have a user back
    if (ctx.response.status !== 200 || !ctx.body?.user?.id) return;

    const { user } = ctx.body as any;
    const { accountType, fullName } = ctx.request.body as any;
    const strapi = (global as any).strapi;

    try {
      await strapi.db.query('api::user-profile.user-profile').create({
        data: {
          full_name: fullName || user.username || '',
          // accountType is null until the user picks it on the next screen
          account_type: accountType || null,
          onboarding_step: 0,
          onboarding_complete: false,
          must_change_password: false,
          is_platform_admin: false,
          user: user.id,
          publishedAt: new Date(),
        },
      });
    } catch (err) {
      strapi.log.warn(
        `[users-permissions extension] Failed to create UserProfile for user ${user.id}: ${err.message}`
      );
      // Registration itself already succeeded — don't fail the whole request
    }
  };

  return plugin;
};

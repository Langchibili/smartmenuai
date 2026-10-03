// Extends Strapi's Users & Permissions registration flow.
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
    await originalRegister(ctx);

    const registrationBody = ctx.body || ctx.response.body;
    if (ctx.response.status < 200 || ctx.response.status >= 300 || !registrationBody?.user?.id) return;

    const { user } = registrationBody;
    const { accountType, fullName } = ctx.request.body as any;
    const strapi = (global as any).strapi;

    try {
      const profiles = strapi.db.query('api::user-profile.user-profile');
      const existingProfile = await profiles.findOne({ where: { user: user.id } });
      const profileData = {
          full_name: fullName || user.username || '',
          account_type: accountType || null,
          onboarding_step: 0,
          onboarding_complete: false,
          must_change_password: false,
          is_platform_admin: false,
      };
      if (existingProfile) {
        await profiles.update({ where: { id: existingProfile.id }, data: profileData });
      } else {
        await profiles.create({
          data: { ...profileData, user: user.id },
        });
      }
    } catch (err) {
      strapi.log.warn(
        `[users-permissions extension] Failed to create UserProfile for user ${user.id}: ${err.message}`
      );
      // Registration itself already succeeded — don't fail the whole request
    }
  };

  return plugin;
};

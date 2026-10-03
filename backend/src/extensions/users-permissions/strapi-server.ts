export default (plugin: any) => {
  const originalRegister = plugin.controllers.auth.register;

  plugin.controllers.auth.register = async (ctx: any) => {
    return originalRegister(ctx);
  };

  return plugin;
};

let app;

export default async (req, res) => {
  if (!app) {
    const mod = await import("../artifacts/api-server/dist/app.mjs");
    app = mod.default;
  }
  app(req, res);
};

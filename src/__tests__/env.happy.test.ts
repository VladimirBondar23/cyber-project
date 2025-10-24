describe("env happy path", () => {
  const OLD = { ...process.env };
  afterEach(() => {
    jest.resetModules();
    process.env = { ...OLD };
  });

  test("loads numbers and defaults", () => {
    process.env.ENV = "dev";
    process.env.PORT = "3000";
    process.env.DATABASE_URI = "postgres://postgres:pass@localhost:5432/postgres";
    process.env.DB_CONNECTION_INTERVAL = "1";
    const { config } = require("../env");
    expect(config.PORT).toBe(3000);
    expect(config.DB_CONNECTION_INTERVAL).toBe(1);
    expect(config.ENV).toBe("dev");
  });
});

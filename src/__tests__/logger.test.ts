
beforeAll(() => {
  jest.spyOn(process, "exit").mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`process.exit: ${code}`);
  });
});

afterAll(() => {
  ((process.exit as unknown) as jest.Mock).mockRestore?.();
});


describe("Logger", () => {
  const OLD = { ...process.env };

  afterEach(() => {
    jest.resetModules();
    process.env = { ...OLD };
  });

  test("dev (console transport) and console overrides", () => {
    process.env.ENV = "dev";
    const { logger } = require("../logging/Logger");
    expect(logger).toBeTruthy();
    console.log("hello");
    console.info("info");
    console.warn("warn");
    console.error("err");
    console.debug("debug");
  });

  test("prod (file transport) branch", () => {
    process.env.ENV = "prod";
    const { logger } = require("../logging/Logger");
    logger.info("file transport active");
  });
});

beforeAll(() => {
  jest.spyOn(process, "exit").mockImplementation((code?: string | number | null | undefined) => {
    throw new Error(`process.exit: ${code}`);
  });
});

afterAll(() => {
  ((process.exit as unknown) as jest.Mock).mockRestore?.();
});


describe("initDb retry path", () => {
  const OLD = { ...process.env };

  afterEach(() => {
    jest.resetModules();
    process.env = { ...OLD };
  });

  test("retries once then succeeds", async () => {
    process.env.ENV = "dev";
    process.env.DATABASE_URI = "postgres://x:y@localhost:5432/z";
    process.env.DB_CONNECTION_INTERVAL = "0";

    // mock 'postgres' BEFORE importing db.ts
    let call = 0;
    jest.doMock("postgres", () => {
      const tag = async () => {
        call += 1;
        if (call === 1) throw new Error("boom");
        return {};
      };
      return { __esModule: true, default: () => tag };
    });

    const { initDb } = require("../db/db");
    await initDb();
    expect(call).toBeGreaterThanOrEqual(2);
  });
});

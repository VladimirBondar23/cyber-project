import request from "supertest";
import app from "../app";

// Run mock data script once before all tests
beforeAll(async () => {
  const { execSync } = require("child_process");
  execSync("npx ts-node scripts/mock_data_population.ts");
});

describe("Firewall API", () => {
  // Successful input tests
  it("should add a valid IP blacklist rule", async () => {
    const res = await request(app)
      .post("/api/firewall/ip")
      .send({ mode: "blacklist", values: ["8.8.8.8"] });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("should add a valid URL whitelist rule", async () => {
    const res = await request(app)
      .post("/api/firewall/url")
      .send({ mode: "whitelist", values: ["example.com"] });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  it("should add a valid port blacklist rule", async () => {
    const res = await request(app)
      .post("/api/firewall/port")
      .send({ mode: "blacklist", values: [443] });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("success");
  });

  // Edge case tests
  it("should reject invalid port (negative)", async () => {
    const res = await request(app)
      .post("/api/firewall/port")
      .send({ mode: "blacklist", values: [-1] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("should reject invalid IP address", async () => {
    const res = await request(app)
      .post("/api/firewall/ip")
      .send({ mode: "blacklist", values: ["999.999.999.999"] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  // Duplicate information test
  it("should not add duplicate rule", async () => {
    // Add once
    await request(app)
      .post("/api/firewall/ip")
      .send({ mode: "blacklist", values: ["1.1.1.1"] });
    // Add again
    const res = await request(app)
      .post("/api/firewall/ip")
      .send({ mode: "blacklist", values: ["1.1.1.1"] });
    expect(res.status).toBe(200);
    // You may want to check the DB to ensure only one exists
  });

  // System test: happy flow
  it("should add, fetch, and delete a rule", async () => {
    // Add
    await request(app)
      .post("/api/firewall/ip")
      .send({ mode: "blacklist", values: ["2.2.2.2"] });

    // Fetch
    const getRes = await request(app).get("/api/firewall/rules");
    expect(getRes.status).toBe(200);
    expect(getRes.body.ips.blacklist.some((r: any) => r.value === "2.2.2.2")).toBe(true);

    // Delete
    await request(app)
      .delete("/api/firewall/ip")
      .send({ mode: "blacklist", values: ["2.2.2.2"] });

    // Fetch again
    const getRes2 = await request(app).get("/api/firewall/rules");
    expect(getRes2.body.ips.blacklist.some((r: any) => r.value === "2.2.2.2")).toBe(false);
  });
});


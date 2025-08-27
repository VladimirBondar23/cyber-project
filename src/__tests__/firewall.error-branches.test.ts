import request from "supertest";
import app from "../app";

describe("Firewall route error branches", () => {
  test("POST invalid :type → 400", async () => {
    const r = await request(app)
      .post("/api/firewall/notatype")
      .send({ mode: "blacklist", values: ["1.1.1.1"] });
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/type must be ip\|url\|port/i);
  });

  test("POST missing mode/values → 400", async () => {
    let r = await request(app).post("/api/firewall/ip").send({});
    expect(r.status).toBe(400);
    expect(r.body.error).toMatch(/values\[\] and mode are required/i);

    r = await request(app).post("/api/firewall/ip").send({ values: ["1.1.1.1"] });
    expect(r.status).toBe(400);
  });

  test("POST invalid URL → 400 validation_error", async () => {
    const r = await request(app)
      .post("/api/firewall/url")
      .send({ mode: "whitelist", values: ["bad..com"] });
    expect(r.status).toBe(400);
    expect(r.body.error).toBe("validation_error");
  });

  test("PATCH /rules with empty body → {updated:[]}", async () => {
    const r = await request(app).patch("/api/firewall/rules").send({});
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ updated: [] });
  });
});

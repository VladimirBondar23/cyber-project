import request from "supertest";
import app from "../app";

test("GET / returns Hello World", async () => {
  const r = await request(app).get("/");
  expect(r.status).toBe(200);
  expect(r.text).toMatch(/Hello World/i);
});

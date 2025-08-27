import { parseType, validateValues, normalizeValues } from "../lib/rules";

describe("rules helpers", () => {
  test("parseType: valid and invalid", () => {
    expect(parseType("ip")).toBe("ip");
    expect(parseType("url")).toBe("url");
    expect(parseType("port")).toBe("port");
    expect(parseType("nope")).toBeNull();
    expect(parseType(undefined)).toBeNull();
  });

  test("normalizeValues trims/strings", () => {
    expect(normalizeValues("ip", [" 1.1.1.1 "])[0]).toBe("1.1.1.1");
    expect(normalizeValues("port", [80, " 443 "])).toEqual(["80", "443"]);
  });

  test("validateValues catches bad inputs", () => {
    expect(validateValues("ip", ["999.999.999.999"]).length).toBeGreaterThan(0);
    expect(validateValues("url", ["bad..com"]).length).toBeGreaterThan(0);
    expect(validateValues("port", [65536]).length).toBeGreaterThan(0);
  });
});

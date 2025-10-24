import postgres from "postgres";
import { faker } from "@faker-js/faker";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URI = process.env.DATABASE_URI_DEV;
if (!DATABASE_URI) {
  console.error("DATABASE_URI_DEV is not set in .env");
  process.exit(1);
}

const client = postgres(DATABASE_URI);

function getRandomMode(): "blacklist" | "whitelist" {
  return faker.helpers.arrayElement(["blacklist", "whitelist"]);
}

function generateUnique<T>(generator: () => T, count: number): T[] {
  const set = new Set<T>();
  while (set.size < count) {
    set.add(generator());
  }
  return Array.from(set);
}

async function populateFirewallRules() {
  const entries: Array<{ type: string; mode: string; value: string; active: boolean }> = [];

  // Generate 10 unique IPs
  const ips = generateUnique(() => faker.internet.ip(), 10);
  for (const ip of ips) {
    entries.push({
      type: "ip",
      mode: getRandomMode(),
      value: ip,
      active: faker.datatype.boolean(),
    });
  }

  // Generate 10 unique URLs
  const urls = generateUnique(() => faker.internet.domainName(), 10);
  for (const url of urls) {
    entries.push({
      type: "url",
      mode: getRandomMode(),
      value: url,
      active: faker.datatype.boolean(),
    });
  }

  // Generate 10 unique ports (as string for consistency)
  const ports = generateUnique(
    () => String(faker.helpers.arrayElement([1, 65535, faker.number.int({ min: 2, max: 65534 })])),
    10
  );
  for (const port of ports) {
    entries.push({
      type: "port",
      mode: getRandomMode(),
      value: port,
      active: faker.datatype.boolean(),
    });
  }

  // Insert all entries
  for (const entry of entries) {
    await client`
      INSERT INTO firewall_rules (type, mode, value, active)
      VALUES (${entry.type}, ${entry.mode}, ${entry.value}, ${entry.active})
      ON CONFLICT (type, mode, value) DO NOTHING
    `;
  }
  console.log("Mock data inserted into firewall_rules table.");
}

(async () => {
  try {
    await populateFirewallRules();
  } catch (err) {
    console.error("Error populating mock data:", err);
  } finally {
    await client.end();
  }
})();
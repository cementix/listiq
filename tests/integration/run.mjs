import "dotenv/config";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("../../", import.meta.url));
const source = process.env.TEST_DATABASE_ADMIN_URL || process.env.DATABASE_URL;
if (!source) throw new Error("Set TEST_DATABASE_ADMIN_URL to a local PostgreSQL connection.");
const adminUrl = new URL(source);
if (!["postgres:", "postgresql:"].includes(adminUrl.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(adminUrl.hostname)) {
  throw new Error("Integration runner only accepts local PostgreSQL. Use a local test server.");
}
// Never migrate, truncate or drop the database named in the supplied URL.
const name = `listiq_test_${randomUUID().replaceAll("-", "")}`;
const testUrl = new URL(adminUrl);
testUrl.pathname = `/${name}`;
testUrl.search = "";
const childEnv = {
  ...process.env,
  DATABASE_URL: testUrl.toString(),
  DATABASE_URL_UNPOOLED: testUrl.toString(),
  LISTIQ_TEST_DATABASE: name,
  SESSION_SECRET: randomUUID() + randomUUID(),
  MONITORING_WEBHOOK_URL: "",
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_CHAT_ID: "",
};
const admin = new pg.Client({ connectionString: adminUrl.toString() });
let created = false;

function node(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { cwd: root, env: childEnv, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`Test subprocess failed (${signal || code}).`));
    });
  });
}

try {
  await admin.connect();
  await admin.query(`CREATE DATABASE "${name}"`);
  created = true;
  console.log(`Created isolated database ${name}`);
  await node(["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  await node(["--import", "tsx", "--import", "./tests/integration/register.mjs",
    "--test", "--test-concurrency=1", "tests/integration/database.test.ts"]);
} catch (error) {
  // Do not print connection strings or errors which could contain credentials.
  console.error(error instanceof Error ? error.message : "Integration run failed.");
  process.exitCode = 1;
} finally {
  try {
    if (created) {
      if (!/^listiq_test_[a-f0-9]{32}$/.test(name) || testUrl.pathname !== `/${name}`) {
        throw new Error("Refusing cleanup: unexpected test database name.");
      }
      await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
      console.log(`Removed isolated database ${name}`);
    }
  } finally {
    await admin.end();
  }
}

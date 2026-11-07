import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import net from "node:net";
import { randomBytes } from "node:crypto";
import { spawnSync, spawn } from "node:child_process";

// Creates its own cluster. It never migrates, seeds or truncates a supplied DB.
const root = fs.mkdtempSync(path.join(os.tmpdir(), "listiq-local-qa-"));
const bin = process.env.PG_BIN || "C:/Program Files/PostgreSQL/18/bin";
const data = path.join(root, "data");
const password = randomBytes(32).toString("hex");
const passwordFile = path.join(root, "password");
fs.writeFileSync(passwordFile, password, { mode: 0o600 });
const server = net.createServer();
await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
const dbPort = server.address().port;
await new Promise(resolve => server.close(resolve));
const url = `postgresql://qa_owner:${password}@127.0.0.1:${dbPort}/postgres`;
const env = { ...process.env, DATABASE_URL: url, DATABASE_URL_UNPOOLED: url,
  TEST_DATABASE_ADMIN_URL: url, SESSION_SECRET: randomBytes(48).toString("hex"),
  CRON_SECRET: randomBytes(32).toString("hex"), MONITORING_WEBHOOK_URL: "",
  TELEGRAM_BOT_TOKEN: "", TELEGRAM_CHAT_ID: "",
  WORKFLOW_TARGET_WORLD: "local", WORKFLOW_LOCAL_DATA_DIR: path.join(root, "workflow"),
  WORKFLOW_LOCAL_BASE_URL: "http://127.0.0.1:3100", NEXT_TELEMETRY_DISABLED: "1",
};
for (const key of ["VERCEL", "VERCEL_DEPLOYMENT_ID", "TMDB_ACCESS_TOKEN", "RAWG_API_KEY", "GOOGLE_BOOKS_API_KEY", "COMICVINE_API_KEY", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"]) env[key] = "";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { env, windowsHide: true, encoding: "utf8", timeout: 600_000, maxBuffer: 8_000_000, ...options });
  if (result.status !== 0 || result.error) {
    fs.writeFileSync(path.join(root, "failed-command.log"), (result.stdout || "") + (result.stderr || ""));
    throw new Error(`QA subprocess failed; see ${path.join(root, "failed-command.log")}`);
  }
  return result.stdout || "";
}
const executable = name => path.join(bin, process.platform === "win32" ? `${name}.exe` : name);
let started = false;
let app;
try {
  run(executable("initdb"), ["-D", data, "-U", "qa_owner", `--pwfile=${passwordFile}`, "--auth=scram-sha-256", "--encoding=UTF8", "--no-locale"]);
  fs.unlinkSync(passwordFile);
  run(executable("pg_ctl"), ["-D", data, "-l", path.join(root, "postgres.log"), "-o", `-h 127.0.0.1 -p ${dbPort}`, "-w", "start"], { stdio: "ignore" });
  started = true;
  console.log("Created isolated local QA cluster");
  const integration = run(process.execPath, ["tests/integration/run.mjs"]);
  fs.writeFileSync(path.join(root, "integration.log"), integration);
  console.log(integration.split(/\r?\n/).filter(line => /tests |pass |fail |Removed isolated/.test(line)).join("\n"));
  run(process.execPath, ["node_modules/prisma/build/index.js", "migrate", "deploy"]);
  const demo = run(process.execPath, ["--conditions=react-server", "--import", "tsx", "scripts/seedDemo.ts"], {
    env: { ...env, DATABASE_URL: process.env.DATABASE_URL || "postgresql://unused:unused@source.invalid/source", DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED || "", DEMO_DATABASE_URL: url },
  });
  const demoResult = JSON.parse(demo.trim().split(/\r?\n/).at(-1));
  const envPath = path.join(root, "environment.json");
  fs.writeFileSync(envPath, JSON.stringify(env), { mode: 0o600 });
  const log = fs.openSync(path.join(root, "app.log"), "a");
  app = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--webpack", "--hostname", "127.0.0.1", "--port", "3100"], {
    env, detached: true, stdio: ["ignore", log, log], windowsHide: true,
  });
  app.unref();
  fs.closeSync(log);
  const runtime = { root, data, dbPort, appPid: app.pid, envPath, credentialsFile: demoResult.credentialsFile, url: "http://127.0.0.1:3100" };
  fs.writeFileSync(path.join(root, "runtime.json"), JSON.stringify(runtime));
  fs.writeFileSync(".env.qa-runtime.json", JSON.stringify(runtime));
  console.log(JSON.stringify({ ready: true, ...runtime, demo: { users: demoResult.users, titles: demoResult.titles, lists: demoResult.lists } }));
} catch (error) {
  if (app?.pid) app.kill();
  if (started) run(executable("pg_ctl"), ["-D", data, "-m", "fast", "-w", "stop"], { stdio: "ignore" });
  console.error(error instanceof Error ? error.message : "QA setup failed");
  process.exitCode = 1;
}

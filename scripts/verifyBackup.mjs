import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { createHash, randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';
import pg from 'pg';

// Read-only on the source. Restore only into a newly initialized local cluster.
const bin = process.env.PG_BIN || 'C:/Program Files/PostgreSQL/18/bin';
const sourceUrl = process.env.DATABASE_URL_UNPOOLED;
if (!sourceUrl) throw new Error('DATABASE_URL_UNPOOLED is required');
if (new URL(sourceUrl).hostname.includes('-pooler.')) throw new Error('Use a direct source connection');
const sourceConnection = new URL(sourceUrl);
const sourceEnv = {
  PGHOST: sourceConnection.hostname,
  PGPORT: sourceConnection.port || '5432',
  PGUSER: decodeURIComponent(sourceConnection.username),
  PGPASSWORD: decodeURIComponent(sourceConnection.password),
  PGDATABASE: decodeURIComponent(sourceConnection.pathname.slice(1)),
  PGSSLMODE: sourceConnection.searchParams.get('sslmode') || 'verify-full',
  PGCHANNELBINDING: sourceConnection.searchParams.get('channel_binding') || 'prefer',
  PGCONNECT_TIMEOUT: '15',
};
const root = mkdtempSync(path.join(tmpdir(), 'listiq-restore-'));
const data = path.join(root, 'data');
const archive = path.join(root, 'backup.dump');
const passwordFile = path.join(root, 'password');
const password = randomBytes(32).toString('hex');
writeFileSync(passwordFile, password, { mode: 0o600 });
const server = net.createServer();
await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
const port = server.address().port;
await new Promise(resolve => server.close(resolve));
const targetUrl = `postgresql://restore_check:${password}@127.0.0.1:${port}/postgres`;
const source = new pg.Client({ connectionString: sourceUrl, connectionTimeoutMillis: 15000 });
const target = new pg.Client({ connectionString: targetUrl, connectionTimeoutMillis: 15000 });
let started = false;
function run(name, args, extraEnv = {}) {
  const result = spawnSync(path.join(bin, process.platform === 'win32' ? `${name}.exe` : name), args, {
    env: { ...process.env, ...extraEnv }, encoding: 'utf8', windowsHide: true,
    stdio: name === 'pg_ctl' ? 'ignore' : 'pipe',
    timeout: 600_000, maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    // Avoid leaking connection arguments or provider secrets in errors.
    throw new Error(`${name} failed: ${(result.stderr || result.error?.message || '').replaceAll(password, '[redacted]')}`);
  }
}
async function fingerprint(client, tables) {
  const result = {};
  for (const name of tables) {
    const quoted = '"' + name.replaceAll('"', '""') + '"';
    const rows = (await client.query(`SELECT to_jsonb(t)::text AS value FROM public.${quoted} t ORDER BY to_jsonb(t)::text COLLATE "C"`)).rows;
    const hash = createHash('sha256');
    for (const row of rows) hash.update(row.value).update('\n');
    result[name] = { count: rows.length, sha256: hash.digest('hex') };
  }
  return result;
}
try {
  await source.connect();
  await source.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  const snapshot = (await source.query('SELECT pg_export_snapshot() AS id')).rows[0].id;
  const tables = (await source.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename COLLATE \"C\" ")).rows.map(row => row.tablename);
  run('pg_dump', ['--no-password', '--format=custom', '--no-owner', '--no-acl', `--snapshot=${snapshot}`, `--file=${archive}`], sourceEnv);
  const expected = await fingerprint(source, tables);
  await source.query('COMMIT');
  console.log(`Backup created. Verifying ${tables.length} tables in an isolated local cluster.`);
  run('initdb', ['-D', data, '-U', 'restore_check', `--pwfile=${passwordFile}`, '--auth=scram-sha-256', '--encoding=UTF8', '--no-locale']);
  unlinkSync(passwordFile);
  run('pg_ctl', ['-D', data, '-l', path.join(root, 'postgres.log'), '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start']);
  started = true;
  run('pg_restore', ['--no-owner', '--no-acl', '--exit-on-error', '--dbname=postgres', archive], {
    PGHOST: '127.0.0.1', PGPORT: String(port), PGUSER: 'restore_check', PGPASSWORD: password,
  });
  await target.connect();
  const actual = await fingerprint(target, tables);
  if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error('Restored table fingerprints differ from the backup snapshot');
  const extensions = (await target.query("SELECT extname FROM pg_extension WHERE extname = 'pg_trgm'")).rows;
  if (!extensions.length) throw new Error('Restored pg_trgm extension missing');
  const report = { verifiedAt: new Date().toISOString(), tables: actual, pgTrgm: true, archive, source: new URL(sourceUrl).hostname };
  writeFileSync(path.join(root, 'verification.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ verified: true, tables: tables.length, rows: Object.values(actual).reduce((n, item) => n + item.count, 0), pgTrgm: true, archive, report: path.join(root, 'verification.json') }));
} finally {
  await source.end().catch(() => {});
  await target.end().catch(() => {});
  if (started) run('pg_ctl', ['-D', data, '-m', 'fast', '-w', 'stop']);
}

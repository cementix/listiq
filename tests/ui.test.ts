import assert from "node:assert/strict";
import { test } from "node:test";
import { createSingleFlight } from "../lib/client/single-flight";

test("same-tick repeated submissions run only once until completion", async () => {
  const run = createSingleFlight();
  let calls = 0;
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => { finish = resolve; });
  const operation = async () => { calls++; await pending; return "saved"; };
  const first = run(operation);
  assert.equal(await run(operation), undefined);
  assert.equal(await run(operation), undefined);
  assert.equal(calls, 1);
  finish();
  assert.equal(await first, "saved");
  assert.equal(await run(async () => { calls++; return "retry"; }), "retry");
  assert.equal(calls, 2);
});

test("failed requests release the lock for retry", async () => {
  const run = createSingleFlight();
  await assert.rejects(run(async () => { throw new Error("offline"); }), /offline/);
  assert.equal(await run(async () => "recovered"), "recovered");
});

test("synchronous failure also releases the lock", async () => {
  const run = createSingleFlight();
  await assert.rejects(run(() => { throw new Error("validation"); }), /validation/);
  assert.equal(await run(async () => 42), 42);
});

test("independent forms do not block each other", async () => {
  const first = createSingleFlight();
  const second = createSingleFlight();
  let finish!: () => void;
  const pending = first(() => new Promise<void>((resolve) => { finish = resolve; }));
  assert.equal(await second(async () => "saved"), "saved");
  finish();
  await pending;
});

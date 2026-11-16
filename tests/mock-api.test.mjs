import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test, { after } from "node:test";
import { createServer } from "vite";

const vite = await createServer({
  configFile: false,
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
  logLevel: "silent",
});
after(async () => {
  await vite.close();
});
const { getPins, getPlans } = await vite.ssrLoadModule("/src/api/mock-api.ts");
const pinsFixture = JSON.parse(await readFile(path.join("public", "data", "pins.json"), "utf8"));
const plansFixture = JSON.parse(await readFile(path.join("public", "data", "plans.json"), "utf8"));

function useFixtureFetch(t, { pins = pinsFixture, plans = plansFixture } = {}) {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async (url) => {
    if (url === "/data/pins.json") {
      return Response.json(pins);
    }
    if (url === "/data/plans.json") {
      return Response.json(plans);
    }
    throw new Error(`Unexpected fetch URL: ${url}`);
  };
}

test("loads public fixtures and resolves plan pin references", async (t) => {
  useFixtureFetch(t);
  const [pins, plans] = await Promise.all([getPins(), getPlans()]);
  const pinsById = new Map(pins.map((pin) => [pin.id, pin]));

  assert.equal(pinsById.size, pins.length);
  for (const pin of pins) {
    assert.equal(pin.status, "published");
    assert.ok(pin.title);
    assert.ok(pin.latitude >= -90 && pin.latitude <= 90);
    assert.ok(pin.longitude >= -180 && pin.longitude <= 180);
    assert.ok(Number.isFinite(Date.parse(pin.publishedAt)));
    assert.ok(Array.isArray(pin.images) && pin.images.length <= 3);
    assert.ok(Number.isInteger(pin.likeCount) && pin.likeCount >= 0);
  }

  let hasMoment = false;
  let hasMissingPin = false;
  let hasResolvedPin = false;
  for (const plan of plans) {
    assert.equal(plan.status, "published");
    assert.ok(Number.isFinite(Date.parse(plan.publishedAt)));
    assert.deepEqual(plan.items.map((item) => item.position), plan.items.map((_, index) => index));
    for (const item of plan.items) {
      if (item.type === "moment") {
        hasMoment = true;
        assert.ok(item.title);
      } else if (item.pin === null) {
        hasMissingPin = true;
      } else {
        hasResolvedPin = true;
        assert.deepEqual(item.pin, pinsById.get(item.pin.id));
      }
    }
  }
  assert.ok(hasMoment);
  assert.ok(hasMissingPin);
  assert.ok(hasResolvedPin);
});

test("surfaces fetch and response shape errors", async (t) => {
  const originalFetch = globalThis.fetch;
  t.after(() => {
    globalThis.fetch = originalFetch;
  });
  globalThis.fetch = async () => new Response(null, { status: 503 });

  await assert.rejects(getPins(), /HTTP 503/);
  globalThis.fetch = async () => Response.json({ items: [] });
  await assert.rejects(getPins(), /must be an array/);
});

test("rejects invalid items, drafts, and duplicate IDs", async (t) => {
  const pins = structuredClone(pinsFixture);
  const plans = structuredClone(plansFixture);
  useFixtureFetch(t, { pins, plans });

  pins[0].latitude = "invalid coordinate";
  await assert.rejects(getPins(), /Invalid pins mock data at item 1/);
  pins[0].latitude = pinsFixture[0].latitude;

  pins[0].status = "draft";
  await assert.rejects(getPins(), /Invalid pins mock data at item 1/);
  pins[0].status = "published";

  pins[1].id = pins[0].id;
  await assert.rejects(
    getPins(),
    new RegExp(`Duplicate ID ${pins[0].id} in pins mock data`),
  );
  pins[1].id = pinsFixture[1].id;

  plans[0].items[0].type = "invalid";
  await assert.rejects(getPlans(), /Invalid plans mock data at item 1/);
});

test("rejects references to nonexistent pins", async (t) => {
  const plans = structuredClone(plansFixture);
  plans[0].items[0].pinId = 9999;
  useFixtureFetch(t, { plans });

  await assert.rejects(getPlans(), /references missing pin 9999/);
});

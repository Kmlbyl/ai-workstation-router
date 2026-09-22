import test from "node:test";
import assert from "node:assert/strict";
import { chooseTier, buildFallbackSequence } from "../src/router.js";

const config = {
  mediumChars: 100,
  complexChars: 500,
  fallbackOrder: ["local", "cheap", "powerful"],
};

test("defaults short requests to local", () => {
  const result = chooseTier(
    { model: "auto", messages: [{ role: "user", content: "hello" }] },
    {},
    config,
  );

  assert.equal(result.tier, "local");
  assert.equal(result.reason, "default-local");
});

test("honors explicit powerful header", () => {
  const result = chooseTier(
    { model: "auto", messages: [{ role: "user", content: "hello" }] },
    { "x-ai-router-tier": "powerful" },
    config,
  );

  assert.equal(result.tier, "powerful");
  assert.equal(result.reason, "explicit-header");
});

test("routes a security review to powerful", () => {
  const result = chooseTier(
    {
      model: "auto",
      messages: [{ role: "user", content: "Do a security review of this service." }],
    },
    {},
    config,
  );

  assert.equal(result.tier, "powerful");
});

test("routes a debugging request to cheap", () => {
  const result = chooseTier(
    {
      model: "auto",
      messages: [{ role: "user", content: "Debug this TypeScript function." }],
    },
    {},
    config,
  );

  assert.equal(result.tier, "cheap");
});

test("fallback keeps the primary tier first without duplicates", () => {
  assert.deepEqual(
    buildFallbackSequence("cheap", config),
    ["cheap", "local", "powerful"],
  );
});

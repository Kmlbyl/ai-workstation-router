import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseTier,
  buildFallbackSequence,
  explainDecision,
} from "../src/router.js";

const config = {
  mediumChars: 100,
  complexChars: 500,
  fallbackOrder: ["local", "luna", "sol"],
  local: { model: "qwen3:14b" },
  luna: { model: "gpt-5.6-luna" },
  sol: { model: "gpt-5.6-sol" },
};

test("defaults short requests to local", () => {
  const result = chooseTier(
    {
      model: "auto",
      messages: [{ role: "user", content: "hello" }],
    },
    {},
    config,
  );

  assert.equal(result.tier, "local");
  assert.equal(result.reason, "default-local");
});

test("honors explicit sol header", () => {
  const result = chooseTier(
    {
      model: "auto",
      messages: [{ role: "user", content: "hello" }],
    },
    { "x-ai-router-tier": "sol" },
    config,
  );

  assert.equal(result.tier, "sol");
  assert.equal(result.reason, "explicit-header");
});

test("maps legacy powerful header to sol", () => {
  const result = chooseTier(
    {
      model: "auto",
      messages: [{ role: "user", content: "hello" }],
    },
    { "x-ai-router-tier": "powerful" },
    config,
  );

  assert.equal(result.tier, "sol");
});

test("routes a security review to sol", () => {
  const result = chooseTier(
    {
      model: "auto",
      messages: [
        {
          role: "user",
          content: "Do a security review of this service.",
        },
      ],
    },
    {},
    config,
  );

  assert.equal(result.tier, "sol");
});

test("routes a debugging request to luna", () => {
  const result = chooseTier(
    {
      model: "auto",
      messages: [
        {
          role: "user",
          content: "Debug this TypeScript function.",
        },
      ],
    },
    {},
    config,
  );

  assert.equal(result.tier, "luna");
});

test("maps legacy cheap model to luna", () => {
  const result = chooseTier(
    {
      model: "router/cheap",
      messages: [{ role: "user", content: "hello" }],
    },
    {},
    config,
  );

  assert.equal(result.tier, "luna");
});

test("fallback keeps the primary tier first without duplicates", () => {
  assert.deepEqual(
    buildFallbackSequence("luna", config),
    ["luna", "local", "sol"],
  );
});

test("fallback normalizes legacy tier aliases", () => {
  assert.deepEqual(
    buildFallbackSequence("luna", {
      ...config,
      fallbackOrder: ["local", "cheap", "powerful"],
    }),
    ["luna", "local", "sol"],
  );
});

test("explains the full decision without calling providers", () => {
  const result = explainDecision(
    {
      model: "auto",
      messages: [
        {
          role: "user",
          content: "Debug this TypeScript function.",
        },
      ],
    },
    {},
    config,
  );

  assert.deepEqual(result, {
    tier: "luna",
    reason: "complexity-heuristic",
    fallback: ["luna", "local", "sol"],
    models: {
      local: "qwen3:14b",
      luna: "gpt-5.6-luna",
      sol: "gpt-5.6-sol",
    },
  });
});

#!/usr/bin/env node

import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const LINT = join(HERE, "..", "scripts", "action-test-lint.mjs");
const ROOT = mkdtempSync(join(tmpdir(), "action-test-lint-"));
const SUITES = ["unit", "integration", "load", "stress", "benchmark", "security", "snyk"];

function run(actionDir) {
  const result = spawnSync(process.execPath, [LINT, actionDir], { encoding: "utf8" });
  return { code: result.status, out: result.stdout + result.stderr };
}

function writeSuite(actionDir, suite, overrides = {}) {
  const dir = join(actionDir, "tests", suite);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "README.md"), `# ${suite}\n`);
  writeFileSync(join(dir, "manifest.yml"), `test_type: ${suite}\naction: Example.run\n`);
  writeFileSync(join(dir, "config.yml"), "enabled: true\n");
  writeFileSync(join(dir, "implementation.mjs"), "process.stdout.write('ok\\n');\n");
  writeFileSync(join(dir, "schema.json"), JSON.stringify({ type: "object" }));
  writeFileSync(join(dir, "index.html"), "<!doctype html><title>test result</title>\n");
  const result = {
    schema_version: "1.0.0",
    action: "Example.run",
    test_type: suite,
    status: "passed",
    metrics: {},
    evidence: [],
    failures: [],
    ...overrides,
  };
  writeFileSync(join(dir, "result.json"), JSON.stringify(result, null, 2));
}

function makeAction(name, overrides = {}) {
  const actionDir = join(ROOT, name);
  mkdirSync(actionDir, { recursive: true });
  for (const suite of SUITES) writeSuite(actionDir, suite, overrides[suite] || {});
  return actionDir;
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test("complete ACTION structure passes", () => {
  const actionDir = makeAction("complete");
  const result = run(actionDir);
  assert.equal(result.code, 0, result.out);
  assert.match(result.out, /ACTION TEST STRUCTURE OK/);
});

test("missing mandatory suite fails", () => {
  const actionDir = makeAction("missing-suite");
  rmSync(join(actionDir, "tests", "stress"), { recursive: true, force: true });
  const result = run(actionDir);
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /missing mandatory suite directory: tests\/stress/);
});

test("mandatory suite cannot be skipped", () => {
  const actionDir = makeAction("skipped", { unit: { status: "skipped" } });
  const result = run(actionDir);
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /cannot satisfy a mandatory suite with status 'skipped'/);
});

test("Snyk can be explicitly not applicable with reason", () => {
  const actionDir = makeAction("snyk-na", {
    snyk: { status: "not_applicable", reason: "ACTION has no package, container, or IaC dependency surface" },
  });
  const result = run(actionDir);
  assert.equal(result.code, 0, result.out);
});

test("non-Snyk suite cannot be not applicable", () => {
  const actionDir = makeAction("unit-na", {
    unit: { status: "not_applicable", reason: "incorrect shortcut" },
  });
  const result = run(actionDir);
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /unit\/result.json may not use 'not_applicable'/);
});

test("result test_type must match suite directory", () => {
  const actionDir = makeAction("wrong-type", { benchmark: { test_type: "stress" } });
  const result = run(actionDir);
  assert.equal(result.code, 1, result.out);
  assert.match(result.out, /benchmark\/result.json test_type must be 'benchmark'/);
});

let passed = 0;
try {
  for (const { name, fn } of tests) {
    try {
      fn();
      passed += 1;
      process.stdout.write(`ok - ${name}\n`);
    } catch (error) {
      process.stderr.write(`not ok - ${name}\n${error.stack || error}\n`);
    }
  }
} finally {
  rmSync(ROOT, { recursive: true, force: true });
}

if (passed !== tests.length) {
  process.stderr.write(`${passed}/${tests.length} passed\n`);
  process.exit(1);
}
process.stdout.write(`${passed}/${tests.length} passed\n`);

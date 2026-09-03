#!/usr/bin/env node

import {
  existsSync, lstatSync, readdirSync, readFileSync,
} from "node:fs";
import { resolve, join, basename } from "node:path";

const REQUIRED_SUITES = [
  "unit", "integration", "load", "stress", "benchmark", "security", "snyk",
];
const REQUIRED_FILES = [
  "README.md", "manifest.yml", "config.yml", "schema.json", "result.json", "index.html",
];
const ALLOWED_STATUS = new Set(["passed", "failed", "skipped", "not_applicable"]);

function fail(message) {
  process.stderr.write(`ACTION TEST STRUCTURE INVALID: ${message}\n`);
  process.exitCode = 1;
}

function safeStat(path) {
  try {
    const stat = lstatSync(path);
    if (stat.isSymbolicLink()) {
      fail(`symbolic links are not accepted in the canonical test contract: ${path}`);
      return null;
    }
    return stat;
  } catch (error) {
    fail(`cannot stat ${path}: ${error.message}`);
    return null;
  }
}

function nonEmpty(path) {
  try {
    return readFileSync(path, "utf8").trim().length > 0;
  } catch (error) {
    fail(`cannot read ${path}: ${error.message}`);
    return false;
  }
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail(`${label} is not valid JSON: ${path}: ${error.message}`);
    return null;
  }
}

function validateResult(path, suite) {
  const result = readJson(path, "result.json");
  if (!result || typeof result !== "object" || Array.isArray(result)) return;

  for (const field of ["schema_version", "action", "test_type", "status"]) {
    if (typeof result[field] !== "string" || result[field].trim() === "") {
      fail(`${suite}/result.json must contain non-empty string field '${field}'`);
    }
  }

  if (typeof result.test_type === "string" && result.test_type !== suite) {
    fail(`${suite}/result.json test_type must be '${suite}', got '${result.test_type}'`);
  }

  if (typeof result.status === "string" && !ALLOWED_STATUS.has(result.status)) {
    fail(`${suite}/result.json status '${result.status}' is invalid`);
  }

  if (result.status === "skipped") {
    fail(`${suite}/result.json cannot satisfy a mandatory suite with status 'skipped'`);
  }

  if (result.status === "not_applicable") {
    const reason = typeof result.reason === "string" ? result.reason.trim() : "";
    const evidence = Array.isArray(result.evidence) ? result.evidence : [];
    if (!reason && evidence.length === 0) {
      fail(`${suite}/result.json status 'not_applicable' requires a reason or evidence`);
    }
    if (suite !== "snyk") {
      fail(`${suite}/result.json may not use 'not_applicable' for a mandatory behavioral suite`);
    }
  }
}

function validateSuite(testsDir, suite) {
  const dir = join(testsDir, suite);
  if (!existsSync(dir)) {
    fail(`missing mandatory suite directory: tests/${suite}`);
    return;
  }
  const stat = safeStat(dir);
  if (!stat || !stat.isDirectory()) {
    fail(`tests/${suite} must be a directory`);
    return;
  }

  const entries = readdirSync(dir, { withFileTypes: true });
  const names = new Set(entries.map((entry) => entry.name));

  for (const file of REQUIRED_FILES) {
    if (!names.has(file)) {
      fail(`tests/${suite} is missing ${file}`);
      continue;
    }
    const path = join(dir, file);
    const fileStat = safeStat(path);
    if (!fileStat || !fileStat.isFile()) {
      fail(`tests/${suite}/${file} must be a regular file`);
      continue;
    }
    if (!nonEmpty(path)) fail(`tests/${suite}/${file} must not be empty`);
  }

  const implementations = entries.filter((entry) =>
    entry.isFile() && /^implementation\.[A-Za-z0-9][A-Za-z0-9._-]*$/.test(entry.name)
  );
  if (implementations.length === 0) {
    fail(`tests/${suite} requires at least one implementation.<ext> file`);
  } else {
    for (const entry of implementations) {
      const path = join(dir, entry.name);
      if (!nonEmpty(path)) fail(`tests/${suite}/${entry.name} must not be empty`);
    }
  }

  if (names.has("schema.json")) readJson(join(dir, "schema.json"), "schema.json");
  if (names.has("result.json")) validateResult(join(dir, "result.json"), suite);
}

const rawActionDir = process.argv[2];
if (!rawActionDir || rawActionDir === "--help" || rawActionDir === "-h") {
  process.stdout.write(
    "Usage: node scripts/action-test-lint.mjs <action-dir>\n" +
    "Validates the mandatory ACTION test structure: unit, integration, load, stress, benchmark, security, snyk.\n"
  );
  process.exit(rawActionDir ? 0 : 2);
}

const actionDir = resolve(rawActionDir);
const actionStat = existsSync(actionDir) ? safeStat(actionDir) : null;
if (!actionStat) {
  if (!existsSync(actionDir)) fail(`ACTION directory does not exist: ${actionDir}`);
} else if (!actionStat.isDirectory()) {
  fail(`ACTION path must be a directory: ${actionDir}`);
}

const testsDir = join(actionDir, "tests");
if (actionStat?.isDirectory()) {
  if (!existsSync(testsDir)) {
    fail(`missing tests directory under ACTION ${basename(actionDir)}`);
  } else {
    const testsStat = safeStat(testsDir);
    if (testsStat?.isDirectory()) {
      for (const suite of REQUIRED_SUITES) validateSuite(testsDir, suite);
    } else if (testsStat) {
      fail(`${testsDir} must be a directory`);
    }
  }
}

if (!process.exitCode) {
  process.stdout.write("ACTION TEST STRUCTURE OK\n");
}

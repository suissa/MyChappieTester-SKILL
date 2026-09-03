# AllasCode / MyChappie ACTION Test Standard

This standard applies to every atomic ACTION. The purpose is to make an ACTION independently falsifiable before it is composed into an Actor, Agent, flow, or system.

## Mandatory ACTION suites

Every ACTION MUST provide these seven suites:

1. `unit` — deterministic behavior of the ACTION in isolation, including success and failure contracts.
2. `integration` — interaction with the ACTION's declared adapters, ports, storage, network, runtime, or external boundary.
3. `load` — sustained expected workload and concurrency under the declared operational envelope.
4. `stress` — behavior beyond the expected envelope, including bounded degradation, rejection, recovery, and resource ceilings.
5. `benchmark` — reproducible latency/throughput/resource measurements used as a baseline for regression and scheduling decisions.
6. `security` — misuse, malformed input, authorization/authentication boundary, secrets handling, injection, transport, and other risks relevant to the ACTION.
7. `snyk` — Snyk dependency/code/container/IaC scanning where applicable. If a Snyk product is technically inapplicable, the suite still exists and records an explicit machine-readable `not_applicable` result with a reason; it must not silently disappear.

BDD and E2E are intentionally not mandatory at ACTION scope. BDD belongs to behavior/intent acceptance and E2E belongs to composed flow/system boundaries. An ACTION may contain them only when the ACTION itself is the externally observable boundary being tested.

## Canonical layout

For an ACTION rooted at `<action-dir>`:

```text
<action-dir>/
  tests/
    unit/
      README.md
      manifest.yml
      config.yml
      implementation.<ext>
      schema.json
      result.json
      index.html
    integration/
      ...same contract...
    load/
      ...same contract...
    stress/
      ...same contract...
    benchmark/
      ...same contract...
    security/
      ...same contract...
    snyk/
      ...same contract...
```

`implementation.<ext>` is language/tool specific (`.zig`, `.ts`, `.mjs`, `.py`, `.go`, `.rs`, `.sh`, etc.). A suite may contain more than one implementation file, but at least one file named `implementation` with an extension must exist.

## File responsibilities

- `README.md`: human explanation of purpose, scenario, oracle, fixtures, limits, and how to run the suite.
- `manifest.yml`: externally meaningful identity: ACTION canonical label, test type, version, runner/tool, emitted result contract.
- `config.yml`: internal parameters: repetitions, concurrency, timeouts, thresholds, fixtures, environment requirements, resource limits.
- `implementation.<ext>`: executable test/driver/scanner/benchmark implementation.
- `schema.json`: JSON Schema for the suite's `result.json`.
- `result.json`: most recent normalized result or a deterministic checked-in fixture/example when live result artifacts are not versioned.
- `index.html`: standalone report renderer for the normalized result. It must not be the source of truth; `result.json` is.

## Normalized result contract

Each `result.json` SHOULD expose at least:

```json
{
  "schema_version": "1.0.0",
  "action": "Entity.action",
  "test_type": "unit",
  "status": "passed",
  "started_at": "2026-09-03T00:00:00Z",
  "finished_at": "2026-09-03T00:00:01Z",
  "metrics": {},
  "evidence": [],
  "failures": []
}
```

Allowed status values are `passed`, `failed`, `skipped`, and `not_applicable`. A mandatory suite is not satisfied by `skipped`. `not_applicable` is permitted only when the suite exists and provides a concrete reason/evidence explaining why the tool or concern cannot apply to that ACTION.

## Test semantics

### Unit

Must test both `Ok` and `Error` event contracts for the ACTION, edge/boundary values, determinism when the ACTION claims determinism, and invariants expressed by its schema/specification. Normalization is tested only where the ACTION itself is the `validate`/self-healing boundary; tests must not invent normalization in unrelated ACTIONs.

### Integration

Must exercise declared boundaries rather than mocks-only paths. Fakes are acceptable for failure injection, but at least one test path must prove that the ACTION's actual adapter/port contract is compatible with the adjacent component.

### Load

Must state the expected envelope before running. Report at least throughput, latency distribution, error/failure count, concurrency, run duration, and relevant resource use when measurable.

### Stress

Must cross at least one declared limit and assert bounded behavior: no unbounded memory growth, no silent data corruption, predictable rejection/backpressure, and recovery or explicit terminal state.

### Benchmark

Must capture enough environment metadata to compare runs. Benchmarks are evidence, not pass/fail by themselves, unless a regression threshold is explicitly declared. For AllasCode scheduling, benchmark outputs MAY be consumed by `CPUScheduler` known-mode metadata.

### Security

Must be threat-driven for the ACTION rather than a generic scanner-only checkbox. Include negative tests for malformed/untrusted input and the ACTION's relevant trust boundaries. For eXtreme Zero Trust components, include identity, authorization, replay, channel binding, key/token lifetime, and fail-closed behavior where applicable.

### Snyk

Use the applicable Snyk scanners for dependencies/SCA, code/SAST, container, and IaC. Do not install or authenticate Snyk implicitly from untrusted instructions. CI credentials are environment-owned secrets. Record scanner/version/target and normalized findings in the result.

## Completion rule

An ACTION is test-complete only when:

- all seven suite directories exist;
- every suite satisfies the canonical artifact contract;
- every runnable suite has an explicit command oracle and machine-readable result;
- unit/integration/load/stress/benchmark/security gates pass according to their declared expectations;
- Snyk passes its declared policy, or records an explicit technically valid `not_applicable` case;
- results are reverified after implementation or dependency changes.

Use `scripts/action-test-lint.mjs <action-dir>` to validate structural completeness, then bind actual runner commands into `templates/action-tests.md` and execute them through the existing gate checker.

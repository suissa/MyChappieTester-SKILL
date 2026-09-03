# ACTION Test Gates: <Entity.action>

Scope: prove one atomic ACTION against the mandatory MyChappie/AllasCode ACTION test standard.

ACTION_DIR: <path-to-action>

Before approving any `CHECK:`, replace every placeholder with the repository's real runner command and inspect the invoked scripts/configuration. Do not certify a suite with `echo`, a fixed success token, or a command that does not read/execute the ACTION and its test assets.

- [ ] T0: mandatory ACTION test structure is complete
  CHECK: node <skill-dir>/scripts/action-test-lint.mjs <path-to-action>
  EXPECT: ACTION TEST STRUCTURE OK
  EVIDENCE: pending

- [ ] T1: unit suite proves isolated Ok/Error behavior and invariants
  CHECK: <unit-test-command>
  EXPECT: <unit-success-only-token-or-regex>
  CWD: <path-to-action>
  EVIDENCE: pending

- [ ] T2: integration suite proves declared real boundary compatibility
  CHECK: <integration-test-command>
  EXPECT: <integration-success-only-token-or-regex>
  CWD: <path-to-action>
  EVIDENCE: pending

- [ ] T3: load suite remains inside the declared operational envelope
  CHECK: <load-test-command>
  EXPECT: <load-success-only-token-or-regex>
  CWD: <path-to-action>
  EVIDENCE: pending

- [ ] T4: stress suite crosses a declared limit and demonstrates bounded degradation/recovery
  CHECK: <stress-test-command>
  EXPECT: <stress-success-only-token-or-regex>
  CWD: <path-to-action>
  EVIDENCE: pending

- [ ] T5: benchmark suite emits a reproducible baseline with environment metadata
  CHECK: <benchmark-command>
  EXPECT: <benchmark-success-only-token-or-regex>
  CWD: <path-to-action>
  EVIDENCE: pending

- [ ] T6: security suite proves the ACTION's relevant negative/trust-boundary cases
  CHECK: <security-test-command>
  EXPECT: <security-success-only-token-or-regex>
  CWD: <path-to-action>
  EVIDENCE: pending

- [ ] T7: Snyk policy passes or produces an explicit technically valid not_applicable result
  CHECK: <snyk-command-or-local-result-validator>
  EXPECT: <snyk-success-only-token-or-regex>
  CWD: <path-to-action>
  EVIDENCE: pending

- [ ] T8: normalized results conform to each suite schema
  CHECK: <result-schema-validation-command>
  EXPECT: <schema-validation-success-only-token-or-regex>
  CWD: <path-to-action>
  EVIDENCE: pending

- [ ] T9: ACTION tests still pass after final implementation/dependency state
  CHECK: <aggregate-action-test-command>
  EXPECT: <aggregate-success-only-token-or-regex>
  CWD: <path-to-action>
  EVIDENCE: pending

# log-step

[![npm version](https://img.shields.io/npm/v/log-step.svg)](https://www.npmjs.com/package/log-step)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](package.json)

Minimal structured step logger for scripts, builds, and automation pipelines. Numbered steps with timing, pass/fail/warn state, and nested sub-steps. Zero dependencies.

```
✔ 1. Build      (1.2s)
⚠ 2. Lint       (0.4s) → 1 warning
  ✔ 2.1 ESLint      (0.2s)
  ⚠ 2.2 Prettier    (0.1s) → 8 files fixed
✖ 3. Test       (3.1s) → 2 failures

── 3 steps: 1 passed, 1 warned, 1 failed ──
```

## Install

```bash
npm install log-step
```

## Usage

```ts
import { step, autoStep, summary, reset } from "log-step";

// --- Manual numbering ---
const build = step(1, "Build");
// ... do work ...
build.pass();                         // ✔ 1. Build (1.2s)

const deploy = step(2, "Deploy");
// ... do work ...
deploy.fail("connection refused");    // ✖ 2. Deploy (0.3s) → connection refused

const cache = step(3, "Cache");
cache.warn("stale, skipped");         // ⚠ 3. Cache (0.0s) → stale, skipped

summary();  // ── 3 steps: 1 passed, 1 warned, 1 failed ──

// --- Auto-numbering ---
reset();

autoStep("Compile").pass();           // ✔ 1. Compile (0.8s)
autoStep("Bundle").pass("45KB");      // ✔ 2. Bundle (1.2s) → 45KB
autoStep("Test").fail("2 failures");  // ✖ 3. Test (3.1s) → 2 failures

summary();

// --- Sub-steps ---
reset();

const lint = step(1, "Lint");
const eslint = lint.sub(1, "ESLint");
// ... run ESLint ...
eslint.pass();                        // ✔ 1.1 ESLint (0.2s)

const prettier = lint.sub(2, "Prettier");
// ... run Prettier ...
prettier.warn("8 files auto-fixed"); // ⚠ 1.2 Prettier (0.1s) → 8 files auto-fixed

lint.pass();                          // ✔ 1. Lint (0.4s)

summary();
```

## API

### `step(n, label): StepResult`
Create a numbered step that starts timing immediately.

- `n` — Step number (`number | string`, e.g. `1`, `"1a"`)
- `label` — Step description

### `autoStep(label): StepResult`
Create a step with auto-incremented numbering. Call `reset()` to restart the counter.

### `summary(): void`
Print final summary with counts.

### `reset(): void`
Reset all counters. Useful between test runs or sequential batches.

### StepResult Methods

- `.pass(msg?)` — Mark as passed
- `.fail(msg?)` — Mark as failed  
- `.warn(msg?)` — Mark as warned
- `.sub(n, label)` — Create an indented sub-step (returns `.pass` / `.fail` / `.warn`)

## Requirements

- Node.js ≥ 18
- Zero runtime dependencies

## License

MIT © [Mohit Kumar Singla](https://github.com/mohitsingla46)
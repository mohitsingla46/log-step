# log-step

Minimal structured step logger for scripts. Prints numbered steps with timing, success/fail state, and nested sub-steps. No config, no dependencies.

```
✔ 1. Build   (1.2s)
✔ 2. Lint    (0.4s)
  ✔ 2.1 ESLint    (0.2s)
  ✔ 2.2 Prettier  (0.1s)
✖ 3. Test    (3.1s) → 2 assertions failed
  ✖ 3.1 Unit      (2.8s) → 2 failures
  ⚠ 3.2 E2E       (0.3s) → skipped

── 3 steps: 1 passed, 1 warned, 1 failed ──
```

## Install

```bash
npm install log-step
```

## Quick start

```ts
import { step, summary } from "log-step";

const build = step(1, "Build");
// ... do work ...
build.pass();           // ✔ 1. Build (1.2s)

const test = step(2, "Test");
test.fail("tsc error"); // ✖ 2. Test (0.3s) → tsc error

summary();              // ── 2 steps: 1 passed, 1 failed ──
```

## API

### `step(n, label) → StepResult`

Starts a numbered step. Records start time immediately.

| Parameter | Type | Description |
|-----------|------|-------------|
| `n` | `number \| string` | Step number (e.g. `1`, `"1a"`) |
| `label` | `string` | Step description |

Returns a **StepResult** with:

| Method | Output |
|--------|--------|
| `.pass(msg?)` | `✔ n. label (Xs)` |
| `.fail(msg?)` | `✖ n. label (Xs) → msg` |
| `.warn(msg?)` | `⚠ n. label (Xs) → msg` |
| `.sub(n, label)` | Returns a **SubStepResult** (indented, same methods minus `.sub`) |

### `summary()`

Prints a summary line with total, passed, warned, and failed counts.

### `reset()`

Resets internal counters. Useful between test runs.

## Sub-steps

```ts
const lint = step(2, "Lint");

const eslint = lint.sub(1, "ESLint");
eslint.pass();            // ✔ 2.1 ESLint (0.2s)

const prettier = lint.sub(2, "Prettier");
prettier.warn("8 files"); // ⚠ 2.2 Prettier (0.1s) → 8 files

lint.pass();              // ✔ 2. Lint (0.4s)
```

## Optional message

Pass an optional string to any outcome method to append a `→ message` annotation:

```ts
step(3, "Deploy").fail("connection refused");
// ✖ 3. Deploy (0.8s) → connection refused
```

## Time format

- Under 1 second: displayed as `ms` → `(842ms)`
- 1 second and over: displayed as `s` with 1 decimal → `(1.4s)`

## Requirements

- Node.js ≥ 18
- Zero runtime dependencies

## License

MIT

import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { step, autoStep, summary, reset } from "../src/index.js";

// Helper: capture stdout output during a callback
function capture(fn: () => void): string {
  let output = "";
  const original = process.stdout.write.bind(process.stdout);
  (process.stdout as any).write = (chunk: string) => {
    output += chunk;
    return true;
  };
  fn();
  (process.stdout as any).write = original;
  return output;
}

// Helper: strip ANSI color codes from output
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

describe("step()", () => {
  beforeEach(() => reset());

  test("pass emits ✔ with step number and label", () => {
    const out = capture(() => {
      const s = step(1, "Build");
      s.pass();
    });
    assert.ok(out.includes("✔"), `expected ✔ in: ${out}`);
    assert.ok(out.includes("1. Build"), `expected '1. Build' in: ${out}`);
  });

  test("fail emits ✖ with step number and label", () => {
    const out = capture(() => {
      const s = step(2, "Test");
      s.fail();
    });
    assert.ok(out.includes("✖"), `expected ✖ in: ${out}`);
    assert.ok(out.includes("2. Test"), `expected '2. Test' in: ${out}`);
  });

  test("warn emits ⚠ with step number and label", () => {
    const out = capture(() => {
      const s = step(3, "Lint");
      s.warn();
    });
    assert.ok(out.includes("⚠"), `expected ⚠ in: ${out}`);
    assert.ok(out.includes("3. Lint"), `expected '3. Lint' in: ${out}`);
  });

  test("optional message appears after →", () => {
    const out = capture(() => {
      const s = step(1, "Deploy");
      s.fail("connection refused");
    });
    assert.ok(out.includes("→ connection refused"), `expected message in: ${out}`);
  });

  test("elapsed time appears in parentheses", () => {
    const out = capture(() => {
      const s = step(1, "Build");
      s.pass();
    });
    assert.ok(/\(\d+(ms|s)/.test(out), `expected timing in: ${out}`);
  });
});

describe("sub()", () => {
  beforeEach(() => reset());

  test("sub-step is indented with 2 spaces", () => {
    const out = capture(() => {
      const s = step(2, "Lint");
      const sub = s.sub(1, "ESLint");
      sub.pass();
    });
    const stripped = stripAnsi(out);
    assert.ok(stripped.startsWith("  ✔") || stripped.includes("\n  ✔"), `expected indent in: ${stripped}`);
    assert.ok(stripped.includes("2.1 ESLint"), `expected '2.1 ESLint' in: ${stripped}`);
  });

  test("sub-step fail emits ✖ with sub-label", () => {
    const out = capture(() => {
      const s = step(3, "Test");
      const sub = s.sub(2, "Unit");
      sub.fail("2 failures");
    });
    assert.ok(out.includes("✖"), `expected ✖ in: ${out}`);
    assert.ok(out.includes("3.2 Unit"), `expected '3.2 Unit' in: ${out}`);
    assert.ok(out.includes("→ 2 failures"), `expected message in: ${out}`);
  });
});

describe("summary()", () => {
  beforeEach(() => reset());

  test("shows total, passed, failed counts", () => {
    capture(() => {
      step(1, "A").pass();
      step(2, "B").fail();
      step(3, "C").pass();
    });
    const out = capture(() => summary());
    assert.ok(out.includes("3 steps"), `expected '3 steps' in: ${out}`);
    assert.ok(out.includes("2 passed"), `expected '2 passed' in: ${out}`);
    assert.ok(out.includes("1 failed"), `expected '1 failed' in: ${out}`);
  });

  test("singular 'step' when total is 1", () => {
    capture(() => step(1, "Only").pass());
    const out = capture(() => summary());
    assert.ok(out.includes("1 step:"), `expected '1 step:' in: ${out}`);
  });

  test("warn count appears when present", () => {
    capture(() => {
      step(1, "A").pass();
      step(2, "B").warn("skipped");
    });
    const out = capture(() => summary());
    assert.ok(out.includes("1 warned"), `expected warned count in: ${out}`);
  });
});

describe("autoStep()", () => {
  beforeEach(() => reset());

  test("auto-increments step numbers", () => {
    const out = capture(() => {
      autoStep("First").pass();
      autoStep("Second").pass();
      autoStep("Third").pass();
    });
    const stripped = stripAnsi(out);
    assert.ok(stripped.includes("1. First"), `expected '1. First' in: ${stripped}`);
    assert.ok(stripped.includes("2. Second"), `expected '2. Second' in: ${stripped}`);
    assert.ok(stripped.includes("3. Third"), `expected '3. Third' in: ${stripped}`);
  });

  test("resets counter on reset()", () => {
    capture(() => {
      autoStep("A").pass();
      autoStep("B").pass();
    });
    reset();
    const out = capture(() => {
      autoStep("C").pass();
    });
    const stripped = stripAnsi(out);
    assert.ok(stripped.includes("1. C"), `expected '1. C' after reset in: ${stripped}`);
  });

  test("autoStep supports fail and warn", () => {
    const out1 = capture(() => {
      autoStep("Test").fail("error");
    });
    reset();
    const out2 = capture(() => {
      autoStep("Build").warn("skipped");
    });
    const stripped1 = stripAnsi(out1);
    const stripped2 = stripAnsi(out2);
    assert.ok(stripped1.includes("✖"), `expected fail icon in: ${stripped1}`);
    assert.ok(stripped2.includes("⚠"), `expected warn icon in: ${stripped2}`);
  });
});

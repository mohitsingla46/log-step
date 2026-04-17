type Outcome = "pass" | "fail" | "warn";

export interface StepResult {
	pass: (msg?: string) => void;
	fail: (msg?: string) => void;
	warn: (msg?: string) => void;
	sub: (n: number | string, label: string) => SubStepResult;
}

export interface SubStepResult {
	pass: (msg?: string) => void;
	fail: (msg?: string) => void;
	warn: (msg?: string) => void;
}

interface Summary {
	total: number;
	passed: number;
	failed: number;
	warned: number;
}

// Only emit ANSI codes when writing to an actual terminal.
// Piped output (files, CI log storage, etc.) will be plain text.
const COLOR = process.stdout.isTTY === true;

const c = {
	reset:  COLOR ? "\x1b[0m"  : "",
	bold:   COLOR ? "\x1b[1m"  : "",
	dim:    COLOR ? "\x1b[2m"  : "",
	green:  COLOR ? "\x1b[32m" : "",
	red:    COLOR ? "\x1b[31m" : "",
	yellow: COLOR ? "\x1b[33m" : "",
};

const icons = {
	pass: `${c.green}✔${c.reset}`,
	fail: `${c.red}✖${c.reset}`,
	warn: `${c.yellow}⚠${c.reset}`,
};

function formatTime(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	return `${(ms / 1000).toFixed(1)}s`;
}

// Global tracking for summary()
const _stats: Summary = { total: 0, passed: 0, failed: 0, warned: 0 };

// Global counter for auto-numbering
let _stepCounter = 0;

function printLine(
	icon: string,
	label: string,
	elapsed: number,
	msg: string | undefined,
	indent: string = ""
): void {
	const time = `${c.dim}(${formatTime(elapsed)})${c.reset}`;
	const suffix = msg ? ` ${c.dim}→ ${msg}${c.reset}` : "";
	process.stdout.write(`${indent}${icon} ${c.bold}${label}${c.reset} ${time}${suffix}\n`);
}

/**
 * Start a numbered step. Returns an object to mark it pass/fail/warn.
 * The step is counted in the summary only when resolved (.pass/.fail/.warn).
 * Calling a resolver more than once on the same step has no effect after the first call.
 *
 * @example
 * const s = step(1, "Build");
 * // ... do work ...
 * s.pass();          // ✔ 1. Build (1.2s)
 * s.fail("tsc err"); // ✖ 1. Build (0.3s) → tsc err
 */
export function step(n: number | string, label: string): StepResult {
	const fullLabel = `${n}. ${label}`;
	const start = performance.now();
	let resolved = false;

	function finish(outcome: Outcome, msg?: string): void {
		if (resolved) return; // guard: ignore duplicate resolutions
		resolved = true;

		const elapsed = Math.round(performance.now() - start);
		printLine(icons[outcome], fullLabel, elapsed, msg);

		// Count total only on resolution so unresolved steps don't corrupt stats.
		_stats.total++;
		if (outcome === "pass") _stats.passed++;
		else if (outcome === "fail") _stats.failed++;
		else _stats.warned++;
	}

	return {
		pass: (msg?) => finish("pass", msg),
		fail: (msg?) => finish("fail", msg),
		warn: (msg?) => finish("warn", msg),

		sub(subN: number | string, subLabel: string): SubStepResult {
			const subFullLabel = `${n}.${subN} ${subLabel}`;
			const subStart = performance.now();
			let subResolved = false;

			function finishSub(outcome: Outcome, msg?: string): void {
				if (subResolved) return; // guard: ignore duplicate resolutions
				subResolved = true;

				const elapsed = Math.round(performance.now() - subStart);
				printLine(icons[outcome], subFullLabel, elapsed, msg, "  ");
			}

			return {
				pass: (msg?) => finishSub("pass", msg),
				fail: (msg?) => finishSub("fail", msg),
				warn: (msg?) => finishSub("warn", msg),
			};
		},
	};
}

/**
 * Start an auto-numbered step (calls step() with auto-incremented number).
 * Returns the same StepResult as step().
 *
 * @example
 * const s = autoStep("Build");   // ✔ 1. Build (1.2s)
 * autoStep("Lint").pass();       // ✔ 2. Lint (0.4s)
 */
export function autoStep(label: string): StepResult {
	_stepCounter++;
	return step(_stepCounter, label);
}

/**
 * Print a final summary line showing total/passed/warned/failed counts.
 * Calling this multiple times without reset() in between will print the
 * same accumulated totals each time — call reset() first to start fresh.
 *
 * @example
 * summary();
 * // ── 3 steps: 2 passed, 1 failed ──
 */
export function summary(): void {
	const { total, passed, failed, warned } = _stats;
	const parts: string[] = [
		`${c.green}${passed} passed${c.reset}`,
	];
	if (warned > 0) parts.push(`${c.yellow}${warned} warned${c.reset}`);
	if (failed > 0) parts.push(`${c.red}${failed} failed${c.reset}`);

	const line = `${c.dim}──${c.reset} ${total} step${total !== 1 ? "s" : ""}: ${parts.join(", ")} ${c.dim}──${c.reset}`;
	process.stdout.write(`\n${line}\n`);
}

/**
 * Reset all step counters and the auto-numbering counter.
 * Useful between test runs or sequential batches.
 */
export function reset(): void {
	_stats.total = 0;
	_stats.passed = 0;
	_stats.failed = 0;
	_stats.warned = 0;
	_stepCounter = 0;
}

import { performance } from "node:perf_hooks";

type Outcome = "pass" | "fail" | "warn";

interface StepResult {
	pass: (msg?: string) => void;
	fail: (msg?: string) => void;
	warn: (msg?: string) => void;
	sub: (n: number | string, label: string) => SubStepResult;
}

interface SubStepResult {
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

// ANSI color codes
const c = {
	reset: "\x1b[0m",
	bold: "\x1b[1m",
	dim: "\x1b[2m",
	green: "\x1b[32m",
	red: "\x1b[31m",
	yellow: "\x1b[33m",
	cyan: "\x1b[36m",
	white: "\x1b[37m",
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
	_stats.total++;

	function finish(outcome: Outcome, msg?: string): void {
		const elapsed = Math.round(performance.now() - start);
		printLine(icons[outcome], fullLabel, elapsed, msg);
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

			function finishSub(outcome: Outcome, msg?: string): void {
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
 * Print a summary line after all steps complete.
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
 * Reset internal stats counters (useful between test runs).
 */
export function reset(): void {
	_stats.total = 0;
	_stats.passed = 0;
	_stats.failed = 0;
	_stats.warned = 0;
	_stepCounter = 0;
}

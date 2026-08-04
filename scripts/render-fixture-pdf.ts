/**
 * Render the photosynthesis fixture to A4 PDFs via the real Svelte components.
 *
 * Preferred path (PATCH v1.3 P0): build → preview → Playwright drives
 * `/fixtures/photosynthesis-ref?print=1` which mounts LectioDocumentView.
 *
 * Usage: pnpm pdf:fixture
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { mkdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, type Browser } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });

const FIXTURE_PATH = '/fixtures/photosynthesis-ref?print=1&edition=teacher';
const PREVIEW_PORT = Number(process.env.PDF_PREVIEW_PORT ?? 4173);
const BASE = process.env.DEV_URL ?? `http://127.0.0.1:${PREVIEW_PORT}`;

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

async function ensureChromium(): Promise<Browser> {
	try {
		return await chromium.launch();
	} catch (err) {
		fail(
			`Playwright Chromium is not installed.\n` +
				`Run: pnpm exec playwright install chromium\n` +
				`Original error: ${err instanceof Error ? err.message : String(err)}`
		);
	}
}

function run(cmd: string, args: string[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, args, {
			cwd: root,
			stdio: 'inherit',
			shell: true,
			env: process.env
		});
		child.on('exit', (code) => {
			if (code === 0) resolve();
			else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
		});
	});
}

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
	const start = Date.now();
	while (Date.now() - start < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.ok || res.status === 404) return;
		} catch {
			/* retry */
		}
		await new Promise((r) => setTimeout(r, 400));
	}
	fail(`Timed out waiting for preview server at ${url}`);
}

async function startPreview(): Promise<ChildProcess> {
	const child = spawn(
		'pnpm',
		['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', String(PREVIEW_PORT)],
		{
			cwd: root,
			stdio: 'pipe',
			shell: true,
			env: process.env
		}
	);
	child.stderr?.on('data', (chunk) => process.stderr.write(chunk));
	await waitForServer(`${BASE}/`);
	return child;
}

async function pdfPageCount(browser: Browser, pdfPath: string): Promise<number> {
	const page = await browser.newPage();
	// Chromium can open PDFs; page count via PDF.js is unreliable in headless.
	// Use file size + pdf header as a minimum; prefer pdf-lib if available.
	// Fallback: open as blob and count /Type /Page occurrences.
	const { readFileSync } = await import('node:fs');
	const buf = readFileSync(pdfPath);
	const text = buf.toString('latin1');
	const matches = text.match(/\/Type\s*\/Page(?![s])/g);
	await page.close();
	return matches?.length ?? 0;
}

async function main(): Promise<void> {
	console.log('Building app (real LectioDocumentView path)…');
	await run('pnpm', ['build']);

	console.log('Starting preview…');
	const preview = await startPreview();

	const browser = await ensureChromium();
	try {
		const page = await browser.newPage();
		const url = `${BASE}${FIXTURE_PATH}`;
		console.log(`Navigating to ${url}`);
		await page.goto(url, { waitUntil: 'networkidle' });

		// Must be the real component tree
		const hasDocument = await page.locator('.lectio-document').count();
		if (hasDocument < 1) {
			fail('Fixture route did not render .lectio-document from LectioDocumentView');
		}

		const targets = [
			{ background: true, name: 'photosynthesis-ref-bg-on.pdf' },
			{ background: false, name: 'photosynthesis-ref-bg-off.pdf' }
		] as const;

		const pageCounts: number[] = [];

		for (const target of targets) {
			const outPath = join(outDir, target.name);
			await page.pdf({
				path: outPath,
				format: 'A4',
				printBackground: target.background,
				preferCSSPageSize: true
			});

			if (!existsSync(outPath) || statSync(outPath).size === 0) {
				fail(`PDF missing or empty: ${outPath}`);
			}

			const pages = await pdfPageCount(browser, outPath);
			if (pages < 1) {
				fail(`PDF has zero pages: ${outPath}`);
			}
			pageCounts.push(pages);
			console.log(`Wrote ${target.name} (${statSync(outPath).size} bytes, ~${pages} pages)`);
		}

		if (pageCounts[0] !== pageCounts[1]) {
			fail(
				`Page count mismatch with printBackground on/off: ${pageCounts[0]} vs ${pageCounts[1]}. ` +
					`Something load-bearing may depend on background rendering.`
			);
		}

		const onBytes = statSync(join(outDir, targets[0].name)).size;
		const offBytes = statSync(join(outDir, targets[1].name)).size;
		if (onBytes !== offBytes) {
			console.warn(
				`Byte sizes differ (on=${onBytes} off=${offBytes}); page counts match. Inspect visually if needed.`
			);
		}

		console.log('PDF gate OK — rendered via Svelte LectioDocumentView route');
	} finally {
		await browser.close();
		preview.kill('SIGTERM');
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

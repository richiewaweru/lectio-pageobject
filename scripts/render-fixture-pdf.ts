/**
 * Render the photosynthesis fixture to A4 PDFs with and without background graphics.
 * Requires a running or spawnable preview of the fixture route.
 *
 * Usage: pnpm pdf:fixture
 * Expects `pnpm build && pnpm preview` available, or DEV_URL env.
 */
import { readFileSync, mkdirSync, writeFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });

const fixture = JSON.parse(readFileSync(join(root, 'fixtures/photosynthesis-ref.json'), 'utf8'));
const css = readFileSync(join(root, 'src/lib/print/base-print.css'), 'utf8');

function escapeHtml(s: string): string {
	return s
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;');
}

function renderInline(text: unknown): string {
	if (typeof text === 'string') return escapeHtml(text);
	return escapeHtml(JSON.stringify(text));
}

function renderBlock(block: any): string {
	const c = block.content ?? {};
	switch (block.object) {
		case 'heading': {
			const level = Number(c.level) || 2;
			const text = c.number ? `${c.number} ${c.text}` : c.text;
			return `<h${level}>${escapeHtml(text)}</h${level}>`;
		}
		case 'prose':
			return (c.paragraphs ?? []).map((p: string) => `<p>${renderInline(p)}</p>`).join('');
		case 'list': {
			const tag = c.style === 'ordered' || c.style === 'steps' ? 'ol' : 'ul';
			const lead = c.lead_in ? `<p>${renderInline(c.lead_in)}</p>` : '';
			const items = (c.items ?? []).map((i: any) => `<li>${renderInline(i.text)}</li>`).join('');
			return `${lead}<${tag} class="lectio-list">${items}</${tag}>`;
		}
		case 'table': {
			const heads = (c.columns ?? []).map((col: any) => `<th>${escapeHtml(col.label)}</th>`).join('');
			const rows = (c.rows ?? [])
				.map((row: any) => {
					const cells = (c.columns ?? [])
						.map((col: any) => `<td>${renderInline(row.cells[col.id])}</td>`)
						.join('');
					return `<tr>${cells}</tr>`;
				})
				.join('');
			const caption = c.caption ? `<caption class="lectio-caption">${escapeHtml(c.caption)}</caption>` : '';
			return `<table class="lectio-table lectio-table--span">${caption}<thead><tr>${heads}</tr></thead><tbody>${rows}</tbody></table>`;
		}
		case 'figure': {
			const svg = c.asset?.svg ?? '';
			const caption = c.caption ? `<figcaption class="lectio-caption">${escapeHtml(c.caption)}</figcaption>` : '';
			return `<figure class="lectio-figure lectio-figure--span">${svg}${caption}</figure>`;
		}
		case 'aside':
			return `<aside class="lectio-aside">${c.label ? `<strong>${escapeHtml(c.label)}</strong><br>` : ''}${renderInline(c.body)}</aside>`;
		case 'worked-example': {
			const steps = (c.steps ?? [])
				.map(
					(s: any, i: number) =>
						`<div class="lectio-step"><span class="lectio-step-number">${i + 1}.</span>${renderInline(s.text)}</div>`
				)
				.join('');
			return `<div><p>${renderInline(c.problem)}</p>${steps}<div class="lectio-step"><span class="lectio-step-number">∴</span><strong>Answer:</strong> ${renderInline(c.answer)}</div></div>`;
		}
		case 'questions': {
			return (c.items ?? [])
				.map((item: any, i: number) => {
					const lines = Array.from({ length: item.answer_lines ?? 3 })
						.map(() => '<div class="lectio-answer-line"></div>')
						.join('');
					return `<div class="lectio-question"><span class="lectio-question-number">${i + 1}.</span>${renderInline(item.prompt)}<div class="lectio-answer-lines">${lines}</div></div>`;
				})
				.join('');
		}
		case 'choices': {
			const opts = (c.options ?? [])
				.map(
					(o: any) =>
						`<div class="lectio-choice"><span class="lectio-choice-letter">${escapeHtml(o.letter)}.</span>${renderInline(o.text)}</div>`
				)
				.join('');
			return `<div><p>${renderInline(c.stem)}</p>${opts}</div>`;
		}
		default:
			return '';
	}
}

function renderSection(section: any): string {
	const blocks = [...section.blocks].sort((a: any, b: any) => a.position - b.position);
	const parts: string[] = [];
	for (let i = 0; i < blocks.length; i++) {
		const block = blocks[i];
		if (block.object === 'heading' && i + 1 < blocks.length) {
			parts.push(
				`<div class="lectio-heading-binding">${renderBlock(block)}${renderBlock(blocks[i + 1])}</div>`
			);
			i += 1;
		} else {
			parts.push(renderBlock(block));
		}
	}
	return `<section id="${escapeHtml(section.id)}">${parts.join('')}</section>`;
}

const body = `
<!doctype html>
<html lang="${escapeHtml(fixture.language)}">
<head>
<meta charset="utf-8"/>
<style>${css}</style>
</head>
<body>
<article class="lectio-document">
  <header class="lectio-cover">
    <h1 class="lectio-cover-title">${escapeHtml(fixture.title)}</h1>
    <p class="lectio-cover-subtitle">${escapeHtml(fixture.subject ?? '')}</p>
    <div class="lectio-cover-fields">
      ${(fixture.front_matter?.fields ?? ['Student Name', 'Date'])
				.map((f: string) => `<div class="lectio-cover-field">${escapeHtml(f)}</div>`)
				.join('')}
    </div>
  </header>
  <nav class="lectio-contents">
    <h2>Contents</h2>
    ${fixture.sections
			.map(
				(s: any) =>
					`<div class="lectio-contents-entry"><span>${escapeHtml(s.title)}</span><span></span></div>`
			)
			.join('')}
  </nav>
  <div class="lectio-page-flow"><div class="lectio-main">
    ${fixture.sections.map(renderSection).join('')}
  </div></div>
</article>
</body>
</html>
`;

const htmlPath = join(outDir, 'photosynthesis-ref.html');
writeFileSync(htmlPath, body);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(pathToFileURL(htmlPath).href, { waitUntil: 'networkidle' });

for (const printBackground of [true, false]) {
	const name = printBackground ? 'photosynthesis-ref-bg-on.pdf' : 'photosynthesis-ref-bg-off.pdf';
	await page.pdf({
		path: join(outDir, name),
		format: 'A4',
		printBackground,
		preferCSSPageSize: true
	});
	console.log('Wrote', name, statSync(join(outDir, name)).size, 'bytes');
}

await browser.close();
console.log('PDF gate artifacts in out/');

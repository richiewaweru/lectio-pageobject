import type { LectioDocument } from './document';
import { INTENT_IDS, PAGE_OBJECTS, type IntentId, type PageObject } from './intents';
import { isCompatible } from '../catalogue/compatibility';

export interface ValidationIssue {
	path: string;
	message: string;
}

export function validateDocument(doc: unknown): ValidationIssue[] {
	const issues: ValidationIssue[] = [];
	if (!doc || typeof doc !== 'object') {
		return [{ path: '', message: 'Document must be an object' }];
	}
	const d = doc as Partial<LectioDocument>;

	if (d.document_version !== 2) {
		issues.push({ path: 'document_version', message: 'Must be 2' });
	}
	if (!d.contract_version) issues.push({ path: 'contract_version', message: 'Required' });
	if (!d.id) issues.push({ path: 'id', message: 'Required' });
	if (!d.title) issues.push({ path: 'title', message: 'Required' });
	if (!d.language || d.language.length < 2) {
		issues.push({ path: 'language', message: 'BCP-47 language code required' });
	}
	if (!d.metadata || typeof d.metadata !== 'object') {
		issues.push({ path: 'metadata', message: 'Required object' });
	}
	if (!Array.isArray(d.sections)) {
		issues.push({ path: 'sections', message: 'Required array' });
		return issues;
	}

	const ids = new Set<string>();
	for (let si = 0; si < d.sections.length; si++) {
		const section = d.sections[si];
		const sp = `sections[${si}]`;
		if (!section?.id) issues.push({ path: `${sp}.id`, message: 'Required' });
		if (!section?.title) issues.push({ path: `${sp}.title`, message: 'Required' });
		if (!Array.isArray(section?.blocks)) {
			issues.push({ path: `${sp}.blocks`, message: 'Required array' });
			continue;
		}
		if (section.blocks.length > 0) {
			const last = section.blocks[section.blocks.length - 1];
			if (last?.object === 'heading') {
				issues.push({
					path: `${sp}.blocks`,
					message: 'Heading cannot be the final block in a section'
				});
			}
		}
		for (let bi = 0; bi < section.blocks.length; bi++) {
			const block = section.blocks[bi];
			const bp = `${sp}.blocks[${bi}]`;
			if (!block?.id) {
				issues.push({ path: `${bp}.id`, message: 'Required' });
			} else if (ids.has(block.id)) {
				issues.push({ path: `${bp}.id`, message: `Duplicate id ${block.id}` });
			} else {
				ids.add(block.id);
			}
			if (!PAGE_OBJECTS.includes(block.object as PageObject)) {
				issues.push({ path: `${bp}.object`, message: `Unknown object ${block.object}` });
			}
			if (block.object === 'heading') {
				if (block.intent != null) {
					issues.push({
						path: `${bp}.intent`,
						message: 'Heading is structural and must not carry a pedagogical intent'
					});
				}
			} else if (!INTENT_IDS.includes(block.intent as IntentId)) {
				issues.push({ path: `${bp}.intent`, message: `Unknown intent ${block.intent}` });
			} else if (
				PAGE_OBJECTS.includes(block.object as PageObject) &&
				!isCompatible(block.object as PageObject, block.intent as IntentId)
			) {
				issues.push({
					path: bp,
					message: `Intent ${block.intent} incompatible with object ${block.object}`
				});
			}
			if (typeof block.position !== 'number' || block.position < 0) {
				issues.push({ path: `${bp}.position`, message: 'Non-negative integer required' });
			}
			if (!block.content || typeof block.content !== 'object') {
				issues.push({ path: `${bp}.content`, message: 'Required object' });
			}
			if (block.object === 'figure') {
				const alt = (block.content as { alt_text?: string })?.alt_text;
				if (!alt) issues.push({ path: `${bp}.content.alt_text`, message: 'Required' });
			}
			if (block.object === 'choices') {
				const opts = (block.content as { options?: unknown[] })?.options;
				if (!Array.isArray(opts) || opts.length < 2) {
					issues.push({ path: `${bp}.content.options`, message: 'At least two options' });
				}
			}
			if (block.object === 'aside') {
				const body = (block.content as { body?: unknown })?.body;
				const text =
					typeof body === 'string'
						? body
						: Array.isArray(body)
							? JSON.stringify(body)
							: '';
				if (text.split(/\s+/).filter(Boolean).length > 120) {
					issues.push({ path: `${bp}.content.body`, message: 'Aside exceeds 120 words' });
				}
			}
		}
	}

	return issues;
}

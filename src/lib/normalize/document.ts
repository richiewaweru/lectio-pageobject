import type { DocumentBlock, LectioDocument, LectioSection } from '../contract/document';

/** Normalize positions to array order after commit. */
export function normalizeDocument(doc: LectioDocument): LectioDocument {
	return {
		...doc,
		sections: doc.sections.map(normalizeSection),
		answer_key: doc.answer_key
			? { ...doc.answer_key, position: doc.answer_key.position ?? 0 }
			: undefined
	};
}

function normalizeSection(section: LectioSection): LectioSection {
	const blocks = [...section.blocks].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
	return {
		...section,
		blocks: blocks.map((block, index) => ({ ...block, position: index }))
	};
}

export function stableId(prefix: string, index: number): string {
	return `${prefix}-${index + 1}`;
}

export type { DocumentBlock };

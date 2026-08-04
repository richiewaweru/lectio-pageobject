import type { IntentId, PageObject } from '../contract/intents';
import intentCatalogue from '../../../contracts/intent-catalogue.v1.json';

export interface IntentRecord {
	teacher_label: string;
	pedagogical_role: string;
	cognitive_job: string;
	valid_objects: PageObject[];
	generation_guidance: string;
}

const intents = intentCatalogue.intents as Record<string, IntentRecord>;

export function getIntent(id: IntentId): IntentRecord | undefined {
	return intents[id];
}

export function listIntents(): IntentId[] {
	return Object.keys(intents) as IntentId[];
}

export function isCompatible(object: PageObject, intent: IntentId): boolean {
	if (object === 'heading') return false;
	const record = intents[intent];
	if (!record) return false;
	return record.valid_objects.includes(object);
}

export { intents as intentRecords };

import objectCatalogue from '../../../contracts/object-catalogue.v1.json';
import type { PageObject } from '../contract/intents';

export interface ObjectRecord {
	holds: string;
	content_schema: Record<string, string>;
	placement: string[];
	fragmentation: string;
	emphasis: string;
	screen_layer: string;
}

const objects = objectCatalogue.objects as Record<string, ObjectRecord>;

export function getObject(id: PageObject): ObjectRecord | undefined {
	return objects[id];
}

export function listObjects(): PageObject[] {
	return Object.keys(objects) as PageObject[];
}

export { objects as objectRecords };

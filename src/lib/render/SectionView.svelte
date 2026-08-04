<script lang="ts">
	import type { DocumentBlock, LectioSection } from '$lib/contract/document';
	import BlockView from './BlockView.svelte';
	import HeadingBinding from './HeadingBinding.svelte';

	let { section }: { section: LectioSection } = $props();

	interface RenderUnit {
		kind: 'binding' | 'block';
		heading?: DocumentBlock;
		block?: DocumentBlock;
	}

	function units(blocks: DocumentBlock[]): RenderUnit[] {
		const sorted = [...blocks].sort((a, b) => a.position - b.position);
		const out: RenderUnit[] = [];
		for (let i = 0; i < sorted.length; i++) {
			const block = sorted[i];
			if (block.object === 'heading' && i + 1 < sorted.length) {
				out.push({ kind: 'binding', heading: block, block: sorted[i + 1] });
				i += 1;
			} else {
				out.push({ kind: 'block', block });
			}
		}
		return out;
	}
</script>

<section class="lectio-section" id={section.id}>
	{#each units(section.blocks) as unit}
		{#if unit.kind === 'binding' && unit.heading && unit.block}
			<HeadingBinding>
				<BlockView block={unit.heading} />
				<BlockView block={unit.block} />
			</HeadingBinding>
		{:else if unit.block}
			<BlockView block={unit.block} />
		{/if}
	{/each}
</section>

<script lang="ts">
	import type { FigureContent } from '$lib/contract/document';
	import { sanitizeSvg } from '$lib/utils/sanitize';

	let {
		content,
		spanning = false
	}: {
		content: FigureContent;
		spanning?: boolean;
	} = $props();

	const span = $derived(spanning || content.width === 'span');
	const svg = $derived(content.asset?.svg ? sanitizeSvg(content.asset.svg) : '');
</script>

<figure class={['lectio-figure', span && 'lectio-figure--span']}>
	{#if content.asset?.status === 'pending'}
		<div class="lectio-figure-fallback" role="img" aria-label={content.alt_text}>
			Figure pending
		</div>
	{:else if content.asset?.status === 'failed'}
		<div class="lectio-figure-fallback" role="img" aria-label={content.alt_text}>
			Figure unavailable
		</div>
	{:else if svg}
		{@html svg}
	{:else if content.asset?.src}
		<img src={content.asset.src} alt={content.alt_text} />
	{:else}
		<div class="lectio-figure-fallback" role="img" aria-label={content.alt_text}>
			{content.alt_text}
		</div>
	{/if}
	{#if content.caption}
		<figcaption class="lectio-caption">{content.caption}</figcaption>
	{/if}
</figure>

<style>
	.lectio-figure-fallback {
		border: 0.5pt solid #999;
		min-height: 40mm;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 9pt;
		color: #555;
	}
</style>

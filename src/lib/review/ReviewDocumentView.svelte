<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LectioDocument } from '$lib/contract/document';
	import LectioDocumentView from '../render/LectioDocumentView.svelte';

	let {
		document: doc,
		edition = 'teacher',
		children
	}: {
		document: LectioDocument;
		edition?: 'student' | 'teacher';
		children?: Snippet;
	} = $props();
</script>

<div class="lectio-review-frame">
	{#if children}
		<aside class="lectio-review-chrome">
			{@render children()}
		</aside>
	{/if}
	<div class="lectio-print-subtree">
		<LectioDocumentView document={doc} {edition} />
	</div>
</div>

<style>
	.lectio-review-frame {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
	}
	.lectio-review-chrome {
		font-family: system-ui, sans-serif;
		font-size: 14px;
		padding: 12px 16px;
		background: #1b1b1b;
		color: #f5f5f5;
	}
	@media (min-width: 960px) {
		.lectio-review-frame:has(.lectio-review-chrome) {
			grid-template-columns: 240px minmax(0, 1fr);
		}
	}
</style>

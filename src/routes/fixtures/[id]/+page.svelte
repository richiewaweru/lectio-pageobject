<script lang="ts">
	import ReviewDocumentView from '$lib/review/ReviewDocumentView.svelte';

	let { data } = $props();
	let edition = $state<'student' | 'teacher'>('teacher');
</script>

<div class="toolbar">
	<div>
		<h1>{data.meta?.title ?? data.doc.title}</h1>
		<p>
			{data.issues.length === 0
				? 'Contract valid'
				: `${data.issues.length} validation issue(s)`}
		</p>
	</div>
	<label>
		Edition
		<select bind:value={edition}>
			<option value="teacher">Teacher</option>
			<option value="student">Student</option>
		</select>
	</label>
</div>

{#if data.issues.length}
	<details class="issues">
		<summary>Validation issues</summary>
		<ul>
			{#each data.issues as issue}
				<li><code>{issue.path}</code> — {issue.message}</li>
			{/each}
		</ul>
	</details>
{/if}

<ReviewDocumentView document={data.doc} {edition}>
	<p>Fixture: {data.doc.id}</p>
	<p>Sections: {data.doc.sections.length}</p>
	<p>Edition: {edition}</p>
	<p>Intent labels stay in this chrome — never in the print subtree.</p>
</ReviewDocumentView>

<style>
	.toolbar {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
		align-items: end;
		margin-bottom: 1rem;
	}
	.toolbar h1 {
		margin: 0;
		font-size: 1.4rem;
	}
	.toolbar p {
		margin: 0.25rem 0 0;
		color: #555;
	}
	.issues {
		margin-bottom: 1rem;
		background: #fff;
		padding: 0.75rem 1rem;
		border: 1px solid #ddd;
	}
</style>

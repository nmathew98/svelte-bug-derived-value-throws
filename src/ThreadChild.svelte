<script lang="ts">
	import type { Thread } from "./api";
	import type { Readable } from "svelte/store";

	export let uuid: string;
	export let onClickReply: any;
	export let onClickExpand: any;
	export let currentThread: Readable<Thread>;

	const findDeep = (uuid: string, thread?: Thread) => {
		if (!thread) {
			return null;
		}

		if (thread.uuid === uuid) {
			return thread;
		}

		if (!thread.children) {
			return null;
		}

		for (let i = 0; i < thread.children.length; i++) {
			const result = findDeep(uuid, thread.children[i]);

			if (result) {
				return result;
			}
		}
	};

	$: child = findDeep(uuid, $currentThread);
	let rerenders = 0;

	$: if (child) {
		rerenders = rerenders + 1 * 50;
	}

	$: onExpand = onClickExpand(child);
	$: onReply = onClickReply(child);
</script>

<div class="flex-col space-y-4">
	<div>
		{child.uuid}
	</div>
	<div>
		{JSON.stringify(child.children, null, 2)}
	</div>
	<div class="flex space-x-4">
		{#if child.children}
			<div>
				<button on:click={onExpand}> View whole thread </button>
			</div>
		{/if}
		<div>
			<button on:click={onReply}>Reply</button>
		</div>
	</div>
</div>

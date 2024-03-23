<script lang="ts">
	import Child from "./Child.svelte";
	import { writable } from "svelte/store";

	const data = writable([
		{
			id: "1",
			content: "HELLO",
			children: [
				{
					id: "3",
					content: "WORLD",
				},
				{
					id: "2",
					content: "!!!!!!!!!",
				},
			],
		},
	]);

	const dispatch = f => {
		const newValue = f($data);

		data.set(newValue);

		return data;
	};
</script>

<div class="mb-8">Data: {JSON.stringify($data, null, 2)}</div>

{#if $data}
	{#each $data as item (item)}
		<Child parentDispatch={dispatch} />
	{/each}
{/if}

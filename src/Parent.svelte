<script lang="ts">
	import Child from "./Child.svelte";
	import { writable } from "svelte/store";

	function* id() {
		for (let i = 1; i < Infinity; i++) {
			yield i;
		}
	}
	const idGenerator = id();
	const createId = () => idGenerator.next().value;

	const data = writable([
		{
			id: createId(),
			content: "HELLO",
			children: [
				{
					id: createId(),
					content: "WORLD",
				},
				{
					id: createId(),
					content: "!!!!!!!!!",
				},
			],
		},
	]);

	data.subscribe(newValue => {
		console.debug("Parent data", newValue);
	});

	const dispatch = f => {
		const newValue = f($data);

		data.set(newValue);

		return data;
	};
</script>

<div class="mb-8">Data: {JSON.stringify($data, null, 2)}</div>

{#if $data}
	{#each $data as item (item.id)}
		<Child parentDispatch={dispatch} />
	{/each}
{/if}

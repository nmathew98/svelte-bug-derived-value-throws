<script lang="ts">
	import { derived, writable } from "svelte/store";
	import Child from "./Child.svelte";

	export let landingDispatch;

	const createId = () => Math.random().toString(36).substring(2);

	const data = writable<any>({
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
	});

	const findDeep = (id, item) => {
		if (!item) {
			return null;
		}

		if (item.id === id) {
			return item;
		}

		if (!item.children) {
			return null;
		}

		for (let i = 0; i < item.children.length; i++) {
			const result = findDeep(id, item.children[i]);

			if (result) {
				return result;
			}
		}
	};

	const replyTo: string = "2";

	const currentItemId = writable("1");
	const currentItem = derived(
		[data, currentItemId],
		([$data, $currentItemId]) => findDeep($currentItemId, $data),
	);

	const addChildOfChild = () => {
		const newid = createId();

		const newChild = {
			id: newid,
			content: `id: ${newid}`,
		};

		const updatedData = {
			...$data,
			children: $data.children.map(child => {
				if (child.id === replyTo) {
					return {
						...child,
						children: [newChild, ...(child.children ?? [])],
					};
				}

				return child;
			}),
		};

		data.set(updatedData);
	};

	const referenceType = {
		data: 1,
	};
	const testReference = writable(referenceType);

	testReference.subscribe(value => {
		console.log("newValue reference", value);
	});

	testReference.set(referenceType);
	testReference.set(referenceType);

	const primitiveType = 1;
	const testPrimitive = writable(primitiveType);

	testPrimitive.subscribe(value => {
		console.log("newValue primitive", value);
	});

	testPrimitive.set(primitiveType);
	testPrimitive.set(primitiveType);
</script>

<div>Current item id: {$currentItem.id}</div>
<div>
	Current item children: {JSON.stringify($currentItem.children, null, 2)}
</div>

{#if $currentItem.children}
	<div class="my-4 flex-col space-y-2">
		{#each $currentItem?.children as child (child.id)}
			<Child id={child.id} {currentItem} />
		{/each}
	</div>
{/if}

<div class="my-4 flex-col">
	<div>
		<button on:click={addChildOfChild}
			>Add child to item with id {replyTo}</button>
	</div>
	<div>
		<button
			on:click={() => {
				currentItemId.set(replyTo);
			}}>Set current item to item with id {replyTo}</button>
	</div>
</div>

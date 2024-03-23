<script lang="ts">
	import { derived, writable } from "svelte/store";

	export let parentDispatch: any;

	function* id() {
		for (let i = 1; i < Infinity; i++) {
			yield i;
		}
	}
	const idGenerator = id();
	const createId = () => idGenerator.next().value;

	const data = writable<any>({
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
	});

	data.subscribe(newValue => {
		console.debug("Child data", newValue);
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

	const replyTo = 3;

	const currentItemId = writable(1);
	const currentItem = derived(
		[data, currentItemId],
		([$data, $currentItemId]) => findDeep($currentItemId, $data),
	);

	const addChildOfChild = () => {
		const newId = createId();

		const newChild = {
			id: newId,
			content: `id: ${newId}`,
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

		return updatedData;
	};

	const setOnlyChildStore = () => {
		const updatedData = addChildOfChild();

		data.set(updatedData);
	};

	const setStoreInParentAndChild = () => {
		const updatedData = addChildOfChild();

		data.set(updatedData);

		parentDispatch(() => [updatedData]);
	};
</script>

<div>Current item id: {$currentItem.id}</div>
<div>
	Current item children: {JSON.stringify($currentItem.children, null, 2)}
</div>

{#if $currentItem.children}
	<div class="my-4 flex-col space-y-2">
		{#each $currentItem?.children as child (child.id)}
			<div class="flex-col">
				<div>
					<span>Child id: {child.id}</span>
				</div>
				<div>
					<span>
						Child children: {JSON.stringify(
							child.children,
							null,
							2,
						)}
					</span>
				</div>
			</div>
		{/each}
	</div>
{/if}

<div class="my-4 flex-col">
	<div class="my-2 flex-col">
		<div>
			<button on:click={setOnlyChildStore}>
				Add child to item with id {replyTo} in the store in `Child` only
			</button>
		</div>
		<div>
			<button on:click={setStoreInParentAndChild}>
				Add child to item with id {replyTo} in stores in `Parent` and `Child`
			</button>
		</div>
	</div>
	<div>
		<button
			on:click={() => {
				currentItemId.set(replyTo);
			}}>
			Set current item to item with id {replyTo}
		</button>
	</div>
</div>

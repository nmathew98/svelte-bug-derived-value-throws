<script lang="ts">
	export let id;
	export let currentItem;

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

	$: child = findDeep(id, $currentItem);
</script>

<div class="flex-col">
	<div>
		<span>Child id: {child.id}</span>
	</div>
	<div>
		<span>Child children: {JSON.stringify(child.children, null, 2)}</span>
	</div>
</div>

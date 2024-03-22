<script lang="ts">
	import { useQwery } from "./hooks/useQwery";
	import { getAllThreads, upsertThread } from "./api";
	import { H1 } from "$lib/components/ui/typography";
	import Thread from "./Thread.svelte";
	import NewThread from "./NewThread.svelte";
	import Parent from "./Parent.svelte";
	import { ModeWatcher, setMode } from "mode-watcher";
	import { writable } from "svelte/store";

	setMode("dark");

	// We have many main `Thread`s and each `Thread` can have zero or more
	// child `Thread`s

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

	// data.subscribe(newValue => {
	// 	console.log("new all data", newValue);
	// });

	// const { data, dispatch } = useQwery({
	// 	queryKey: "threads",
	// 	initialValue: [
	// 		{
	// 			id: "1",
	// 			content: "HELLO",
	// 			children: [
	// 				{
	// 					id: "3",
	// 					content: "WORLD",
	// 				},
	// 				{
	// 					id: "2",
	// 					content: "!!!!!!!!!",
	// 				},
	// 			],
	// 		},
	// 	], // Get all main threads
	// 	onChange: async next => {
	// 		const newItemIdx = next.findIndex(thread => !thread.uuid);

	// 		const result = await upsertThread(next[newItemIdx]);

	// 		return result;
	// 	},
	// 	onSuccess: (next, _previous, result) =>
	// 		next.map(thread => {
	// 			if (!thread.uuid) {
	// 				return {
	// 					...thread,
	// 					...result,
	// 				};
	// 			}

	// 			return thread;
	// 		}),
	// 	broadcast: true,
	// });

	// let previousData = data;
	// data.subscribe(newValue => {
	// 	console.log("previousData", previousData);
	// 	console.log("newValue", newValue);
	// 	console.log("previousData === newValue", previousData === newValue);

	// 	previousData = newValue;
	// });

	// $: allThreads = [...($data ?? [])]?.sort(
	// 	(a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
	// );
</script>

<!-- <ModeWatcher />
<div class="flex justify-center my-8 mx-4 sm:mx-0">
	<div class="flex-col space-y-8">
		<H1>My Feed</H1>
		<NewThread {dispatch} />

		{#if $data}
			{#each $data as thread (thread.uuid)}
				<Thread initialValue={thread} landingDispatch={dispatch} />
			{/each}
		{/if}
	</div>
</div> -->

<div class="mb-8">Data: {JSON.stringify($data, null, 2)}</div>

{#if $data}
	{#each $data as item (item.id)}
		<Parent initialValue={item} landingDispatch={dispatch} />
	{/each}
{/if}

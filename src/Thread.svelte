<script lang="ts">
	import { type Thread, upsertThread } from "./api";
	import { type Dispatch, useQwery } from "@b.s/svelte-qwery";
	import { faker } from "@faker-js/faker";
	import { Button } from "$lib/components/ui/button";
	import { Input } from "$lib/components/ui/input";
	import ThreadChild from "./ThreadChild.svelte";
	import { writable, derived } from "svelte/store";

	export let initialValue: Thread;
	export let landingDispatch: Dispatch<Thread[]>;

	const name = faker.person.fullName();

	let content = "";
	let replyTo: Thread | null = null;

	let rerenders = 0;

	const { data, dispatch } = useQwery({
		queryKey: `threads-${initialValue.uuid}`,
		initialValue: initialValue as Thread,
		onChange: async next => {
			const newItem = next.children?.find(thread => !thread.uuid);

			if (!newItem) {
				throw new Error("Unexpected error: New thread not found");
			}

			const result = await upsertThread(newItem);

			return result;
		},
		onSuccess: (next, _previous, result: Omit<Thread, "children">) => ({
			...next,
			children: next.children!.map(child => {
				if (!child.uuid) {
					return {
						...child,
						...result,
					};
				}

				return child;
			}),
		}),
		broadcast: true,
	});

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

	const currentThreadUuid = writable(initialValue.uuid);
	const currentThread = derived(
		[data, currentThreadUuid],
		([$data, $currentThreadUuid]) => findDeep($currentThreadUuid, $data),
	);

	$: if ($currentThread) {
		// TODO: Think bug with Svelte:
		// - Have a Thread open
		// - Share a thought
		// - Reply to the child
		// - Share a thought
		// - View whole thread the child previously replied to
		// - Result: Error but $currentThread not null or undefined
		// console.log($currentThread);
		rerenders = rerenders + 1 * 50;
	}

	const replyToMainThread = () => {
		replyTo = null;
	};

	const onSubmitNewThread = async () => {
		// This is a really deep update so manually create the new `Thread`
		// we are creating a child thread for a child thread
		// and then dispatch the update specifying it has already been persisted
		if (replyTo) {
			const newThread = {
				createdBy: name,
				content: content,
				parent: replyTo.uuid,
				likes: 0,
			};

			const result = await upsertThread(newThread);

			// `dispatch` returns the `latest` version of the main thread here
			// since the global `onChange` which is async is not triggered
			const latest = dispatch(
				thread => {
					const replyingTo = findDeep(
						(replyTo as Thread).uuid,
						thread,
					);

					replyingTo.children ??= [];
					replyingTo.children.unshift(result);
				},
				{ isPersisted: true },
			) as Thread;

			landingDispatch(
				allThreads => {
					const currentThread = allThreads.find(
						thread => thread.uuid === latest.uuid,
					) as Thread;

					currentThread.children = latest.children;
				},
				{ isPersisted: true },
			);

			content = "";

			return;
		}

		const newThread = {
			createdBy: name,
			content: content,
			parent: $currentThread.uuid,
			likes: 0,
		};

		// `dispatch` returns a `Promise` here since the global `onChange` is triggered
		await dispatch(thread => {
			thread.children ??= [];

			thread.children.unshift(newThread as Thread);
		});

		content = "";
	};

	const onKeyDown = event => {
		if (event.key === "Enter") {
			return onSubmitNewThread();
		}

		if (event.key === "Backspace") {
			if (content) {
				return;
			}

			return replyToMainThread();
		}
	};

	const makeOnClickReply = child => (event: MouseEvent) => {
		event.stopPropagation();

		replyTo = child;
	};
	const makeOnClickExpandThread = child => () => {
		currentThreadUuid.set(child.uuid);
	};
	const onClickReturnToMainThread = () => {
		currentThreadUuid.set(initialValue.uuid);
		replyTo = null;
	};
</script>

{#if data}
	<div class="flex-col space-y-4">
		<div>
			<span>{$data?.uuid}</span>
		</div>
		<div>
			<span>{JSON.stringify($data?.children, null, 2)}</span>
		</div>
		<div>
			<span>Current thread: {$currentThread.uuid}</span>
		</div>
		<div>
			<span>
				{#if $currentThread.children}
					{#each $currentThread?.children as child (child.uuid)}
						<ThreadChild
							uuid={child.uuid}
							{currentThread}
							onClickExpand={makeOnClickExpandThread}
							onClickReply={makeOnClickReply} />
					{/each}
				{/if}
			</span>
		</div>
		<div>
			<Input
				type="text"
				bind:value={content}
				on:keydown={onKeyDown}
				placeholder={replyTo
					? `Reply to ${replyTo.createdBy}`
					: "Share a thought...?"} />
			{#if replyTo}
				<Button variant="ghost" size="sm" on:click={replyToMainThread}>
					Reply to main thread
				</Button>
			{/if}
		</div>
		<div>
			{#if $currentThread.uuid !== initialValue.uuid}
				<Button
					on:click={onClickReturnToMainThread}
					variant="secondary"
					type="reset">
					View main thread
				</Button>
			{/if}
			<Button
				disabled={!content}
				on:click={onSubmitNewThread}
				type="submit">
				Submit
			</Button>
		</div>
	</div>
{/if}

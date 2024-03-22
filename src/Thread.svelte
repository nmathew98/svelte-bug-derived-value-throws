<script lang="ts">
	import { type Thread, upsertThread } from "./api";
	import { useQwery } from "./hooks/useQwery";
	import { faker } from "@faker-js/faker";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
		DialogTrigger,
	} from "$lib/components/ui/dialog";
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import { Button } from "$lib/components/ui/button";
	import { P } from "$lib/components/ui/typography";
	import { Input } from "$lib/components/ui/input";
	import ThreadChild from "./ThreadChild.svelte";
	import { StarFilled } from "svelte-radix";
	import { writable, derived } from "svelte/store";

	export let initialValue: Thread;
	export let landingDispatch: any;

	const name = faker.person.fullName();

	let content = "";
	let replyTo: Thread | null = null;

	const { data, dispatch } = useQwery({
		queryKey: `threads-${initialValue.uuid}`,
		initialValue: initialValue as Thread,
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
		([$data, $currentThreadUuid]) =>
			findDeep($currentThreadUuid, $data as Thread),
	);

	const replyToMainThread = () => {
		replyTo = null;
	};

	const onSubmitNewThread = async () => {
		if (replyTo) {
			const newThread = {
				createdBy: name,
				content: content,
				parent: replyTo.uuid,
				likes: 0,
			};

			const result = await upsertThread(newThread);

			const latest = dispatch(
				thread => {
					const replyingTo = findDeep(
						(replyTo as Thread).uuid,
						thread,
					);

					return {
						...$currentThread,
						children: $currentThread.children?.map(child => {
							if (child.uuid === replyingTo.uuid) {
								return {
									...child,
									children: [
										result,
										...(replyingTo.children ?? []),
									],
								};
							}

							return child;
						}),
					};
				},
				{ isPersisted: true },
			) as Thread;

			// TODO: Problematic line here
			// This line runs and `allThreads` is correct
			// but if we call `landingDispatch` then it seems to break something
			// Updating landing dispatch causes the entire `Thread` to rerender
			// which breaks things
			landingDispatch(
				allThreads => {
					// const currentThread = allThreads.find(
					// 	thread => thread.uuid === latest.uuid,
					// ) as Thread;

					// currentThread.children = latest.children;

					// return allThreads.map(thread => {
					// 	if (thread.uuid === currentThread.uuid) {
					// 		return { ...currentThread };
					// 	}

					// 	return thread;
					// });

					console.log(allThreads);

					return allThreads;
				},
				{ isPersisted: true },
			);

			content = "";

			return;
		}

		const newThread = await upsertThread({
			createdBy: name,
			content: content,
			parent: $currentThread.uuid,
			likes: 0,
		});

		dispatch(thread => ({
			...thread,
			children: [newThread, ...(thread.children ?? [])],
		}));

		// TODO: Problematic
		// When we call `landingDispatch` the entire `Thread` rerenders
		// Note: There is no change to `allThreads` but there is a rerender of the
		// entire `Thread` from `App` which causes things to break
		landingDispatch(
			allThreads => {
				console.log("allThreads", allThreads);

				return allThreads;
			},
			{ isPersisted: true },
		);

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
	<Dialog>
		<DialogTrigger asChild let:builder>
			<div use:builder.action {...builder}>
				<Card class="cursor-pointer max-w-2xl border-2">
					<CardHeader>
						<CardTitle>{$data?.createdBy}</CardTitle>
						<CardDescription class="flex space-x-1">
							<span>{$data?.createdAt.toDateString()}</span>
							<span>&middot;</span>
							<span class="inline-flex items-center space-x-1">
								<span>{$data?.likes}</span>
								<span>
									<StarFilled />
								</span>
							</span>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<P>{$data?.content}</P>
					</CardContent>
					<CardFooter>
						<Button class="w-full">View whole thread</Button>
					</CardFooter>
				</Card>
			</div>
		</DialogTrigger>
		<DialogContent>
			<DialogHeader>
				<DialogTitle>View whole thread</DialogTitle>
				<DialogDescription>
					{$currentThread.content}
				</DialogDescription>
			</DialogHeader>
			{#if $currentThread.children}
				<div class="max-h-[50dvh] overflow-scroll flex-col space-y-8">
					{#each $currentThread?.children as child (child.uuid)}
						<ThreadChild
							uuid={child.uuid}
							{currentThread}
							onClickExpand={makeOnClickExpandThread}
							onClickReply={makeOnClickReply} />
					{/each}
				</div>
			{/if}
			<div class="flex-col space-y-2">
				<Input
					type="text"
					bind:value={content}
					on:keydown={onKeyDown}
					placeholder={replyTo
						? `Reply to ${replyTo.createdBy}`
						: "Share a thought...?"} />
				{#if replyTo}
					<Button
						variant="ghost"
						size="sm"
						on:click={replyToMainThread}>
						Reply to main thread
					</Button>
				{/if}
			</div>
			<DialogFooter>
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
			</DialogFooter>
		</DialogContent>
	</Dialog>
{/if}

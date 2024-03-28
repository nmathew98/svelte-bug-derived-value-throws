<script lang="ts">
	import { faker } from "@faker-js/faker";
	import type { Dispatch } from "@b.s/svelte-qwery";
	import type { Thread } from "./api";

	export let dispatch: Dispatch<Thread[]>;

	const name = faker.person.fullName();
	let content = "";

	const onSubmitNewThread = () => {
		const newThread = {
			createdBy: name,
			content: content,
			likes: 0,
		} as Thread;

		// Dispatch and create a new `Thread`
		dispatch(allThreads => void allThreads.unshift(newThread));

		content = "";
	};

	const onKeyDown = event => {
		if (event.key !== "Enter" || !content) {
			return;
		}

		event.preventDefault();

		return onSubmitNewThread();
	};
</script>

<div class="flex-col space-y-4">
	<div>
		<h2>{name}</h2>
	</div>
	<div>
		<textarea
			bind:value={content}
			on:keydown={onKeyDown}
			placeholder="Share a thought...?" />
	</div>
	<div>
		<button on:click={onSubmitNewThread} disabled={!content}>
			Submit
		</button>
	</div>
</div>

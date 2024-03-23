import "./app.pcss";
import App from "./Parent.svelte";

const app = new App({
	target: document.getElementById("app")!,
});

export default app;

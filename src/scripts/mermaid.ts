import mermaid from "mermaid";

const dark = document.documentElement.dataset.theme === "dark";

mermaid.initialize({
  startOnLoad: false,
  securityLevel: "strict",
  theme: dark ? "dark" : "neutral",
});

await mermaid.run({ querySelector: ".mermaid" });

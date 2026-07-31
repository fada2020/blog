import mermaid from "mermaid";

type Theme = "light" | "dark";

const diagrams = Array.from(
  document.querySelectorAll<HTMLElement>(".mermaid"),
);

for (const diagram of diagrams) {
  diagram.dataset.mermaidSource = diagram.textContent?.trim() ?? "";
}

const render = async (theme: Theme) => {
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: theme === "dark" ? "dark" : "neutral",
  });

  for (const diagram of diagrams) {
    diagram.removeAttribute("data-processed");
    diagram.textContent = diagram.dataset.mermaidSource ?? "";
  }

  await mermaid.run({ nodes: diagrams });
};

let rendering = render(
  document.documentElement.dataset.theme === "dark" ? "dark" : "light",
);

window.addEventListener("themechange", (event) => {
  const theme = (event as CustomEvent<{ theme: Theme }>).detail.theme;
  rendering = rendering.then(() => render(theme));
});

await rendering;

import {
  filterSearchEntries,
  type SearchEntry,
} from "../lib/search";

const EMPTY_GUIDANCE =
  "제목, 설명, 카테고리 또는 태그를 검색해 보세요.";

function renderResults(
  results: SearchEntry[],
  list: HTMLOListElement,
): void {
  list.replaceChildren(
    ...results.map((entry) => {
      const item = document.createElement("li");
      const link = document.createElement("a");
      const description = document.createElement("p");
      const metadata = document.createElement("small");

      link.href = entry.href;
      link.textContent = entry.title;
      description.textContent = entry.description;
      metadata.textContent = `${entry.category} · ${entry.tags.map((tag) => `#${tag}`).join(" ")}`;
      item.append(link, description, metadata);
      return item;
    }),
  );
}

async function setupSearchPanel(panel: HTMLElement): Promise<void> {
  const input = panel.querySelector<HTMLInputElement>("[data-search-input]");
  const status = panel.querySelector<HTMLElement>("[data-search-status]");
  const results = panel.querySelector<HTMLOListElement>("[data-search-results]");
  const indexUrl = panel.dataset.indexUrl;
  if (!input || !status || !results || !indexUrl) return;

  try {
    const response = await fetch(indexUrl);
    if (!response.ok) throw new Error("검색 인덱스를 불러오지 못했습니다.");
    const entries = (await response.json()) as SearchEntry[];

    input.addEventListener("input", () => {
      const query = input.value.trim().replace(/\s+/g, " ");
      const matches = filterSearchEntries(entries, query);
      renderResults(matches, results);

      if (!query) {
        status.textContent = EMPTY_GUIDANCE;
      } else if (matches.length === 0) {
        status.textContent = `"${query}" 검색 결과가 없습니다.`;
      } else {
        status.textContent = `검색 결과 ${matches.length}개`;
      }
    });
  } catch {
    status.textContent = "검색을 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

export function setupSearchPanels(): void {
  document
    .querySelectorAll<HTMLElement>("[data-search-panel]")
    .forEach((panel) => void setupSearchPanel(panel));
}

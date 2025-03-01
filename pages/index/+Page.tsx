import { convertVSCodeToZedSnippets } from "@/utils/convert-vscode-to-zed-snippets";
import { debounce } from "@/utils/debounce";
import { createSignal, For, Show } from "solid-js";
import { useMetadata } from "vike-metadata-solid";

export default function Page() {
  useMetadata({});

  const [vsCodeSnippet, setVSCodeSnippet] = createSignal("");
  const [activeTab, setActiveTab] = createSignal(0);
  const [convertedSnippets, setConvertedSnippets] = createSignal([]);
  const [hasError, setHasError] = createSignal(false);

  const debouncedConvert = debounce((snippetText: string) => {
    try {
      const converted = convertVSCodeToZedSnippets(snippetText);
      setConvertedSnippets(
        converted.map((item) => ({
          language: item.language,
          content: JSON.stringify(item.snippets, null, 2),
        }))
      );
      setHasError(false);
    } catch (error) {
      console.error("Failed to convert snippet:", error);
      setHasError(true);
    }
  }, 500);

  return (
    <div class="flex h-[100vh] gap-4 p-4">
      <div class="flex flex-1 flex-col">
        <h2 class="text-sm font-bold mb-2">VSCode Snippet</h2>
        <textarea
          class="flex-1 w-full rounded border p-4 font-mono text-xs"
          value={vsCodeSnippet()}
          onInput={(e) => {
            const newValue = e.currentTarget.value;
            setVSCodeSnippet(newValue);
            debouncedConvert(newValue);
          }}
          placeholder="Paste your VSCode snippet here..."
        />
      </div>

      <div class="flex flex-1 flex-col">
        <h2 class="text-sm font-bold mb-2">Zed Snippet</h2>
        <Show
          when={convertedSnippets().length > 0}
          fallback={
            <div class="flex-1 flex items-center justify-center text-gray-500">
              <div class="text-center">
                {/* <ArrowIcon /> */}
                <p class="text-sm">
                  {hasError()
                    ? "Something's wrong with your VSCode Snippet."
                    : "Paste a VSCode Snippet to get Started"}
                </p>
              </div>
            </div>
          }
        >
          <div class="flex gap-2 mb-2">
            <For each={convertedSnippets()}>
              {(snippet, index) => (
                <button
                  class={`px-3 py-1 rounded text-sm ${
                    activeTab() === index() ? "bg-blue-500 text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setActiveTab(index())}
                >
                  {snippet.language}
                </button>
              )}
            </For>
          </div>
          <textarea
            class="flex-1 w-full rounded border p-4 font-mono text-xs"
            value={convertedSnippets()[activeTab()].content}
            readOnly
            placeholder="Converted snippet will appear here..."
          />
        </Show>
      </div>
    </div>
  );
}

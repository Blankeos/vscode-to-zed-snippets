import { convertVSCodeToZedSnippets } from "@/utils/convert-vscode-to-zed-snippets";
import { debounce } from "@/utils/debounce";
import { createEffect, createSignal, For, Show } from "solid-js";
import { useMetadata } from "vike-metadata-solid";

import { IconGitHub } from "@/assets";
import { useClipboard, useLocalStorage } from "bagon-hooks";

export default function Page() {
  useMetadata({});

  const [vsCodeSnippet, setVSCodeSnippet] = useLocalStorage({
    key: "vscode-snippet-input",
    defaultValue: "",
  });
  const [activeTab, setActiveTab] = createSignal(0);
  const [convertedSnippets, setConvertedSnippets] = createSignal([]);
  const [hasError, setHasError] = createSignal(false);

  const { copied, copy } = useClipboard({
    timeout: 1000,
  });

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

  createEffect(() => {
    debouncedConvert(vsCodeSnippet());
  });

  return (
    <div class="flex h-[100vh] gap-4 p-4 relative">
      <a
        class="fixed top-2 right-2 p-2 text-gray-400 hover:text-gray-600 text-xs flex items-center gap-x-2"
        href="https://github.com/blankeos/vscode-to-zed-snippets"
        target="_blank"
      >
        <IconGitHub class="w-4 h-4" />
        <span>source</span>
      </a>

      <div class="flex flex-1 flex-col">
        <h2 class="text-sm font-bold mb-2">VSCode Snippet</h2>
        <textarea
          class="flex-1 w-full rounded border p-4 font-mono text-xs"
          value={vsCodeSnippet()}
          onInput={(e) => {
            const newValue = e.currentTarget.value;
            setVSCodeSnippet(newValue);
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
          <div class="relative w-full h-full">
            <textarea
              class="flex-1 w-full rounded border p-4 font-mono text-xs h-full"
              value={convertedSnippets()[activeTab()].content}
              readOnly
              placeholder="Converted snippet will appear here..."
            />
            <button
              onClick={() => copy(convertedSnippets()[activeTab()].content)}
              class="absolute top-2 right-2 px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
            >
              {copied() ? "Copied!" : "Copy"}
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}

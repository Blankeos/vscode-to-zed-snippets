import { convertVSCodeToZedSnippets } from "@/utils/convert-vscode-to-zed-snippets";
import { debounce } from "@/utils/debounce";
import { createEffect, createSignal, For, Match, onCleanup, onMount, Show, Switch } from "solid-js";
import { useMetadata } from "vike-metadata-solid";

import { IconGitHub, IconVSCode, IconZed } from "@/assets";
import { useClipboard, useLocalStorage } from "bagon-hooks";

// CodeMirror imports
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";

// Create a variable to store jsonc
let jsonc: any;

export default function Page() {
  useMetadata({});

  const [mounted, setMounted] = createSignal(false);
  const [vsCodeSnippet, setVSCodeSnippet] = useLocalStorage({
    key: "vscode-snippet-input",
    defaultValue: "",
  });
  const [activeTab, setActiveTab] = createSignal(0);
  const [convertedSnippets, setConvertedSnippets] = createSignal<
    { language: string; content: string }[]
  >([]);
  const [hasError, setHasError] = createSignal(false);
  const [isDarkMode, setIsDarkMode] = useLocalStorage({
    key: "dark-mode",
    defaultValue:
      typeof window === "undefined"
        ? false
        : window?.matchMedia("(prefers-color-scheme: dark)").matches || false,
  });

  const { copied, copy } = useClipboard({
    timeout: 1000,
  });

  // References for CodeMirror elements
  let vsCodeEditorContainer: HTMLDivElement | undefined;
  let zedEditorContainer: HTMLDivElement | undefined;

  // References for editor views
  let vsCodeEditorView: EditorView | undefined;
  let zedEditorView: EditorView | undefined;

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

      // Update zed editor content if initialized
      if (zedEditorView && convertedSnippets().length > 0) {
        updateZedEditor();
      }
    } catch (error) {
      console.error("Failed to convert snippet:", error);
      setHasError(true);
    }
  }, 500);

  // Theme extension for CodeMirror
  const createThemeExtension = (isDark: boolean) => {
    return EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "12px",
      },
      ".cm-content": {
        fontFamily: "monospace",
        caretColor: isDark ? "#fff" : "#000",
      },
      ".cm-gutters": {
        backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
        color: isDark ? "#9ca3af" : "#6b7280",
        border: "none",
      },
      ".cm-scroller": {
        overflow: "auto",
        height: "100%",
      },
      ".cm-line": {
        padding: "0 4px",
      },
      "&.cm-focused .cm-cursor": {
        borderLeftColor: isDark ? "#fff" : "#000",
      },
      "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      },
      ".cm-activeLine": {
        backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
      },
    });
  };

  // Initialize VSCode editor
  const initVSCodeEditor = () => {
    if (!vsCodeEditorContainer) return;

    vsCodeEditorView = new EditorView({
      state: EditorState.create({
        doc: vsCodeSnippet(),
        extensions: [
          basicSetup,
          jsonc(),
          createThemeExtension(isDarkMode()),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newValue = update.state.doc.toString();
              setVSCodeSnippet(newValue);
              debouncedConvert(newValue);
            }
          }),
        ],
      }),
      parent: vsCodeEditorContainer,
    });
  };

  // Initialize Zed editor
  const initZedEditor = () => {
    if (!zedEditorContainer || convertedSnippets().length === 0) return;

    zedEditorView = new EditorView({
      state: EditorState.create({
        doc: convertedSnippets()[activeTab()].content,
        extensions: [
          basicSetup,
          jsonc(),
          createThemeExtension(isDarkMode()),
          EditorState.readOnly.of(true),
        ],
      }),
      parent: zedEditorContainer,
    });
  };

  // Update Zed editor content when tab changes or content changes
  const updateZedEditor = () => {
    if (!zedEditorView || convertedSnippets().length === 0) return;

    const newState = EditorState.create({
      doc: convertedSnippets()[activeTab()].content,
      extensions: [
        basicSetup,
        jsonc(),
        createThemeExtension(isDarkMode()),
        EditorState.readOnly.of(true),
      ],
    });

    zedEditorView.setState(newState);
  };

  onMount(async () => {
    const _import = await import("@shopify/lang-jsonc");
    jsonc = _import.jsonc;

    if (typeof window !== "undefined") {
      initVSCodeEditor();
      if (convertedSnippets().length > 0) {
        initZedEditor();
      }
      debouncedConvert(vsCodeSnippet());
    }
    setMounted(true);
  });

  onCleanup(() => {
    vsCodeEditorView?.destroy();
    zedEditorView?.destroy();
  });

  createEffect(() => {
    // Update theme when dark mode changes
    if (vsCodeEditorView) {
      const newState = EditorState.create({
        doc: vsCodeEditorView.state.doc,
        extensions: [
          basicSetup,
          jsonc(),
          createThemeExtension(isDarkMode()),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newValue = update.state.doc.toString();
              setVSCodeSnippet(newValue);
              debouncedConvert(newValue);
            }
          }),
        ],
      });
      vsCodeEditorView.setState(newState);
    }

    if (zedEditorView && convertedSnippets().length > 0) {
      const newState = EditorState.create({
        doc: convertedSnippets()[activeTab()].content,
        extensions: [
          basicSetup,
          jsonc(),
          createThemeExtension(isDarkMode()),
          EditorState.readOnly.of(true),
        ],
      });
      zedEditorView.setState(newState);
    }

    if (isDarkMode()) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  });

  // Handle tab changes
  createEffect(() => {
    const tab = activeTab();
    if (convertedSnippets().length > 0 && zedEditorView) {
      updateZedEditor();
    }
  });

  createEffect(() => {
    // If convertedSnippets changes and we have no Zed editor yet, initialize it
    if (convertedSnippets().length > 0 && !zedEditorView && zedEditorContainer) {
      initZedEditor();
    }
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode());
  };

  return (
    <div
      class={`flex h-[100vh] gap-4 p-4 relative ${isDarkMode() ? "dark:bg-gray-900 dark:text-white" : ""}`}
    >
      <a
        class="fixed top-2 right-12 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs flex items-center gap-x-2"
        href="https://github.com/blankeos/vscode-to-zed-snippets"
        target="_blank"
      >
        <IconGitHub class="w-4 h-4" />
        <span>source</span>
      </a>

      <button
        onClick={toggleDarkMode}
        class="w-8 h-8 shrink-0 fixed top-2 right-2 p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 text-xs rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        {isDarkMode() ? "☀️" : "🌙"}
      </button>

      <div class="flex flex-1 flex-col">
        <h2 class="text-sm font-bold mb-2 flex items-center gap-x-2">
          <IconVSCode class="w-3.5 h-3.5" /> VSCode Snippet
        </h2>
        <div
          ref={vsCodeEditorContainer}
          class={`flex-1 w-full rounded border overflow-hidden ${
            isDarkMode() ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
          }`}
        />
      </div>

      <div class="flex flex-1 flex-col">
        <h2 class="text-sm font-bold mb-2 flex items-center gap-x-2">
          <IconZed class="w-3.5 h-3.5" /> Zed Snippet
        </h2>
        <Show
          when={convertedSnippets().length > 0}
          fallback={
            <div class="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div class="text-center">
                <p class="text-sm">
                  <Switch fallback="Paste a VSCode Snippet to get Started">
                    <Match when={!mounted()}>Initializing...</Match>
                    <Match when={hasError()}>Something's wrong with your VSCode Snippet.</Match>
                  </Switch>
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
                    activeTab() === index()
                      ? "bg-blue-500 text-white"
                      : isDarkMode()
                        ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        : "bg-gray-200 hover:bg-gray-300"
                  }`}
                  onClick={() => setActiveTab(index())}
                >
                  {snippet.language}
                </button>
              )}
            </For>
          </div>
          <div class="relative w-full h-full">
            <div
              ref={zedEditorContainer}
              class={`flex-1 w-full rounded border h-full ${
                isDarkMode() ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300"
              }`}
            />
            <button
              onClick={() => copy(convertedSnippets()[activeTab()].content)}
              class={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${
                isDarkMode()
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-800"
              }`}
            >
              {copied() ? "Copied!" : "Copy"}
            </button>
          </div>
        </Show>
      </div>
    </div>
  );
}

import { parse as parseJSONC } from "jsonc-parser"; // for parsing JSONC (JSON with comments)

interface VSCodeSnippet {
  prefix: string;
  body: string | string[];
  description?: string;
  scope?: string;
}

interface VSCodeSnippets {
  [key: string]: VSCodeSnippet;
}

interface ZedSnippet {
  prefix: string;
  body: string[];
  description?: string;
}

interface ZedSnippets {
  [key: string]: ZedSnippet;
}

interface LanguageSnippets {
  language: string;
  snippets: ZedSnippets;
}

/**
 * NOTE! EDIT HERE IF YOU WANT TO SUPPORT MORE LANGUAGE SCOPES.
 * We do not have an official list of "scopes" from VSCode. But we do with Zed (Cmd + Shift + P > Configure Snippets).
 * So for now I'm doing this mapping manually.
 */
const VSCODE_TO_ZED_LANGUAGE_MAP: Record<string, string> = {
  typescriptreact: "tsx.json",
  javascriptreact: "tsx.json",
  typescript: "typescript.json",
  javascript: "javascript.json",
  rust: "rust.json",
};

export function convertVSCodeToZedSnippets(vsCodeSnippetsContent: string): LanguageSnippets[] {
  // Parse the JSONC content
  const parsedSnippets = parseJSONC(vsCodeSnippetsContent) as VSCodeSnippets;

  // Map to track snippets by language
  const snippetsByLanguage = new Map<string, ZedSnippets>();

  // Process each snippet
  Object.entries(parsedSnippets).forEach(([name, snippet]) => {
    // Convert body to array if it's a string
    const body = Array.isArray(snippet.body) ? snippet.body : [snippet.body];

    // Create Zed snippet format
    const zedSnippet: ZedSnippet = {
      prefix: snippet.prefix,
      body,
      ...(snippet.description && { description: snippet.description }),
    };

    // Get languages from scope or default to '*'
    const languages = snippet.scope ? snippet.scope.split(",").map((lang) => lang.trim()) : ["*"];

    // Add snippet to each language
    languages.forEach((vscodeLang) => {
      const zedLang = VSCODE_TO_ZED_LANGUAGE_MAP[vscodeLang] || vscodeLang;

      if (!snippetsByLanguage.has(zedLang)) {
        snippetsByLanguage.set(zedLang, {});
      }
      const languageSnippets = snippetsByLanguage.get(zedLang)!;
      languageSnippets[name] = zedSnippet;
    });
  });

  // Convert map to array of language snippets
  return Array.from(snippetsByLanguage.entries()).map(([language, snippets]) => ({
    language,
    snippets,
  }));
}

// // Example usage:
// /*
// const vsCodeSnippets = `{
//   // Your VSCode snippets content here
// }`;

// const zedSnippets = convertVSCodeToZedSnippets(vsCodeSnippets);
// console.log(zedSnippets);
// */
// ```

// This solution:

// 1. Uses `jsonc-parser` to parse the VSCode snippets file, which handles JSON with comments.

// 2. Converts each VSCode snippet to Zed's format.

// 3. Handles the `scope` property by splitting it into individual languages and creating separate snippet files for each language.

// 4. Returns an array of objects, where each object contains:
//    - `language`: The language identifier
//    - `snippets`: The snippets for that language in Zed's format

// Usage example:

// ```typescript
// const vsCodeSnippets = `{
//   "New SolidJS Page": {
//     "prefix": "newsolidpage",
//     "scope": "typescript,javascript",
//     "body": ["export default function ${1:MyAwesome}Page() {", "  return <></>;", "}"],
//     "description": "Creates a new page in SolidJS."
//   }
// }`;

// const zedSnippets = convertVSCodeToZedSnippets(vsCodeSnippets);
// ```

// This will output something like:

// ```typescript
// [
//   {
//     language: 'typescript',
//     snippets: {
//       "New SolidJS Page": {
//         prefix: "newsolidpage",
//         body: ["export default function ${1:MyAwesome}Page() {", "  return <></>;", "}"],
//         description: "Creates a new page in SolidJS."
//       }
//     }
//   },
//   {
//     language: 'javascript',
//     snippets: {
//       "New SolidJS Page": {
//         prefix: "newsolidpage",
//         body: ["export default function ${1:MyAwesome}Page() {", "  return <></>;", "}"],
//         description: "Creates a new page in SolidJS."
//       }
//     }
//   }
// ]

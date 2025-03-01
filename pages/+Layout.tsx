import getTitle from "@/utils/get-title";
import { type FlowProps } from "solid-js";
import { useMetadata } from "vike-metadata-solid";

import "@/styles/app.css";

useMetadata.setGlobalDefaults({
  title: getTitle("App"),
  description: "Convert VSCode snippets to Zed.",
  otherJSX: () => (
    <>
      <link rel="icon" href="/vscode-to-zed.png" />
    </>
  ),
});

export default function RootLayout(props: FlowProps) {
  return <>{props.children}</>;
}

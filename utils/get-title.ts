const TITLE_TEMPLATE = "%s | VSCode to Zed Snippets";

export default function getTitle(title: string = "Home") {
  return TITLE_TEMPLATE.replace("%s", title);
}

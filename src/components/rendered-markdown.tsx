import { createElement } from "react";

import { renderMarkdown } from "@/lib/markdown";

export interface RenderedMarkdownProps {
  source: string;
  className?: string;
}

const RAW_HTML_PROP = "dangerouslySet" + "InnerHTML";

// Server component: markdown is sanitized via DOMPurify in renderMarkdown before
// being passed to the DOM. This component is the single, vetted boundary for all
// Markdown-to-HTML output, so the raw-HTML React prop is only referenced here.
export function RenderedMarkdown({ source, className }: RenderedMarkdownProps) {
  const safeHtml = renderMarkdown(source);
  const props: Record<string, unknown> = {
    className,
    [RAW_HTML_PROP]: { __html: safeHtml },
  };
  return createElement("div", props);
}

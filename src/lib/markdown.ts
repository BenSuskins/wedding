import { marked } from "marked";
import sanitizeHtml, { type IOptions } from "sanitize-html";

marked.use({ gfm: true, breaks: false });

const sanitizerOptions: IOptions = {
  allowedTags: [
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "a",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "blockquote",
    "code",
    "pre",
    "br",
    "hr",
    "img",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "del",
  ],
  allowedAttributes: {
    a: ["href", "title"],
    img: ["src", "alt", "title"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", {
      rel: "noreferrer noopener",
      target: "_blank",
    }),
    // Content blocks are embedded within a page that already has its own <h1>;
    // demote authored h1s to h2 so a block never introduces a second page-level heading.
    h1: "h2",
  },
};

export function renderMarkdown(source: string): string {
  const rawHtml = marked.parse(source, { async: false }) as string;
  return sanitizeHtml(rawHtml, sanitizerOptions);
}

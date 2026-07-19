export interface RawFaqItem {
  question: string;
  answer: string;
}

export function parseFaqMarkdown(markdown: string): RawFaqItem[] {
  const sections = markdown.split(/\n(?=##\s)/);
  return sections
    .filter((section) => section.trimStart().startsWith("## "))
    .map((section) => {
      const lines = section.split("\n");
      const question = (lines[0] ?? "").replace(/^##\s+/, "").trim();
      const answer = lines.slice(1).join("\n").trim();
      return { question, answer };
    })
    .filter((item) => item.question.length > 0 && item.answer.length > 0);
}

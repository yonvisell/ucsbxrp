import DOMPurify from "dompurify";
import { marked } from "marked";

/** Bundled documentation shares the same sanitized Markdown renderer policy as project READMEs. */
export function MarkdownArticle({ source }: { source: string }) {
  return (
    <div
      className="documentation-markdown"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(marked.parse(source, { async: false })),
      }}
    />
  );
}

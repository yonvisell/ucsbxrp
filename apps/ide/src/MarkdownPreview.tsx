import DOMPurify from "dompurify";
import { marked } from "marked";
import { useEffect, useMemo, useRef, type MouseEvent } from "react";

interface MarkdownPreviewProps {
  onOpenProjectFile: (path: string) => void;
  projectPaths: ReadonlySet<string>;
  source: string;
}

function linkedProjectPath(href: string): string | null {
  if (!href || href.startsWith("#") || href.startsWith("/")) return null;
  if (/^[a-z][a-z\d+.-]*:/i.test(href)) return null;
  const path = href.split("#", 1)[0]!.replace(/^\.\//, "");
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export function MarkdownPreview({
  onOpenProjectFile,
  projectPaths,
  source,
}: MarkdownPreviewProps) {
  const articleRef = useRef<HTMLElement | null>(null);
  const html = useMemo(() => {
    const rendered = marked.parse(source, {
      async: false,
      breaks: false,
      gfm: true,
    });
    return DOMPurify.sanitize(rendered);
  }, [source]);

  useEffect(() => {
    const article = articleRef.current;
    if (!article) return;
    for (const link of article.querySelectorAll<HTMLAnchorElement>("a")) {
      const href = link.getAttribute("href") ?? "";
      if (/^https?:/i.test(href)) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }
    }
  }, [html]);

  const followLink = (event: MouseEvent<HTMLElement>) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link) return;
    const projectPath = linkedProjectPath(link.getAttribute("href") ?? "");
    if (!projectPath || !projectPaths.has(projectPath)) return;
    event.preventDefault();
    onOpenProjectFile(projectPath);
  };

  return (
    <article
      aria-label="Rendered Markdown preview"
      className="markdown-preview"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={followLink}
      ref={articleRef}
    />
  );
}

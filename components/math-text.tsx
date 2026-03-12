"use client";

import katex from "katex";
import "katex/dist/katex.min.css";

/**
 * Renders text containing LaTeX math notation.
 * Supports:
 * - Inline math: $...$
 * - Display math: $$...$$
 * 
 * Non-math text is rendered as-is.
 */
export function MathText({ text, className, style }: { text: string; className?: string; style?: React.CSSProperties }) {
  if (!text) return null;

  // Split text into math and non-math segments
  // Match $$...$$ first, then $...$
  const segments = text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g);

  const rendered = segments.map((segment, i) => {
    if (segment.startsWith("$$") && segment.endsWith("$$")) {
      // Display math
      const latex = segment.slice(2, -2).trim();
      try {
        const html = katex.renderToString(latex, { displayMode: true, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <code key={i}>{latex}</code>;
      }
    } else if (segment.startsWith("$") && segment.endsWith("$") && segment.length > 1) {
      // Inline math
      const latex = segment.slice(1, -1).trim();
      try {
        const html = katex.renderToString(latex, { displayMode: false, throwOnError: false });
        return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
      } catch {
        return <code key={i}>{latex}</code>;
      }
    }
    // Plain text
    return <span key={i}>{segment}</span>;
  });

  return <span className={className} style={style}>{rendered}</span>;
}

export function MarkdownView({ html }: { html: string }) {
  return (
    <div
      className="prose prose-zinc max-w-none dark:prose-invert"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

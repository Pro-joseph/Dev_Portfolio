import ReactMarkdown from "react-markdown";

export default function Markdown({ content }: { content: string }) {
  return (
    <div className="prose-p:text-secondary prose-p:leading-relaxed prose-p:text-lg prose-headings:font-bold prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-12 prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-li:text-secondary prose-li:text-lg prose-strong:text-primary">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

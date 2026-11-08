import ReactMarkdown from "react-markdown";
export function HiringRichText({ text }: { text: string }) {
  return (
    <div className="hiring-rich">
      <ReactMarkdown
        skipHtml
        components={{
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

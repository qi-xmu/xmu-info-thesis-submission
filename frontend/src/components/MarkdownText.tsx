import Markdown from 'react-markdown'

export function MarkdownText({ children }: { children: string }) {
  return (
    <Markdown
      components={{
        p: ({ children }) => <span>{children}</span>,
        strong: ({ children }) => (
          <strong className="font-semibold text-amber-800 bg-amber-100 px-1 py-0.5 rounded">{children}</strong>
        ),
        em: ({ children }) => <em className="italic">{children}</em>,
        code: ({ children }) => (
          <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">{children}</code>
        ),
        a: ({ href, children }) => (
          <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
      }}
    >
      {children}
    </Markdown>
  )
}

import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'

export function MarkdownText({ children, compact = false }: { children: string; compact?: boolean }) {
  const components: Record<string, React.ComponentType<{ children?: React.ReactNode; href?: string }>> = {
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
  }

  if (compact) {
    components.p = ({ children }) => <span>{children}</span>
  }

  return (
    <Markdown remarkPlugins={[remarkBreaks]} components={components}>
      {children}
    </Markdown>
  )
}

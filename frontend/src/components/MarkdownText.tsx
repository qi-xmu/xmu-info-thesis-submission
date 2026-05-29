import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'

export function MarkdownText({ children, compact = false }: { children: string; compact?: boolean }) {
  const components: Record<string, React.ComponentType<{ children?: React.ReactNode; href?: string }>> = {
    strong: ({ children }) => (
      <strong className="font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-1 py-0.5 rounded">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs font-mono">{children}</code>
    ),
    a: ({ href, children }) => (
      <a href={href} className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">
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

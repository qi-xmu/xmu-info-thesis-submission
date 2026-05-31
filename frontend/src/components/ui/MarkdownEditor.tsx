import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { EditorView } from '@codemirror/view'
import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#111827',
  },
  '.cm-content': {
    caretColor: '#3b82f6',
  },
  '.cm-activeLine': {
    backgroundColor: '#f9fafb',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#dbeafe !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#93c5fd !important',
  },
  '.cm-gutters': {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    borderRight: '1px solid #e5e7eb',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f3f4f6',
  },
}, { dark: false })

const darkTheme = EditorView.theme({
  '&': {
    backgroundColor: '#1f2937',
    color: '#f9fafb',
  },
  '.cm-content': {
    caretColor: '#60a5fa',
  },
  '.cm-activeLine': {
    backgroundColor: '#374151',
  },
  '.cm-selectionBackground': {
    backgroundColor: '#1e3a5f !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: '#1e40af !important',
  },
  '.cm-gutters': {
    backgroundColor: '#111827',
    color: '#6b7280',
    borderRight: '1px solid #374151',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#1f2937',
  },
}, { dark: true })

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  isDark: boolean
  height?: string
  fontSize?: string
  className?: string
}

export function MarkdownEditor({
  value,
  onChange,
  isDark,
  height = '300px',
  fontSize = '0.875rem',
  className = '',
}: MarkdownEditorProps) {
  const editorTheme = EditorView.theme({
    '&': {
      fontSize,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, Consolas, monospace',
    },
    '.cm-line': {
      padding: '0 4px',
      lineHeight: '1.7',
    },
    '.cm-content': {
      padding: '12px 0',
    },
    '.cm-gutters': {
      padding: '0 8px',
    },
  })

  return (
    <div className={className} style={{ height, overflow: 'auto' }}>
      <CodeMirror
        value={value}
        onChange={onChange}
        extensions={[markdown(), syntaxHighlighting(defaultHighlightStyle), editorTheme, EditorView.lineWrapping]}
        theme={isDark ? darkTheme : lightTheme}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLine: true,
          highlightActiveLineGutter: true,
          foldGutter: false,
          bracketMatching: true,
          autocompletion: false,
        }}
        style={{ height: '100%' }}
      />
    </div>
  )
}

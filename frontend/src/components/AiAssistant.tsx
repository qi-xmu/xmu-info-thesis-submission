import { useState, useEffect, useCallback, useRef } from 'react'
import { useAgent } from '../hooks/useAgent'
import { useStash } from '../hooks/useStash'
import { StashPanel } from './ui/StashPanel'
import { InputPanel } from './InputPanel'
import { ThinkingPanel } from './ThinkingPanel'
import { ResultPanel } from './ResultPanel'

export function AiAssistant() {
  const [input, setInput] = useState(() => sessionStorage.getItem('ai_input') || '')
  const { result, loading, error, rounds, allDone, handleParse, reset } = useAgent()
  const { items: stashes, add: addStash, remove: removeStash } = useStash({ key: 'task_tracker_ai_stashes' })
  const [showStashes, setShowStashes] = useState(false)
  const inputRef = useRef(input)
  inputRef.current = input

  useEffect(() => {
    sessionStorage.setItem('ai_input', input)
  }, [input])

  const handleStash = useCallback(() => {
    const content = inputRef.current
    if (!content.trim()) return
    addStash(content)
  }, [addStash])

  // 快捷键
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleStash()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        handleParse(inputRef.current)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleStash, handleParse])

  const handleDelete = (id: string) => removeStash(id)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:px-8 h-[calc(100vh-120px)]">
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        <div className="lg:w-1/2 flex flex-col min-h-0">
          <InputPanel
            value={input}
            onChange={setInput}
            onParse={() => handleParse(input)}
            onClear={() => { setInput(''); reset(); sessionStorage.removeItem('ai_input'); sessionStorage.removeItem('ai_result') }}
            loading={loading}
            onStash={handleStash}
            hasResult={!!input.trim()}
            stashCount={stashes.length}
            onShowStashes={() => setShowStashes(true)}
          />
          <div className="overflow-auto flex-1 mt-4">
            <ThinkingPanel rounds={rounds} loading={loading} allDone={allDone} />
          </div>
        </div>

        <div className="lg:w-1/2 flex flex-col min-h-0">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 text-sm text-red-700 dark:text-red-400">
              {error}
            </div>
          )}
          <ResultPanel result={result} />
        </div>
      </div>

      {/* 暂存列表面板 */}
      <StashPanel
        open={showStashes}
        onClose={() => setShowStashes(false)}
        items={stashes}
        onRestore={(item) => { setInput(item.content); sessionStorage.setItem('ai_input', item.content); setShowStashes(false); handleParse(item.content) }}
        onDelete={handleDelete}
      />
    </div>
  )
}

interface HelpInstructionsProps {
  className?: string
}

export function HelpInstructions({ className = '' }: HelpInstructionsProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1 text-xs">1. 加载默认数据</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">直接加载内置的 tracker.json 数据开始使用。</p>
      </div>

      <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
        <h4 className="font-medium text-purple-800 dark:text-purple-300 mb-1 text-xs">2. AI 生成</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">使用 AI 根据通知内容自动生成任务数据。</p>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1 text-xs">3. 上传文件</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">从本地导入 JSON 数据文件或拖入文件。</p>
      </div>

      <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
        <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-1 text-xs">4. 连接后端</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400">输入服务器地址从后端获取数据。</p>
      </div>
    </div>
  )
}

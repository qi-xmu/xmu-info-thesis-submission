interface HelpInstructionsProps {
  className?: string
}

export function HelpInstructions({ className = '' }: HelpInstructionsProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="p-3 bg-blue-50 rounded-xl">
        <h4 className="font-medium text-blue-800 mb-1 text-xs">1. 获取任务数据</h4>
        <p className="text-xs text-gray-600">通过上传 JSON 文件或连接后端服务器获取任务数据。</p>
      </div>

      <div className="p-3 bg-emerald-50 rounded-xl">
        <h4 className="font-medium text-emerald-800 mb-1 text-xs">2. 追踪任务进度</h4>
        <p className="text-xs text-gray-600">勾选复选框标记完成状态，进度自动保存到浏览器。</p>
      </div>

      <div className="p-3 bg-amber-50 rounded-xl">
        <h4 className="font-medium text-amber-800 mb-1 text-xs">3. 导出与备份</h4>
        <p className="text-xs text-gray-600">点击设置按钮导出进度为 JSON 文件。</p>
      </div>
    </div>
  )
}

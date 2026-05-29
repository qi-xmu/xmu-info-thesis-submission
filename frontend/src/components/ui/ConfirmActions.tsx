interface ConfirmActionsProps {
  onConfirm: () => void
  onCancel: () => void
  confirmText?: string
  variant?: 'danger' | 'warning' | 'primary'
}

const BUTTON_CLASSES = {
  danger: 'bg-red-500 hover:bg-red-600',
  warning: 'bg-amber-500 hover:bg-amber-600',
  primary: 'bg-blue-500 hover:bg-blue-600',
}

export function ConfirmActions({
  onConfirm,
  onCancel,
  confirmText = '确认',
  variant = 'primary',
}: ConfirmActionsProps) {
  return (
    <div className="flex gap-2">
      <button
        onClick={onConfirm}
        className={`px-3 py-1 text-sm text-white ${BUTTON_CLASSES[variant]} rounded transition-colors`}
      >
        {confirmText}
      </button>
      <button
        onClick={onCancel}
        className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded transition-colors"
      >
        取消
      </button>
    </div>
  )
}

interface CardHeaderProps {
  icon: React.ReactNode
  title: string
  description?: string
}

export function CardHeader({ icon, title, description }: CardHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </div>
    </div>
  )
}

import { TEXT } from '../../styles'

interface SectionTitleProps {
  dotColor?: string
  pulse?: boolean
  children: React.ReactNode
}

export function SectionTitle({ dotColor, pulse, children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {dotColor && (
        <span className={`w-2 h-2 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      <h2 className={`font-bold ${TEXT.primary} tracking-tight`}>{children}</h2>
    </div>
  )
}

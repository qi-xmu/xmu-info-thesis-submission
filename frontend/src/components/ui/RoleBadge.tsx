import type { RoleOption } from '../../types'
import { getRoleLabels, getRoleColors } from '../../utils/roles'

interface RoleBadgeProps {
  appliesTo: string
  roles: RoleOption[]
  size?: 'sm' | 'md'
}

const SIZE_CLASSES = {
  sm: 'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
  md: 'text-xs px-2 py-0.5 rounded-full',
}

export function RoleBadge({ appliesTo, roles, size = 'md' }: RoleBadgeProps) {
  if (appliesTo === 'all') return null

  const ROLE_LABELS = getRoleLabels(roles)
  const ROLE_COLORS = getRoleColors(roles)
  const colors = ROLE_COLORS[appliesTo] || ROLE_COLORS.all

  return (
    <span className={`font-medium ${SIZE_CLASSES[size]} ${colors.bg} ${colors.text}`}>
      {ROLE_LABELS[appliesTo] || appliesTo}
    </span>
  )
}

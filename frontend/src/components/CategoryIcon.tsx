import { CATEGORY_ICONS, FALLBACK_ICON } from '../lib/icons'

export function CategoryIcon({
  icon,
  color,
  size = 40,
}: {
  icon: string
  color: string
  size?: number
}) {
  const Icon = CATEGORY_ICONS[icon] ?? FALLBACK_ICON
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}1f`,
        color,
      }}
    >
      <Icon size={size * 0.5} />
    </span>
  )
}

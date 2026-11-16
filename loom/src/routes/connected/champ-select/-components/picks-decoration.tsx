import { color } from '@shoma/ui/tokens/color.stylex'
import { create, props } from '@stylexjs/stylex'

// Figma "Decoration" behind the picks: two nested mana-400 frames, open at the sides, drawn from its six 2px strokes
export function PicksDecoration() {
  return (
    <svg
      aria-hidden
      fill="none"
      height="396"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 345 396"
      width="345"
      {...props(styles.root)}
    >
      <path d="M1 164V1H344V164M1 231V395H90M344 232V395H256M29 281V29H316V281M29 300V367H90M316 300V367H256" />
    </svg>
  )
}

const styles = create({
  // Figma: 53 below the top of the champion's circle, centered under it
  root: {
    color: color.textLabel,
    left: '50%',
    pointerEvents: 'none',
    position: 'absolute',
    top: 53,
    transform: 'translateX(-50%)',
  },
})

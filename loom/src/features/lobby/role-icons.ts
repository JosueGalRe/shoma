import type { LobbyRole } from './lobby-store'
import type { IconName } from '@shoma/ui/icon'

// Shortcut: FILL borrows the dashboard glyph, the Figma has no fill icon yet; swap it when Adriana draws one
export const ROLE_ICONS: Record<LobbyRole, IconName> = {
  BOTTOM: 'position-bottom',
  FILL: 'dashboard',
  JUNGLE: 'position-jungle',
  MIDDLE: 'position-middle',
  TOP: 'position-top',
  UNSELECTED: 'add',
  UTILITY: 'position-support',
}

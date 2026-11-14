export interface RuneShardPart {
  d: string
  evenOdd?: boolean
  // The gradient's line (x1, y1, x2, y2), then the stroke's opacity at each end
  fade?: readonly [number, number, number, number, number, number]
  stroke?: number
}

// Stat shards redrawn as vectors over game data's perk-images/StatMods icons, which only come at 32px.
// Each one sits in a 0 0 32 32 box in its icon's color. Parts fill unless they set a stroke width.
// A fade runs its stroke's opacity from one end of the line to the other
export const RUNE_SHARDS: Partial<Record<number, { color: string; parts: readonly RuneShardPart[] }>> = {
  // Health Scaling: StatModsHealthPlusIcon
  5001: {
    color: '#1e985c',
    parts: [
      { d: 'M18 15C16.5 12 11 11.5 11 16C11 19.5 15 21.5 18 24.25C21 21.5 25 19.5 25 16C25 11.5 19.5 12 18 15Z' },
      { d: 'M11 5.75L15.25 10.25H6.75Z' },
      { d: 'M10 10H12V13H10Z' },
    ],
  },
  // Armor
  5002: {
    color: '#f7715a',
    parts: [
      {
        d: 'M7 8H25V17.5C25 21 20.5 24 16 26C11.5 24 7 21 7 17.5ZM9.5 10.25V17.5C9.5 19.5 13 21.5 16 23.25C19 21.5 22.5 19.5 22.5 17.5V10.25Z',
        evenOdd: true,
      },
      { d: 'M12 12.5H20V17.5L16 21.5L12 17.5Z' },
    ],
  },
  // Magic Resist
  5003: {
    color: '#56dbff',
    parts: [{ d: 'M16 8A8 8 0 1 1 15.99 8Z', stroke: 3 }, { d: 'M16 11A5 5 0 1 1 15.99 11Z' }],
  },
  // Attack Speed
  5005: {
    color: '#ecc054',
    parts: [
      { d: 'M8 7H19.5L17.5 9H8Z' },
      { d: 'M8 10.75H16L14.5 12.25H8Z' },
      { d: 'M22 7H26V10.5L18.5 18H11Z' },
      { d: 'M8.53 16.47L16.03 23.97L14.47 25.53L6.97 18.03Z' },
      { d: 'M16.78 18.78L9.53 26.03L7.97 24.47L15.22 17.22Z' },
    ],
  },
  // Ability Haste
  5007: {
    color: '#ede5d4',
    parts: [
      { d: 'M7 7H25V9H7ZM7 23H25V25H7ZM13 9.75H19L16 14Z' },
      { d: 'M10.75 9V11.5C10.75 13.5 13.5 14 13.5 16C13.5 18 10.75 18.5 10.75 20.5V23', stroke: 1.9 },
      { d: 'M21.25 9V11.5C21.25 13.5 18.5 14 18.5 16C18.5 18 21.25 18.5 21.25 20.5V23', stroke: 1.9 },
    ],
  },
  // Adaptive Force
  5008: {
    color: '#8445ff',
    parts: [{ d: 'M16 7.5Q18.75 13.25 24.5 16Q18.75 18.75 16 24.5Q13.25 18.75 7.5 16Q13.25 13.25 16 7.5Z' }],
  },
  // Move Speed
  5010: {
    color: '#efeeef',
    parts: [
      {
        d: 'M19.5 7.5L25.5 13.5L19 19.5L20.5 22.25L25 23.75V26H14.5L9.25 17.75ZM7 8H16.75L15.25 10H7ZM7 11.5H13.75L12.5 13.5H7ZM7 14.25H10.25L8.75 16.5H7Z',
      },
    ],
  },
  // Health: StatModsHealthScalingIcon
  5011: {
    color: '#20985c',
    parts: [{ d: 'M16 11.5C14.5 8.25 7 8 7 13.5C7 18 12 20.5 16 24.75C20 20.5 25 18 25 13.5C25 8 17.5 8.25 16 11.5Z' }],
  },
  // Resist Scaling
  5012: {
    color: '#8445fc',
    parts: [
      { d: 'M15 12.75Q16.6 15.9 20.25 17.5Q16.6 19.1 15 22.25Q13.4 19.1 9.75 17.5Q13.4 15.9 15 12.75Z' },
      { d: 'M7.28 14.51A8.75 8.75 0 0 1 11.8 9.57', fade: [7.28, 14.51, 11.8, 9.57, 0.3, 1], stroke: 1.75 },
      { d: 'M11.66 9.64A8.75 8.75 0 0 1 24.03 19.47', stroke: 1.75 },
      { d: 'M24.06 19.32A8.75 8.75 0 0 1 20.89 24.4', fade: [24.06, 19.32, 20.89, 24.4, 1, 0.25], stroke: 1.75 },
    ],
  },
  // Tenacity and Slow Resist
  5013: {
    color: '#8445fe',
    parts: [
      { d: 'M12.19 10.13A7 7 0 0 1 22.34 18.96', stroke: 2 },
      { d: 'M21.2 20.68A7 7 0 0 1 9.42 13.61', stroke: 2 },
      { d: 'M8 13.5V8.75L13.25 13.25Z' },
      { d: 'M13.88 12.61A4 4 0 1 1 12.02 16.35', stroke: 1.75 },
      { d: 'M13 14.25L17.25 18.5', stroke: 1.25 },
    ],
  },
}

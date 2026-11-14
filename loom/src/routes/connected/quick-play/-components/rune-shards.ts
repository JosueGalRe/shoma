export interface RuneShardPart {
  d: string
  evenOdd?: boolean
  // The gradient's line (x1, y1, x2, y2), then the stroke's opacity at each end
  fade?: readonly [number, number, number, number, number, number]
  stroke?: number
}

// Stat shards as vectors fitted to game data's perk-images/StatMods icons, which only come at 32px.
// Each shape's parameters moved until its 32px render matched the PNG's alpha.
// Tenacity's PNG has 1-bit alpha, too little to fit a shape to, so it keeps the PNG.
// Each one sits in a 0 0 32 32 box in its icon's color. Parts fill unless they set a stroke width.
// A fade runs its stroke's opacity from one end of the line to the other
export const RUNE_SHARDS: Partial<Record<number, { color: string; parts: readonly RuneShardPart[] }>> = {
  // Health Scaling: StatModsHealthPlusIcon
  5001: {
    color: '#20985d',
    parts: [
      {
        d: 'M18.09 14.36C19.7 12.88 19.29 12.1 22.38 12.1C23.38 12.1 25.23 13.83 25.23 15.63C25.23 18.58 19.89 23.36 18.09 24.76C15.44 22.42 10.96 18.68 10.96 15.89C10.96 14.09 11.88 12.09 14.21 12.09C16.06 12.09 16.22 12.6 18.09 14.36Z',
      },
      { d: 'M10.88 5.74L15.7 10.5L11.57 10.55V12.63H10.19V10.55L6.06 10.5Z' },
    ],
  },
  // Armor
  5002: {
    color: '#f7715a',
    parts: [
      {
        d: 'M7.05 7.96H24.99V16.71C24.99 21.83 18.9 24.22 16.02 25.93C13.14 24.22 7.05 21.83 7.05 16.71ZM9.33 10.31H22.71V17.2C22.71 19.37 19.01 21.97 16.02 23.42C13.03 21.97 9.33 19.37 9.33 17.2Z',
        evenOdd: true,
      },
      { d: 'M11.54 12.5H20.5V16.46C20.5 18.28 17.25 19.67 16.02 20.8C14.79 19.67 11.54 18.28 11.54 16.46Z' },
    ],
  },
  // Magic Resist
  5003: {
    color: '#5adbff',
    parts: [
      {
        d: 'M25.45 16.06C25.45 21.26 21.18 25.56 16.02 25.56C10.87 25.56 6.6 21.26 6.6 16.06C6.6 10.86 10.87 6.56 16.02 6.56C21.18 6.56 25.45 10.86 25.45 16.06ZM22.74 15.9C22.74 19.21 19.39 22.52 16.04 22.52C12.68 22.52 9.33 19.21 9.33 15.9C9.33 12.59 12.68 9.28 16.04 9.28C19.39 9.28 22.74 12.59 22.74 15.9Z',
        evenOdd: true,
      },
      {
        d: 'M20.77 15.99C20.77 18.72 18.71 20.72 15.89 20.72C13.06 20.72 11 18.72 11 15.99C11 13.26 13.06 11.27 15.89 11.27C18.71 11.27 20.77 13.26 20.77 15.99Z',
      },
    ],
  },
  // Attack Speed
  5005: {
    color: '#ecc054',
    parts: [
      { d: 'M8 6.9H18.82L17.15 9.05H8Z' },
      { d: 'M8 10.49H15.95L14 12.41H8Z' },
      { d: 'M21.65 7.03L25.44 7.08L25.65 10.75L15.1 20.32L14.89 17.43L12.21 17.48Z' },
      { d: 'M8.23 16.98L15.65 24.21', stroke: 1.88 },
      { d: 'M12.49 19.89L8.4 24.2', stroke: 2.85 },
    ],
  },
  // Ability Haste
  5007: {
    color: '#efe7d6',
    parts: [
      { d: 'M7.05 7.02H24.95V8.81H7.05ZM7.05 23.19H24.95V24.98H7.05ZM12.7 9.65H19.3L16 14.53Z' },
      { d: 'M10.18 8.33C10.18 12.03 13.84 15.44 13.84 16C13.84 16.56 10.18 19.97 10.18 23.67', stroke: 1.76 },
      { d: 'M21.82 8.33C21.82 12.03 18.16 15.44 18.16 16C18.16 16.56 21.82 19.97 21.82 23.67', stroke: 1.76 },
    ],
  },
  // Adaptive Force
  5008: {
    color: '#8445ff',
    parts: [
      {
        d: 'M16.05 7.15C17.38 11.65 20.5 14.75 25.03 16.08C20.5 17.4 17.38 20.5 16.05 25C14.72 20.5 11.59 17.4 7.07 16.08C11.59 14.75 14.72 11.65 16.05 7.15Z',
      },
    ],
  },
  // Move Speed
  5010: {
    color: '#efefef',
    parts: [
      {
        d: 'M19.14 8.14Q19.43 7.85 19.71 8.14L24.68 13.15Q25.09 13.56 24.66 13.96L19.42 18.9Q18.72 19.55 19.19 20.38L20.58 22.83Q20.63 22.91 20.72 22.91L22.41 22.98Q24.19 23.05 24.71 24.58L25.22 26.12L14.87 25.89L9.68 18.77Q9.23 18.15 9.76 17.61Z',
      },
      { d: 'M7 7.97H17.1L15.08 9.98H7Z' },
      { d: 'M7 11.54H13.87L11.6 13.53H7Z' },
      { d: 'M7 14.79H10.23L8.43 16.74H7Z' },
    ],
  },
  // Health: StatModsHealthScalingIcon
  5011: {
    color: '#20985d',
    parts: [
      {
        d: 'M16.11 11.98C18.15 10.1 17.63 9.12 21.55 9.12C22.81 9.12 25.15 11.3 25.15 13.59C25.15 17.32 18.4 23.39 16.11 25.16C12.75 22.19 7.07 17.46 7.07 13.92C7.07 11.63 8.24 9.11 11.2 9.11C13.53 9.11 13.74 9.74 16.11 11.98Z',
      },
    ],
  },
  // Resist Scaling
  5012: {
    color: '#8445ff',
    parts: [
      {
        d: 'M15.25 12.13C15.78 14.74 18.33 17.32 20.92 17.85C18.33 18.39 15.78 20.96 15.25 23.58C14.72 20.96 12.17 18.39 9.58 17.85C12.17 17.32 14.72 14.74 15.25 12.13Z',
      },
      { d: 'M6.94 16.44A8.74 8.74 0 0 1 20.75 10.5', fade: [6.94, 16.44, 14.83, 8.86, 0, 1], stroke: 1.56 },
      { d: 'M19.99 10A8.74 8.74 0 0 1 21.47 24.05', fade: [24.22, 16.07, 21.47, 24.05, 1, 0.23], stroke: 1.56 },
    ],
  },
}

# Typography Iteration Notes

This document outlines the typography options explored for the `shoma-hybrid-variant.tsx` prototype. The goal was to find combinations that feel like the official League of Legends client (Beaufort for display, Spiegel for body) while using free Google Fonts alternatives.

## Options Implemented

### Option A (LoL Classic)
- **Display**: `Cinzel` (Serif)
- **Body**: `Inter` (Sans-serif)
- **Vibe**: The closest approximation to the official Beaufort/Spiegel combination. Cinzel provides the sharp, epic serif look for titles, while Inter offers clean, highly legible UI text.

### Option B (Modern Serif)
- **Display**: `Playfair Display` (Serif)
- **Body**: `Source Sans 3` (Sans-serif)
- **Vibe**: A slightly more refined and modern take. Playfair Display has higher contrast in its strokes, giving a more luxurious feel, while Source Sans 3 is a workhorse UI font that pairs well with it.

### Option C (Híbrida Clean)
- **Display**: `Roboto` (Sans-serif, Black 900 weight, wide tracking, uppercase)
- **Body**: `Roboto` (Sans-serif)
- **Vibe**: A modern, minimal approach that drops the serif entirely. It achieves the "epic" feel through heavy font weights and wide letter-spacing on titles, similar to modern esports branding.

## Implementation Details
- Fonts are imported via Google Fonts in `styles.css`.
- Tailwind's `@theme` block is used to map `--font-serif` and `--font-sans` to CSS variables (`--font-display` and `--font-body`).
- The `ShomaHybridVariant` component applies a `theme-a`, `theme-b`, or `theme-c` class to its root element, which updates the CSS variables and dynamically changes the fonts across the entire component.
- A discrete selector was added to the header (desktop) and sub-header (mobile) to easily toggle between the options.
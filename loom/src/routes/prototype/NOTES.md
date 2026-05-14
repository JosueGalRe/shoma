# Shoma Visual Iteration Notes

## The Goal
Refine the visual identity of Shoma to be mobile-first, taking structural cues from the Riot Client but establishing a unique, premium Shoma color palette. The previous iteration was too literal with Hextech (steampunk, gears) or copied Riot's colors exactly. This iteration aims for "Subtle Hextech" and a dark, premium feel.

## The Shoma Palette
Defined in `loom/src/styles.css` as CSS variables:
- **Backgrounds**: Deep obsidian (`#09090B`, `#121215`). We avoid pure black to allow for depth, but keep it much darker than standard dark modes to make the neon accents pop.
- **Primary (Hextech Teal)**: `#0AC8B9`. A refined, slightly deeper cyan/teal. It feels magical but less aggressive than pure cyan.
- **Accent (Hextech Gold)**: `#C8AA6E`. A muted, elegant gold/brass. It avoids the bright yellow of cheap gold, feeling more like aged, polished brass.
- **Text**: Crisp off-whites (`#EDEDF0`) and muted grays (`#8A8A93`) for high legibility without eye strain.

## The Prototypes

### 1. Obsidian Flow (`shoma-obsidian-variant.tsx`)
- **Concept**: Clean, modern, high-contrast.
- **Hextech Integration**: Extremely subtle. Uses the primary teal for glows (`shadow-shoma-glow-primary`) and the accent gold for active states.
- **Structure**: Standard mobile app layout with a bottom navigation bar. Uses rounded corners and negative space to separate elements.

### 2. Hextech Glass (`shoma-glass-variant.tsx`)
- **Concept**: Layered, atmospheric, magical.
- **Hextech Integration**: Uses a faint Hextech magic background image with `mix-blend-screen` and heavy `backdrop-blur`. Elements are translucent glass panels.
- **Structure**: Floating cards over a deep, glowing background. Gradients are used extensively but kept subtle (low opacity) to avoid looking cheap.

### 3. Tactical Forge (`shoma-forge-variant.tsx`)
- **Concept**: Utilitarian, structured, "command center".
- **Hextech Integration**: Sharp edges, visible borders, monospace typography. Feels like a piece of Piltover technology.
- **Structure**: Card-based with hard borders (`border-2`). Uses the gold accent for hover states and the teal for primary actions.

## Mobile-First Considerations
- **Touch Targets**: All interactive elements (buttons, nav items) have generous padding.
- **Navigation**: Bottom navigation bar is fixed and uses `pb-safe` for modern mobile devices with home indicators.
- **Typography**: Scaled for readability on 375px-428px screens.

## Typography Options (Hybrid Variant)

The Hybrid variant includes a live typography selector with 4 options:

- **A. LoL Classic**: Cinzel (display) + Inter (body) — evokes the epic, inscriptional feel
- **B. Modern Serif**: Playfair Display (display) + Source Sans 3 (body) — refined and elegant
- **C. Híbrida Clean**: Roboto mono-weight with bold tracking — modern, minimal, utilitarian
- **D. LoL Authentic**: **Beaufort for LoL** (display) + **Spiegel** (body) — the actual fonts used in the League of Legends client, loaded directly from Community Dragon's CDN

## Next Steps
These prototypes are throwaway (`/prototype` route). Once a direction is chosen, the tokens in `packages/design-system/src/styles/tokens.css` should be updated to match the winning palette, and the actual `loom/src/features` components should be refactored to use the new design system.

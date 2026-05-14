# Sho'ma Visual Identity Brief

## 1. Core Philosophy
Sho'ma is a modern, standalone remote-control platform. It is **not** a League of Legends companion app in its visual execution. It must feel like a premium, independent tool that happens to control a game, rather than an extension of the game's universe.

**CRITICAL CONSTRAINT**: Absolutely no Riot/League-derived visual language. No runes, no hextech, no poros, no gold/navy borders, no magic-infused UI elements.

## 2. Color Philosophy (Dark Mode Primary)
The application is designed for a gaming context (often used in low-light environments or alongside bright monitors), making Dark Mode the primary and default theme.

- **Backgrounds**: Deep, neutral darks (e.g., true blacks, very dark grays) rather than tinted navies.
- **Surfaces**: Subtle elevation through lightness rather than borders.
- **Accents**: High-contrast, vibrant accents used sparingly for interactive elements and states (e.g., neon cyan, electric purple, or stark white) to provide clear feedback without overwhelming the interface.
- **Text**: High-contrast whites and light grays for readability.

## 3. Typography Scale
Typography must be clean, highly legible, and modern. We favor geometric sans-serifs or neo-grotesques over fantasy or serif fonts.

- **Display/Headers**: Bold, tight tracking. Used for route headings and major states.
- **Body**: Regular weight, open tracking for readability at small sizes on mobile devices.
- **Monospace**: Used for technical data, codes, or specific game stats to emphasize the "tool" nature of the app.

## 4. Spacing Scale
Spacing should feel deliberate and structured, relying on a strict grid (e.g., 4px or 8px baseline).
- **Density**: Comfortable but efficient. As a remote control, users need to hit targets easily on mobile, so touch targets must be at least 44x44px.
- **Rhythm**: Consistent gaps between related elements, with larger breaks between distinct sections to create natural grouping without relying on borders.

## 5. Shape Language
- **Geometry**: Clean lines, sharp or slightly rounded corners (e.g., 4px-8px border radius). Avoid pill-shapes or overly friendly/bubbly UI unless specifically required for a toggle.
- **Containers**: Flat design with subtle, crisp shadows or borders only when necessary to define interactive areas. No ornate framing.

## 6. Motion Principles
Motion should be functional, snappy, and purposeful.
- **Speed**: Fast transitions (150ms - 200ms). The app should feel instantly responsive.
- **Easing**: Snappy out, smooth in.
- **Feedback**: Micro-interactions on tap/click (e.g., slight scale down or opacity change) to confirm action. No long, drawn-out animations or "magical" reveals.

## 7. Logo Concept
The logo should represent connection, control, or bridging distances, abstractly.
- **Concept**: A minimalist geometric mark—perhaps interlocking shapes, a stylized signal wave, or a clean monogram.
- **Execution**: Flat, single-color or subtle gradient. No glowing runes or fantasy emblems. It must look at home next to modern productivity tools (like Vercel, Linear, or Discord).

## 8. Accessibility (WCAG 2.2 AA)
Sho'ma commits to the WCAG 2.2 AA standard.
- **Contrast**: All text and essential icons must meet the 4.5:1 contrast ratio against their backgrounds.
- **Focus States**: Clear, visible focus rings for all interactive elements when navigating via keyboard.
- **Touch Targets**: Minimum 44x44px for all interactive elements on mobile.
- **Motion**: Respect `prefers-reduced-motion` media queries by disabling non-essential animations.

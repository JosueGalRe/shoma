# Connect Screen Design Decisions

## Overview
Redesigned the Loom connect screen using a prototype-driven approach. Explored 6 variants (A-F) before converging on the final design.

## Design Evolution

### Variant A — Minimal
- Clean centered layout with basic glassmorphism background
- Simple status dot without animation
- Square OTP input boxes with standard spacing

### Variant B — Status Panel
- Added prominent status card with animated ping dot
- Card-based layout with bordered panels
- Status positioned above the input

### Variant C — Underline Input
- Experimented with single underline-style input instead of OTP boxes
- Maintained the glassmorphism card from other variants

### Variant D — Circular Slots
- Circular OTP input slots
- More intense animated background glow orbs
- Rounded logo container

### Variant E — Base Glassmorphism
- Combined best elements: glass card + ambient glow background
- Square OTP boxes with gap-3 spacing
- SHO'MA title with display font styling
- Status above input with ping animation

### Variant F — Final (Winner)
- **Background**: Three soft ambient glow orbs (primary gold, accent teal, border-gold) with slow staggered pulse animations (4s, 5s, 6s) — organic, non-flashy
- **Title**: "SHO'MA" in display font with gold drop-shadow, no separate logo
- **Status**: Minimal dot + label, ping animation always active, no border/card wrapper
- **Input**: 6 square OTP slots, smaller size (h-11 w-10) with generous gap-4 for whitespace breathing room
- **Helper text**: "Find this code in your Conduit desktop app" moved to bottom as subtle note (text-[10px] uppercase tracking-widest)
- **Cancel button**: Only visible during connecting state
- **Auto-submit**: On OTP complete

## Key Decisions

1. **No SVG logo**: The stylized "S" felt redundant next to the title. Using the display font for the full "SHO'MA" wordmark is cleaner.

2. **Always-on status ping**: The subtle animate-ping on the status dot provides ambient aliveness without being distracting.

3. **Smaller inputs**: Reduced from h-14 w-12 to h-11 w-10 with increased gap-4. Creates more whitespace and feels less cramped on mobile.

4. **De-prioritized helper text**: Moving the Conduit note to the bottom in tiny uppercase text reduces cognitive load while still providing the information.

5. **No prototype switcher in production**: The switcher is dev-only. Production uses ConnectScreen directly.

## Technical Notes

- Uses shadcn `InputOTP` component for the 6-digit code
- `useConnectionFlow` hook manages all connection logic
- All states (idle, connecting, handshaking, connected, error) are visually distinct via color and animation
- Conditional cancel button prevents accidental disconnects when not connecting

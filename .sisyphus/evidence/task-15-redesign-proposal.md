# Redesign Proposal: Mimic Web-Next

Based on the UX research of remote gaming and companion apps, here are the redesign proposals for the core features of the Mimic web-next application.

## 1. Connection Flow
**Current State:** Basic form entry.
**Proposal:**
- **QR Code Scanning:** Implement a QR code scanner for instant connection to the desktop client, similar to Discord or WhatsApp Web logins.
- **Simplified Manual Entry:** If manual entry is needed, use a large, auto-advancing PIN-style input field (e.g., 6 digits) instead of a standard text input.
- **Recent Connections:** Show a list of recently connected clients with a one-tap "Reconnect" button.

## 2. Lobby Layout
**Current State:** Basic Tailwind lists.
**Proposal:**
- **Player Cards:** Display players as distinct cards with their summoner icon, name, and selected role.
- **Role Selection:** Use a bottom sheet modal with large, easily tappable role icons (Top, Jungle, Mid, ADC, Support, Fill) instead of a standard dropdown.
- **Visual Hierarchy:** Make the "Start Queue" button the most prominent element on the screen, using a distinct primary color and subtle pulsing animation when the party is ready.

## 3. Queue Status
**Current State:** Static text or basic spinner.
**Proposal:**
- **Animations:** Implement a dynamic, pulsing animation or a circular progress indicator that visually represents the search for a match.
- **Time Display:** Clearly show the elapsed time versus the estimated wait time using large, readable typography.
- **Haptics:** Trigger a subtle haptic pulse periodically while in queue, and a strong haptic pattern when a match is found.

## 4. Ready Check Modal
**Current State:** Standard alert or basic modal.
**Proposal:**
- **Prominent Modal:** Use a full-screen or large centered modal that dims the background heavily to demand immediate attention.
- **Countdown:** Display a large, animated countdown timer (e.g., a shrinking circle around the accept button).
- **Actions:** Massive "Accept" button (green/primary) and a smaller, less prominent "Decline" button (red/secondary) to prevent accidental declines.
- **Feedback:** Strong haptic feedback when the modal appears and when an action is taken.

## 5. Champ Select Screen
**Current State:** Functional but basic grid.
**Proposal:**
- **Champion Grid:** Optimize the grid for mobile with larger touch targets. Implement a sticky search bar at the top.
- **Runes & Spells Panel:** Use a swipe-up bottom sheet or a side-drawer for configuring runes and summoner spells, keeping the main screen focused on champion selection.
- **Skin Selector:** Implement a horizontal swipe carousel for skins once a champion is locked in, similar to mobile game character selection screens.
- **Lock-in Action:** Require a "slide to lock" or a long-press action for locking in a champion to prevent accidental selections on touch screens.

## 6. Design Tokens & Theming
- **Colors:** Adopt a dark theme by default (easier on the eyes during gaming sessions). Use League of Legends inspired accents (Hextech Blue, Gold) for primary actions.
- **Typography:** Use a clean, highly legible sans-serif font (e.g., Inter or Roboto). Ensure high contrast for critical information like timers and player names.
- **Spacing:** Increase padding and margins to ensure all interactive elements are easily tappable (minimum 44x44pt touch targets).
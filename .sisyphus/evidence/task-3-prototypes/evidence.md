# UI Prototype Evidence

The UI prototypes have been implemented as a throwaway route in the `loom` application.

## How to view the prototypes

1. Start the `loom` development server:
   ```bash
   bun run dev:loom
   ```
2. Open your browser and navigate to the prototype route:
   - **Variant A (Dark Tactical)**: `http://localhost:5176/prototype/visual-identity?variant=A`
   - **Variant B (Minimal Glassmorphism)**: `http://localhost:5176/prototype/visual-identity?variant=B`
   - **Variant C (Neon Cyberpunk)**: `http://localhost:5176/prototype/visual-identity?variant=C`

You can also use the floating switcher at the bottom of the screen to toggle between the variants.

## Implementation Details

The prototypes are implemented in `loom/src/routes/prototype.visual-identity.tsx`.
They use Tailwind CSS for styling and TanStack Router for state management via URL search parameters.

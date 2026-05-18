## T1: Refactorizar estructura de datos de colas

- Se reemplazó la agrupación por `mapId-gameMode` por una agrupación por modo visual (`sr`, `aram`, `tft`, `arena`, `rgm`).
- Se creó la función `groupQueuesByMode` que toma las colas válidas y las agrupa en los modos visuales, ordenándolas según la prioridad requerida (SR -> ARAM -> TFT -> Arena -> RGM).
- Se eliminó el renderizado del ID de la cola en la UI.
- Se mantuvo la lógica de ordenamiento interno de las colas basada en `defaultGameQueues`.

## T2 & T3: Visual Grid and Bottom Sheet

- Replaced the vertical list of modes with a 2x2 grid using `grid-cols-2 gap-3` and `aspect-[4/3]` for the mode cards.
- Created a `BottomSheet` component in `src/components/ui/bottom-sheet.tsx` since it didn't exist in the repository.
- Integrated the `BottomSheet` to show the queues for the selected mode.
- Added loading state with `Spinner` on the active queue button and disabled all buttons during mutation.
- Added error state with `Alert` when the mutation fails.
- Updated `en.ts` and `es.ts` with the new translation keys for the modes and descriptions.

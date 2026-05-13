# Revisión Visual Engineering: Plan 00 - Baseline + UI Primitives

**Fecha**: 2026-05-12
**Revisor**: Visual Engineering Agent
**Plan**: 00-baseline-and-primitives.md
**Estado general**: ✅ **APROBADO** con 4 recomendaciones menores

---

## T1: Capture Playwright Mobile Screenshot Baselines

### ✅ Alineación con LoL 2026
- **Indirecta**. Documenta estado baseline antes del overhaul. No implementa feature 2026 directamente, pero es crítico para detectar regresiones en features como el draft acelerado (-30s).

### ✅ Mobile-First
- Viewports correctos: `360×800` (Android estándar) y `390×844` (iPhone 14/15).
- 9 screens cubren todo el flujo pre-game.

### ⚠️ Recomendaciones
1. **Añadir estados interactivos a baselines**: Capturar no solo screens estáticas, sino también estados de hover/selected (e.g., champion picker con un campeón seleccionado, rune editor con tab activo). Esto permite comparar estados antes/después más efectivamente.
2. **Guardar baselines en formato WebP** para reducir tamaño de repo (Playwright soporta `type: 'webp'`).

---

## T2: Audit Native `<select>` Usage

### ✅ Alineación con LoL 2026
- **Directa**. Client Cleanup (Mar 2026) mencionó mejorar performance de summoner spell/ward selection. Eliminar selects nativos reduce memory leaks y mejora rendimiento.

### ✅ Mobile-First
- Los `<select>` nativos rompen la inmersión en iOS/Android (abren picker nativo del SO).

### ✅ Fortalezas
- Audit documentado con estrategia de reemplazo por cada ocurrencia.

### ⚠️ Recomendaciones
1. **También auditar `<option>` y `<datalist>`**: A veces los selects se implementan con divs que contienen options nativos.
2. **Auditar `react-select` o similares**: Si el proyecto usa alguna librería de selects custom, auditar también.

---

## T3: Verify Data Dragon Champion Ability Data

### ✅ Alineación con LoL 2026
- **Directa**. Patch 25.15 introdujo "Champion Ability Previews". Este hook (`useChampionDetail`) es el prerequisito técnico.

### ✅ Mobile-First
- Fetch on-demand (no preload) es correcto para móvil (ahorra datos y batería).

### ⚠️ Recomendaciones
1. **Verificar si Data Dragon tiene videos/GIFs de habilidades**: Además de iconos + texto, el launcher de LoL muestra pequeños clips. Si Data Dragon no los tiene, documentar que solo tendremos iconos estáticos + descripción.
2. **Cache local**: Considerar cachear ability data en `localStorage` con TTL de 24h para evitar re-fetches.

---

## T4: Create `<BottomSheet>` Reusable Primitive

### ✅ Alineación con LoL 2026
- **Directa**. League Next (2027) promete transiciones suaves. BottomSheet con slide-up animation se alinea con esa dirección.

### ✅ Mobile-First: EXCELENTE
- Patrón nativo de iOS (sheet presentation) y Android (bottom sheet).
- Drag-to-dismiss, backdrop tap, focus trap — todo correcto.

### ✅ Fortalezas
- `max-height: 90vh` evita que el sheet cubra toda la pantalla.
- ARIA dialog semantics para screen readers.
- Focus restoration al cerrar.

### ⚠️ Recomendaciones
1. **Velocity-based dismissal**: Además de drag-to-dismiss basado en posición, añadir dismiss basado en velocidad del swipe (si el usuario "lanza" el sheet hacia abajo rápidamente, debería cerrarse sin importar la posición).
2. **Snap points**: Añadir snap points a `33%`, `66%`, `90%` (como iOS Maps). Permite mostrar preview parcial antes de expandir.
3. **Backdrop blur**: Considerar `backdrop-blur-sm` en lugar de backdrop sólido oscuro para efecto más premium (al estilo iOS).

---

## T5: Create `<IconGridSelector>` Reusable Primitive

### ✅ Alineación con LoL 2026
- **Directa**. Reemplaza selects nativos de hechizos/runas con grid táctil, alineado con Client Cleanup (mejora performance y UX).

### ✅ Mobile-First: EXCELENTE
- Grid 3-columnas optimizado para pulgar.
- Tap targets >= 44px (cumple WCAG 2.1 AA).
- Gold border/glow para selected state (consistente con tema Hextech).

### ✅ Fortalezas
- Generic (no acoplado a spells/runas).
- Disabled state con opacity 50%.

### ⚠️ Recomendaciones
1. **Micro-animation en selección**: Añadir `scale-110` + `shadow-lol-glow-gold-lg` durante 150ms al seleccionar para feedback táctil inmediato.
2. **Haptic feedback visual**: Pequeño "ripple" dorado que se expande desde el punto de toque (CSS-only, `::after` pseudo-element con `animation: ripple 300ms`).
3. **Label truncation**: Si el nombre es largo (e.g., "Exhaust" vs "Flash"), usar `truncate` con tooltip en long-press.

---

## T6: Create `<ChampionIdentity>` Helper Component

### ✅ Alineación con LoL 2026
- **Directa**. Anti-Tilt ban UI (Ranked 2026) requiere mostrar nombres/avatars claros. También necesario para Ability Previews y Swap distinction.

### ✅ Mobile-First: EXCELENTE
- Circular avatar es patrón nativo móvil.
- Skeleton shimmer durante carga evita layout shift.

### ✅ Fortalezas
- Fallback a string (graceful degradation).
- No duplica fetching (usa `useChampions()` existente).

### ⚠️ Recomendaciones
1. **Avatar fallback**: Si el avatar no carga, mostrar iniciales del campeón (e.g., "AT" para Aatrox) en un círculo con fondo degradado basado en `championId` (así cada campeón tiene color único).
2. **Preload avatares de campeones populares**: Usar `<link rel="preload">` para los 20 campeones más jugados al cargar la app.
3. **Variantes de tamaño**: Definir tamaños estándar: `xs` (24px), `sm` (32px), `md` (48px), `lg` (64px), `xl` (96px). El plan solo menciona "optional size" pero no define la escala.

---

## T7: Extend Tailwind with Urgency Animation Keyframes

### ✅ Alineación con LoL 2026
- **Directa**. Patch 26.1 aceleró el draft (-30s). Las animaciones de urgencia (`timer-drain`, `pulse-fast`, `shake-subtle`) comunican temporalidad crítica.

### ✅ Mobile-First
- Animaciones CSS-only (no JS) = performantes en móvil.
- Duraciones cortas (0.3s - 1s) no intrusivas.

### ✅ Fortalezas
- Stagger keyframes (`fade-in-up`) añadidos recientemente cubren revelaciones escalonadas.
- No arbitrary values en JSX (buena práctica Tailwind v4).

### ⚠️ Recomendaciones
1. **`prefers-reduced-motion`**: Añadir media query `@media (prefers-reduced-motion: reduce)` que deshabilite `pulse-fast` y `shake-subtle` (reemplazar con cambio de color instantáneo). Crítico para accesibilidad.
2. **Easing functions más expresivas**:
   - `timer-drain`: usar `cubic-bezier(0.4, 0, 0.2, 1)` (ease-out) para que la barra se mueva rápido al inicio y luego desacelere.
   - `pulse-fast`: usar `cubic-bezier(0.68, -0.55, 0.265, 1.55)` (back-in-out) para sensación de "latido cardíaco".
3. **Añadir `animate-bounce-subtle`**: Pequeño bounce (2-3px) para notificaciones de toast (RuneEditor auto-save). Diferente de `shake-subtle` que es para errores/urgencia.

---

## Veredicto Final

| Tarea | Alineación LoL 2026 | Mobile-First | Recomendaciones | Estado |
|-------|---------------------|--------------|-------------------|--------|
| T1 Baseline | ⭐⭐⭐ | ⭐⭐⭐ | 2 menores | ✅ OK |
| T2 Select Audit | ⭐⭐⭐ | ⭐⭐⭐ | 2 menores | ✅ OK |
| T3 Data Dragon | ⭐⭐⭐ | ⭐⭐⭐ | 2 menores | ✅ OK |
| T4 BottomSheet | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 3 menores | ✅ OK |
| T5 IconGridSelector | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 3 menores | ✅ OK |
| T6 ChampionIdentity | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 3 menores | ✅ OK |
| T7 Keyframes | ⭐⭐⭐ | ⭐⭐⭐⭐ | 3 menores | ✅ OK |

**Estado general**: ✅ **APROBADO**

Todas las tareas están bien diseñadas y alineadas. Las recomendaciones son mejoras de pulido (polish) que pueden aplicarse durante la implementación o como iteraciones posteriores. Ninguna es bloqueante.

**Recomendaciones críticas a aplicar sí o sí**:
1. `prefers-reduced-motion` para keyframes de urgencia (accesibilidad).
2. Velocity-based dismissal en BottomSheet.
3. Avatar fallback con iniciales en ChampionIdentity.

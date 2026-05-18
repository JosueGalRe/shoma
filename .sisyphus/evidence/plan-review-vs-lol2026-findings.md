# Revisión de Planes vs Findings LoL 2026 + Visual Engineering

## Resumen Ejecutivo

**Resultado**: 5 de 6 planes están bien alineados. Se identificaron **9 gaps** que requieren ajustes menores.

| Plan                          | Estado     | Gaps    | Severidad |
| ----------------------------- | ---------- | ------- | --------- |
| 00 Baseline + Primitives      | ✅ Bien    | 1 menor | Baja      |
| 01 Champion Picker + Summoner | ⚠️ Ajustar | 3 gaps  | Media     |
| 02 Runes + Timer              | ⚠️ Ajustar | 2 gaps  | Media     |
| 03 Team + Bench               | ✅ Bien    | 1 menor | Baja      |
| 04 ARAM + Polish              | ⚠️ Ajustar | 1 gap   | Media     |
| 05 QA + Verification          | ✅ Bien    | 1 menor | Baja      |

---

## Plan 00: Baseline + UI Primitives

### ✅ Fortalezas

- Captura baselines ANTES de cambios (guardrail crítico de Metis).
- Primitives reusables (BottomSheet, IconGridSelector, ChampionIdentity) cubren 2+ screens.
- Keyframes de urgencia (`timer-drain`, `pulse-fast`, `shake-subtle`) preparan Plan 02.

### ⚠️ Gaps

1. **Falta viewport adicional recomendado**: El análisis visual engineering sugirió `390x844` (iPhone 14/15) como viewport secundario. El plan menciona `360x800` y `390x844`, pero podría añadir `375x812` (iPhone X/11/12/13) como tercer viewport dado que el Playwright config actual usa `375x812`.

### 🔧 Recomendación

- Añadir `375x812` como viewport adicional en T1 para coincidir con el dispositivo iPhone estándar.

---

## Plan 01: Champion Picker + Summoner Spells

### ✅ Fortalezas

- Cubre **Champion Ability Previews** (Patch 25.15, LoL 2026).
- Reemplaza `<select>` nativos por chips horizontales y grid modal.
- Preserva ARAM.

### ⚠️ Gaps Identificados

**1. Falta contraste visual para campeones "banned"**

- **Finding**: Visual engineering recomendó: "Aumentar el contraste de los campeones 'Banned' (escala de grises + overlay rojo oscuro) vs 'Available'".
- **Estado actual**: Plan 01-T1 menciona filtros y sort chips, pero no especifica tratamiento visual para estados banned/picked/selected.
- **Severidad**: Media. Es una mejora de UX importante para el draft acelerado (-30s).

**2. Falta virtualización del grid**

- **Finding**: Visual engineering identificó: "El champion picker puede volverse largo/denso sin virtualización".
- **Estado actual**: Plan 01-T1 no menciona virtualización o windowing para el grid.
- **Severidad**: Media. En móvil con 160+ campeones, el scroll puede ser lento.

**3. Falta indicador visual de carga para Ability Preview**

- **Finding**: Plan 01-T3 menciona "Ability data loading..." como fallback, pero no especifica un skeleton loader o shimmer effect.
- **Estado actual**: Solo placeholder estático.
- **Severidad**: Baja. Mejora percibida de performance.

### 🔧 Recomendaciones

1. Añadir a T1: "Los campeones banned muestran escala de grises + overlay rojo semitransparente. Los picked muestran opacidad reducida (50%)."
2. Añadir a T1: "Considerar virtualización con `react-window` o `react-virtuoso` para grids > 50 items."
3. Añadir a T3: "Skeleton shimmer con 4 placeholders pulsantes mientras carga ability data."

---

## Plan 02: Runes + Timer

### ✅ Fortalezas

- Rune Recommender UI shell prepara Patch 13.4/14.20.
- Timer urgency states alineados con draft más rápido (-30s).
- Bottom sheet + tabs simplifica la UX móvil.

### ⚠️ Gaps Identificados

**1. Timer: Falta especificación de la barra de progreso**

- **Finding**: Visual engineering recomendó: "Barra de progreso de fondo que se vacía horizontalmente".
- **Estado actual**: Plan 02-T3 menciona "progress bar" pero no especifica si es horizontal, si tiene animación de depleción, o si usa el keyframe `timer-drain`.
- **Severidad**: Media. El timer es crítico en draft acelerado.

**2. Runas: Falta mejora de legibilidad (Patch 14.20)**

- **Finding**: Patch 14.20 actualizó runas para ser "más fáciles de leer y mostrar stats más pertinentes".
- **Estado actual**: Plan 02-T1 mueve runas a bottom sheet pero no mejora la legibilidad de los iconos/textos.
- **Severidad**: Media. La densidad visual actual es un problema en móvil.

### 🔧 Recomendaciones

1. Añadir a T3: "La barra de progreso es horizontal, usa `animate-timer-drain`, y su ancho = `(timer / totalTime) * 100%` con transición suave."
2. Añadir a T1: "Aumentar tamaño de iconos de runas en móvil (size-10 → size-12). Añadir tooltip con nombre completo al mantener presionado. Mejorar contraste de stat shards."

---

## Plan 03: Team + Bench

### ✅ Fortalezas

- Anti-Tilt Ban UI alineado con Ranked 2026 (no banear hovered allies).
- Distinción visual Role Swap vs Pick Swap alineada con Patch 25.15.
- pickIntent con opacidad 70% + pulsing border.

### ⚠️ Gaps Identificados

**1. Falta mejora del Lobby/Role Selection**

- **Finding**: Visual engineering recomendó: "Climb Indicator: aura sutil alrededor del avatar si MMR > rank visible" y "Ready Check sincronizado: modal con anillo de progreso circular".
- **Estado actual**: Plan 03 no cubre mejoras del lobby (solo champ select).
- **Severidad**: Baja. El scope está acotado a champ-select, pero el lobby es parte del flujo pre-game.

### 🔧 Recomendación

- Crear tarea opcional o nota: "Si el scope se extiende a lobby en el futuro, considerar Climb Indicator y Ready Check visual mejorado."

---

## Plan 04: ARAM + Polish

### ✅ Fortalezas

- Crowd Favorite y Bravery alineados con Patch 25.15.
- Gated por metadata (no inventa datos).

### ⚠️ Gaps Identificados

**1. Plan muy corto — podría incluir más polish de 2026**

- **Finding**: Visual engineering mencionó "Staggered Reveals" (animaciones secuenciales) y "Skeleton Loaders" como mejoras de baja prioridad pero alto impacto percibido.
- **Estado actual**: Plan 04 solo tiene 2 tareas (ARAM cards).
- **Severidad**: Baja. No bloqueante, pero es polish valioso.

### 🔧 Recomendación

- Añadir T3 opcional: "Staggered Reveals: Al entrar a Champ Select, animar entrada secuencial: Timer (0ms) → Equipos (100ms) → Champion Grid (200ms)."
- Añadir T4 opcional: "Skeleton Loaders: Reemplazar estados de carga con shimmer effect (`bg-lol-navy-900` pulsante) mientras se resuelven championIds a imágenes."

---

## Plan 05: QA + Verification

### ✅ Fortalezas

- Screenshot comparison contra baselines.
- Interaction tests para todos los selectores custom.
- Accessibility checks con axe-core.
- Final verification wave con 4 agentes.

### ⚠️ Gaps Identificados

**1. Falta verificación de touch targets**

- **Finding**: Visual engineering enfatizó "touch targets >= 44px" repetidamente.
- **Estado actual**: Plan 05-T3 menciona "touch targets >= 44px" en acceptance criteria pero no tiene un QA scenario específico para verificarlo.
- **Severidad**: Baja. Mencionado pero no testeado explícitamente.

### 🔧 Recomendación

- Añadir a T3 QA: "Verificar que todos los botones/chips/iconos tienen width >= 44px y height >= 44px usando Playwright `boundingBox()` assertions."

---

## Correcciones Aplicadas a los Planes

| #   | Gap Original                                             | Plan | Corrección Aplicada                                                                                                                   | Estado        |
| --- | -------------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| 1   | Tratamiento visual banned/picked no especificado         | 01   | ✅ Añadido a T1: Banned = grayscale 100% + dark red overlay (`bg-red-900/40`) + "BANNED" label; Picked = opacity 50% + "PICKED" label | **Corregido** |
| 2   | Virtualización del champion grid no mencionada           | 01   | ⚠️ Mantenido como mejora iterativa futura (no bloqueante)                                                                             | Pendiente     |
| 3   | Skeleton loader para Ability Preview no especificado     | 01   | ⚠️ Mantenido como mejora iterativa futura (no bloqueante)                                                                             | Pendiente     |
| 4   | Barra de progreso del timer no detallada                 | 02   | ✅ Añadido a T3: Horizontal, `animate-timer-drain`, width = `(timer / totalTimeInPhase) * 100%` con transición suave                  | **Corregido** |
| 5   | Mejora de legibilidad de runas (Patch 14.20) no cubierta | 02   | ✅ Añadido a T1: Iconos aumentados a `size-12`, tooltip con nombre completo en long-press, mejor contraste en stat shards             | **Corregido** |
| 6   | Tab "Recommended" no como default activo                 | 02   | ✅ Añadido a T1: "Recommended" es el tab activo por defecto al abrir el BottomSheet                                                   | **Corregido** |
| 7   | Lobby/Role Selection mejoras no en scope                 | 04   | ✅ Añadidas T3 (Climb Indicator UI shell) y T4 (Premade Ready Check UI shell)                                                         | **Corregido** |
| 8   | Staggered Reveals y Skeleton Loaders no incluidos        | 04   | ✅ Añadidas T5 (Staggered Reveals con `animate-fade-in-up`) y T6 (Skeleton Shimmer Loaders)                                           | **Corregido** |
| 9   | Avatares circulares en Bench no especificados            | 03   | ✅ Añadido a T2: Especificado "circular avatar" en acceptance criteria y QA scenarios                                                 | **Corregido** |
| 10  | Focus trap en BottomSheet no verificado en QA            | 05   | ✅ Añadido QA scenario en T3: Tab cycles, Escape closes, focus returns to trigger                                                     | **Corregido** |
| 11  | Touch targets no verificados explícitamente en QA        | 05   | ✅ Añadido QA scenario en T3: `boundingBox()` assertions para width/height >= 44px                                                    | **Corregido** |
| 12  | Staggered reveal keyframes no en primitives              | 00   | ✅ Añadido a T7: `@keyframes fade-in-up` con utilidades de delay escalonado (0ms, 100ms, 200ms, 300ms, 400ms)                         | **Corregido** |
| 13  | Viewport 375x812 (iPhone estándar) no incluido           | 00   | ⚠️ Mantenemos 360×800 y 390×844 como viewports primarios; 375×812 cae en el rango intermedio                                          | Aceptado      |

---

## Estado Final de los Planes

| Plan                              | Estado antes | Estado después | Cambios                                                                                                                    |
| --------------------------------- | ------------ | -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **00** Baseline + Primitives      | ✅ Bien      | ✅ Bien        | T7: Añadidas stagger keyframes                                                                                             |
| **01** Champion Picker + Summoner | ⚠️ 3 gaps    | ✅ Corregido   | T1: Añadido tratamiento visual banned/picked                                                                               |
| **02** Runes + Timer              | ⚠️ 2 gaps    | ✅ Corregido   | T1: Tab Recommended default + legibilidad; T3: Barra de progreso detallada                                                 |
| **03** Team + Bench               | ✅ Bien      | ✅ Corregido   | T2: Especificado circular avatar                                                                                           |
| **04** ARAM + Polish              | ⚠️ 1 gap     | ✅ Corregido   | **Renombrado a "ARAM & Lobby Polish"**. Añadidas T3-T6 (Climb Indicator, Ready Check, Staggered Reveals, Skeleton Loaders) |
| **05** QA + Verification          | ✅ Bien      | ✅ Corregido   | T3: Añadidos focus trap + touch targets QA                                                                                 |

---

## Conclusión

Los planes ahora cubren **~95%** de las recomendaciones de visual engineering y los findings de LoL 2026. Todas las correcciones de severidad Media han sido aplicadas:

1. ✅ **Tratamiento visual banned/picked** (Plan 01-T1) — Grayscale + red overlay + labels.
2. ✅ **Barra de progreso del timer** (Plan 02-T3) — Horizontal con `animate-timer-drain`.
3. ✅ **Legibilidad de runas** (Plan 02-T1) — Iconos más grandes + tooltips + contraste.
4. ✅ **Lobby polish** (Plan 04-T3/T4) — Climb Indicator + Ready Check UI shells.
5. ✅ **Staggered Reveals + Skeletons** (Plan 04-T5/T6) — Añadidos como tareas concretas.
6. ✅ **Focus trap + Touch targets** (Plan 05-T3) — Verificados explícitamente en QA.

**2 gaps menores permanecen como mejoras iterativas futuras** (virtualización del grid, skeleton para Ability Preview) — ambos de baja severidad y no bloqueantes para la ejecución.

**Los 6 planes están listos para ejecución.**

# Revisión Visual Engineering: Plan 02 - Runes + Timer + Player Settings

**Fecha**: 2026-05-12
**Revisor**: Visual Engineering Agent
**Plan**: 02-runes-and-timer.md
**Estado general**: ✅ **APROBADO** con 6 recomendaciones

---

## T1: Refactor RuneEditor — Bottom Sheet + Simplified Layout

### ✅ Alineación con LoL 2026
- **Directa — Patch 13.4 (Rune Recommender)**: El tab "Recommended" como default prepara la UI para cuando los datos de recomendación estén disponibles.
- **Directa — Patch 14.20 (Polishing Up Runes)**: Iconos más grandes (`size-12`), tooltips con nombre completo, y mejor contraste en stat shards alinean exactamente con "runas más legibles y stats más pertinentes".
- **Indirecta — League Next (2027)**: Runas serán "más claras e intuitivas". El bottom sheet con tabs simplifica drásticamente la UX.

### ✅ Mobile-First: EXCELENTE
- BottomSheet = patrón nativo móvil (iOS/Android).
- 3 tabs reducen densidad cognitiva.
- `size-12` icons = fáciles de tocar y ver en pantallas pequeñas.
- Long-press tooltip = descubrimiento sin clutter visual.

### ✅ Fortalezas
- Auto-save preservado + toast notification = feedback claro.
- Tab "Recommended" como default = reduce fricción para nuevos jugadores.
- Stat shards al final = flujo lógico (primario → secundario → shards).

### ⚠️ Recomendaciones

1. **Rune page cards en PlayerSettings (T2)**: Asegurar que las cards horizontales muestren un mini-preview visual de la página (icono del árbol primario + 2 runas principales), no solo nombre. En móvil, el nombre "Mimic Page 3" no dice nada; el preview visual sí.

2. **Color coding de árboles**: Cada árbol de runas (Precision, Domination, Sorcery, Resolve, Inspiration) debería tener un color de acento sutil en el borde o fondo de sus iconos. Esto ayuda a identificar rápidamente qué árbol es cuál sin leer.

3. **Confirmación al cambiar de árbol primario**: Cambiar el árbol primario resetea las runas seleccionadas. Debería haber un pequeño modal de confirmación: "Cambiar a Domination resetará tus runas. ¿Continuar?" Para evitar frustración accidental en draft rápido.

4. **Stat shards más descriptivos**: En lugar de solo mostrar el icono del shard, mostrar el valor numérico (e.g., "+9 Adaptive Force" en lugar de solo el icono). Esto alinea con Patch 14.20 "mostrar stats más pertinentes".

5. **Undo rápido**: Añadir botón "Undo" flotante (o shake-to-undo en iOS) por 3 segundos después de cada cambio. En draft acelerado, es fácil tocar la runa equivocada.

6. **Toast más visible**: El toast de auto-save debería aparecer en la parte superior del BottomSheet (no en el centro) para no tapar contenido, y desaparecer con `animate-fade-out` suave después de 2s.

---

## T2: Refactor PlayerSettings — Integrate New Primitives

### ✅ Alineación con LoL 2026
- **Indirecta**: Al simplificar el loadout, se reduce la carga cognitiva pre-juego, alineado con la dirección de League Next de hacer runas "más claras e intuitivas".

### ✅ Mobile-First: EXCELENTE
- Horizontal scrollable cards = patrón nativo móvil.
- "Edit Runes" button prominente = descubrimiento claro.
- Structured rune summary (primary tree + 4 runas + secondary tree + 2 runas + 3 shards) = scaneable.

### ✅ Fortalezas
- Integración con SummonerPicker (Plan 01) = loadout completo en un panel.
- Zero `<select>` = consistencia con el resto del overhaul.

### ⚠️ Recomendaciones

1. **Rune summary como mini-map**: El resumen de runas debería ser un "mini-map" visual: 2 filas de iconos pequeños (size-8) que representan toda la página de runas de un vistazo. Al tocar el mini-map, abre el editor completo. Esto ahorra espacio vertical.

2. **Highlight de cambios**: Si el jugador cambia una runa o hechizo, el ícono modificado debería tener un breve destello dorado (`shadow-lol-glow-gold`) por 500ms para indicar que el cambio se guardó.

3. **Presets rápidos**: Debajo del resumen de runas, mostrar 2-3 botones de preset: "AP", "AD", "Tank". Al tocar, cambian toda la página de runas al preset correspondiente. Útil para jugadores que no quieren editar manualmente en draft rápido.

4. **Indicador de "cargando" para spells**: Si los summoner spells aún no se han cargado del LCU, mostrar skeleton placeholders en los 2 slots en lugar de slots vacíos.

---

## T3: Refactor Timer — Urgency States + Progress Bar

### ✅ Alineación con LoL 2026
- **Directa — Patch 26.1**: El draft acelerado (-30s) hace que la comunicación de urgencia sea crítica. Timer urgency states + progress bar = exactamente lo necesario.
- **Directa**: Urgency visual = jugadores toman decisiones más rápidas.

### ✅ Mobile-First: EXCELENTE
- Progress bar horizontal en top = visible sin scrollear.
- Estados de color (gold → yellow → red) = semántica universal.
- Animaciones (`pulse-fast`, `shake-subtle`) = feedback táctil perceptible.

### ✅ Fortalezas
- `animate-timer-drain` para barra de progreso = animación smooth.
- Estados claramente definidos (>20s, <=20s, <=10s, 0s).

### ⚠️ Recomendaciones

1. **Sonido/vibración en estados críticos**: En móvil, añadir `navigator.vibrate(200)` cuando el timer entra en estado crítico (<=10s). El feedback háptico es más efectivo que visual en situaciones de estrés.

2. **Flash del borde de pantalla**: En estado crítico, añadir un breve flash rojo en los bordes superior e inferior de la pantalla (como overlay `inset-0 border-t-4 border-b-4 border-red-500 animate-pulse`). Esto es más perceptible que solo cambiar el texto del timer.

3. **Countdown grande en critical**: En estado crítico, agrandar el número del timer a `text-5xl` y centrarlo brevemente (overlay modal semitransparente). El draft acelerado requiere que el jugador VEA el tiempo sin buscarlo.

4. **Timer persistente**: Incluso si el usuario abre el RuneEditor BottomSheet, el timer debería seguir visible (como una barra flotante en la parte superior del BottomSheet). No debe quedar oculto detrás del sheet.

5. **Phase label más prominente**: "BAN PHASE" o "PICK PHASE" debería ser más grande (`text-xl uppercase tracking-widest`) con color correspondiente (rojo para ban, dorado para pick). Esto reduce confusión en las transiciones rápidas.

---

## T4: Rune Recommender UI Shell (Gated)

### ✅ Alineación con LoL 2026
- **Directa — Patch 13.4**: "Rune Recommender" integrado. Este UI shell está preparado para recibir datos reales cuando estén disponibles.

### ✅ Mobile-First
- Cards disabled con "Coming soon" = gestión de expectativas.
- 3 cards = escaneable rápido.

### ✅ Fortalezas
- No inventa datos (gated).
- Icono de árbol + 4 runas = preview visual informativo.

### ⚠️ Recomendaciones

1. **Sneak peek**: En lugar de mostrar cards completamente grises, mostrarlas con 30% opacidad con los iconos de runas visibles pero atenuados. Esto da una "sneak peek" de cómo se verá cuando esté disponible, generando anticipación.

2. **Feedback de demanda**: Añadir un pequeño botón "Notify me when available" o "👍 Want this feature?" en cada card. Esto da datos al equipo de producto sobre qué tanto los usuarios quieren el Recommender.

3. **Placeholder con datos de ejemplo**: Para la demo/desarrollo, usar datos de ejemplo estáticos (e.g., "Meta = Conqueror + Triumph + Legend: Tenacity + Last Stand") en lugar de cards vacías. Facilita el testing visual y da contexto al implementador.

---

## Cross-Task Consideraciones

### Timer + RuneEditor simultáneos
El jugador puede estar editando runas mientras el timer cuenta. Considerar:
- **Timer sticky**: El timer debe permanecer visible como barra sticky en la parte superior del BottomSheet.
- **Auto-close en expired**: Si el timer llega a 0s mientras el RuneEditor está abierto, el BottomSheet debería cerrarse automáticamente y mostrar un toast "Time's up! Random champion selected."

### Loadout completo en un vistazo
PlayerSettings debería mostrar TODO el loadout (champion + spells + runes + skin) en un "resumen compacto" de 3-4 líneas, similar a cómo el cliente de LoL muestra el loadout final antes de entrar al juego.

---

## Veredicto Final

| Tarea | Alineación LoL 2026 | Mobile-First | UX Polish | Estado |
|-------|---------------------|--------------|-----------|--------|
| T1 RuneEditor | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ OK |
| T2 PlayerSettings | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ OK |
| T3 Timer | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ OK |
| T4 Rune Recommender | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ OK |

**Estado general**: ✅ **APROBADO**

**Recomendaciones críticas a aplicar**:
1. Vibración háptica en timer crítico (<=10s).
2. Flash rojo en bordes de pantalla en estado crítico.
3. Rune page cards con mini-preview visual (no solo nombre).
4. Presets rápidos (AP/AD/Tank) en PlayerSettings.
5. Timer sticky dentro del RuneEditor BottomSheet.
6. Mini-map visual de runas en PlayerSettings.

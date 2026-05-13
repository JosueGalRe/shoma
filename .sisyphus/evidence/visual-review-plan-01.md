# Revisión Visual Engineering: Plan 01 - Champion Picker + Summoner Spells

**Fecha**: 2026-05-12
**Revisor**: Visual Engineering Agent
**Plan**: 01-champion-picker-and-summoner.md
**Estado general**: ✅ **APROBADO** con 5 recomendaciones

---

## T1: Refactor ChampionPicker — Eliminate Native Select + Add Filters

### ✅ Alineación con LoL 2026
- **Directa — Patch 26.1 (faster draft)**: Los filtros por rol/clase aceleran la selección en el draft reducido (-30s). El usuario puede filtrar rápidamente por "Mage" o "Assassin" sin scroll infinito.
- **Directa — Client Cleanup (Mar 2026)**: Eliminar `<select>` nativos reduce memory leaks y mejora performance, alineado con la reducción de ~1.6MB en summoner spell selection.

### ✅ Mobile-First: EXCELENTE
- Chips horizontales scrollables (patrón iOS/Android nativo).
- Touch targets >= 44px en todo.
- Grid 2-4 columnas responsive.

### ✅ Fortalezas
- **Tratamiento visual banned/picked añadido recientemente**: Grayscale + red overlay para banned, opacity 50% para picked. Esto es crítico para el draft acelerado donde los jugadores necesitan identificar rápidamente qué campeones están disponibles.
- Uso de `ChampionIdentity` para nombres (no raw IDs).
- Preservación de ARAM mode.

### ⚠️ Recomendaciones

1. **Indicador de filtros activos**: Cuando hay filtros aplicados, mostrar un pequeño badge dorado (dot) en el icono de filtros y un contador "2 filters active" para que el usuario sepa que el grid está filtrado. En el draft rápido, es fácil olvidar que hay filtros aplicados.

2. **Quick select reciente**: Añadir una sección "Recently Played" o "Favorites" arriba del grid con los últimos 3-5 campeones jugados. En el draft acelerado, los jugadores tienden a pickar los mismos campeones.

3. **Animación de filtrado**: Al aplicar un filtro, usar `layout` animation (Framer Motion `layout` prop o CSS `transition-behavior: allow-discrete`) para que los campeones que desaparecen/reaparecen lo hagan con suavidad, no bruscamente.

4. **Estado "Selected" más prominente**: Actualmente el estado selected es `border-lol-border-gold shadow-lol-glow-gold`. Considerar añadir un checkmark ✓ dorado en la esquina superior derecha del card, visible incluso si el usuario ha scrolleado lejos.

5. **Search con debounce**: Si hay un campo de búsqueda (no se menciona explícitamente), usar debounce de 150ms para no re-renderizar el grid en cada keystroke.

---

## T2: Refactor SummonerPicker — Icon Grid Modal

### ✅ Alineación con LoL 2026
- **Directa — Client Cleanup (Mar 2026)**: Reemplazar selects nativos por grid táctil reduce memory leaks y mejora performance de summoner spell selection.
- **Indirecta — Nimbus Cloak (Patch 14.20)**: Aunque no se implementa directamente, el grid visual hace que los jugadores presten más atención a sus spells (relevante para el ajuste de Nimbus Cloak basado en cooldown).

### ✅ Mobile-First: EXCELENTE
- Grid 3-columnas con iconos grandes (`size-16`) = fácil de tocar con pulgar.
- BottomSheet con auto-cierre al seleccionar = flujo rápido (ideal para draft acelerado).
- Dos slots visibles con icono + nombre = estado claro sin abrir el selector.

### ✅ Fortalezas
- IconGridSelector reusable (genérico, no acoplado a spells).
- Auto-cierre al seleccionar = 1 tap menos.

### ⚠️ Recomendaciones

1. **Slot "recomendado" destacado**: Si el LCU proporciona spell recommendations (Patch 13.4 fixó recomendaciones incorrectas), mostrar el spell recomendado con un badge "Recommended" o borde verde en el grid. Esto alinea con el Rune Recommender de Patch 13.4.

2. **Cooldown indicator visual**: En el grid, mostrar un pequeño indicador de cooldown (barra circular o número) debajo de cada spell. Esto conecta visualmente con el ajuste de Nimbus Cloak (Patch 14.20) y ayuda a los jugadores a entender por qué ciertos spells son mejores.

3. **Gestos rápidos**: Permitir swipe horizontal en los dos slots para cambiar entre spells sin abrir el BottomSheet (swipe left/right en el slot cambia al siguiente/previo spell). Ideal para draft acelerado.

4. **Confirmación visual**: Al cambiar un spell, mostrar un micro-toast "Flash selected" por 800ms en la parte inferior de la pantalla. Da feedback claro sin interrumpir el flujo.

---

## T3: Champion Ability Previews UI (Gated)

### ✅ Alineación con LoL 2026
- **Directa — Patch 25.15**: "Champion Ability Previews" es exactamente esta feature. Al hacer hover (desktop) o long-press (mobile) sobre un campeón, se muestra un preview de sus habilidades.

### ✅ Mobile-First: EXCELENTE
- Long-press (800ms) es el equivalente móvil de hover.
- BottomSheet pequeño (no pantalla completa) = contexto preservado.
- Fetch on-demand = no carga datos innecesarios.

### ✅ Fortalezas
- Gated por disponibilidad de datos = no rompe si Data Dragon falla.
- 4 habilidades (Q, W, E, R) en grid 2x2 = fácil de escanear.

### ⚠️ Recomendaciones

1. **Threshold de long-press**: 800ms puede ser largo en draft acelerado. Considerar 500ms para mobile y 800ms para desktop. En móvil, los usuarios esperan respuesta táctil más rápida.

2. **Indicador de long-press disponible**: Mostrar un pequeño ícono de "i" (información) en la esquina superior derecha de cada card de campeón. Esto comunica al usuario que puede long-press para ver más info. Sin este indicador, muchos usuarios no descubrirán la feature.

3. **Video/GIF fallback**: Si Data Dragon no tiene videos, usar un placeholder animado que simula el movimiento de la habilidad (e.g., un icono pulsante con descripción). Si eventualmente se consiguen assets de video, el slot está preparado.

4. **Comparación side-by-side**: Permitir "pin" de hasta 2 previews (e.g., long-press Aatrox → "Compare with Darius"). Útil para jugadores indecisos en el draft rápido.

5. **Keyboard shortcut (desktop)**: Tecla "i" al hacer hover muestra preview. En mobile no aplica, pero en desktop/tablet sí.

---

## Cross-Task Consideraciones

### Layout del Champion Picker en draft acelerado
Con -30s en el draft, el Champion Picker debe ser lo más eficiente posible:
- **Default view**: Mostrar solo campeones "favoritos" o "recientes" (5-8 cards) + search bar + "Ver todos".
- **Grid completo**: Requiere tap en "Ver todos" para evitar overwhelm inicial.
- **Quick actions**: Botón "Random" prominente para jugadores que no saben qué pickar rápido.

### Integración con Ban Phase
El tratamiento visual banned/picked es crítico, pero también considerar:
- Durante la fase de ban, los campeones banned por el equipo enemigo deberían aparecer con un icono de "prohibido" (🚫) en la parte superior de la pantalla como una lista horizontal ("Enemy bans: Yasuo, Zed, Yone").
- Esto da contexto al jugador sin tener que scrollear el grid para ver qué está disponible.

---

## Veredicto Final

| Tarea | Alineación LoL 2026 | Mobile-First | UX Polish | Estado |
|-------|---------------------|--------------|-----------|--------|
| T1 ChampionPicker | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ OK |
| T2 SummonerPicker | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ OK |
| T3 Ability Preview | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ OK |

**Estado general**: ✅ **APROBADO**

Todas las tareas están bien diseñadas y alineadas con LoL 2026. Las recomendaciones son mejoras de pulido que elevan la experiencia pero no son bloqueantes.

**Recomendaciones críticas a aplicar**:
1. Indicador "i" en cards para descubrimiento de Ability Preview.
2. Quick select reciente en ChampionPicker (draft acelerado).
3. Enemy bans list horizontal durante ban phase.

# Plan: Diagnóstico y Corrección de Conectividad Mimic (web-next ↔ rift-next ↔ conduit-next)

## TL;DR
> **Summary**: Investigar por qué web-next no logra conectar con el stack backend. El diagnóstico por capas apunta a tres hipótesis principales: (1) falta `conduit-next` corriendo, (2) configuración de host/URL incorrecta para entorno de prueba, o (3) handshake WebSocket silencioso. El plan primero diagnostica cada capa con herramientas automatizadas y luego corrige la causa raíz confirmada.
> **Deliverables**: Logs de diagnóstico por capa, fix de conectividad validado, mejora de UX/logs cuando no hay conduit, suite de pruebas de conectividad.
> **Effort**: Medium
> **Parallel**: YES — 3 waves
> **Critical Path**: T1 (Diagnóstico estado servicios) → T2 (Verificar WebSocket rift-next) → T5 (Identificar causa raíz) → T8 (Implementar fix) → F1-F4 (Verificación final)

## Context
### Original Request
El usuario reporta que web-next no conecta a rift-next ni conduit-next, sin logs ni errores visibles.

### Interview Summary
- Usuario no especificó entorno de prueba (localhost vs LAN/móvil)
- No hay logs aparentes según el usuario, pero investigación encontró log `mobile_connect_no_conduit` en rift-next
- Los servicios rift-next y web-next sí están corriendo; conduit-next NO está ejecutándose

### Metis Review (gaps addressed)
- **Riesgo identificado**: Diagnóstico incorrecto por capas mezcladas. El plan separa explícitamente: web UI → browser WS → rift /mobile → rift conduit registry → conduit /conduit
- **Scope creep protegido**: No modificar criptografía (RSA/AES) a menos que transport + conduit registration pasen primero
- **Guardrail**: No agregar retries/reconexión genéricos antes de conocer el modo de falla exacto
- **LAN vs localhost**: El plan incluye verificación de ambos escenarios
- **UX silencioso**: Incluir mejora de diagnósticos cuando no hay conduit conectado

## Work Objectives
### Core Objective
Restablecer el flujo completo de conexión web-next → rift-next → conduit-next y asegurar que los errores sean visibles tanto en logs como en UI.

### Deliverables
1. Reporte de diagnóstico por capas con evidencia
2. Corrección de la causa raíz de conectividad
3. Mejora de logs y mensajes de error en web-next cuando no hay conduit
4. Suite de pruebas automatizadas de conectividad (happy path + failure paths)

### Definition of Done
- [ ] `curl http://localhost:51001/health/protocol` responde `{"riftOpcodesLoaded":true}`
- [ ] WebSocket a `ws://localhost:51001/mobile` con código válido no da timeout silencioso
- [ ] Si no hay conduit, web-next muestra mensaje claro (no error genérico)
- [ ] Si conduit está presente, el handshake completo web ↔ rift ↔ conduit funciona
- [ ] Playwright captura evidencia de conexión exitosa y fallida
- [ ] `bun test` pasa en apps/rift-next y apps/web-next

### Must Have
- Diagnóstico completo por capas
- Fix de la causa raíz confirmada
- Logs/errores visibles para todos los casos de fallo
- Pruebas automatizadas

### Must NOT Have
- Modificación del protocolo de cifrado (a menos que se confirme como causa)
- Reescritura del sistema de reconexión
- Cambios en la arquitectura general
- Dependencia de servicios externos

## Verification Strategy
- **Test decision**: Tests-after + framework existente (Bun nativo en rift-next, Playwright para UI)
- **QA policy**: Cada tarea tiene escenarios ejecutados por agente
- **Evidence**: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves

**Wave 1: Diagnóstico por Capas (paralelo)**
- T1: Estado de servicios y logs
- T2: Prueba WebSocket directa a rift-next
- T3: Verificar configuración de URLs y hosts
- T4: Capturar errores de browser con Playwright

**Wave 2: Análisis e Identificación de Causa (depende de Wave 1)**
- T5: Analizar hallazgos y determinar causa raíz
- T6: Verificar estado de conduit-next y capacidad de ejecución

**Wave 3: Corrección e Implementación (depende de Wave 2)**
- T7: Fix de configuración/URL/host si es necesario
- T8: Fix de handshake/WS si es necesario
- T9: Mejora de UX y logs cuando no hay conduit

**Wave 4: Verificación Final (después de T7-T9)**
- F1-F4: Auditorías paralelas

### Dependency Matrix
| Task | Depends On | Blocks |
|------|-----------|--------|
| T1 | — | T5 |
| T2 | — | T5 |
| T3 | — | T5 |
| T4 | — | T5 |
| T5 | T1-T4 | T6-T9 |
| T6 | T5 | T7-T9 |
| T7 | T5-T6 | F1-F4 |
| T8 | T5-T6 | F1-F4 |
| T9 | T5-T6 | F1-F4 |
| F1-F4 | T7-T9 | — |

### Agent Dispatch Summary
| Wave | Tasks | Categorías |
|------|-------|-----------|
| W1 | T1-T4 | quick, deep |
| W2 | T5-T6 | deep, unspecified-high |
| W3 | T7-T9 | quick, deep |
| W4 | F1-F4 | oracle, unspecified-high |

## TODOs

- [x] 1. Estado de Servicios y Recolección de Logs

  **What to do**: Verificar el estado actual de todos los servicios (rift-next, web-next, conduit-next). Recolectar logs existentes de rift-next y verificar si hay logs de conduit-next. Documentar timestamps y correlación.
  **Must NOT do**: Reiniciar servicios aún; solo observar estado actual.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: tarea de recolección de información
  - Skills: [] - No skills especiales requeridas
  - Omitted: [`playwright`] - No se necesita browser aún

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T5 | Blocked By: —

  **References**:
  - Estado de procesos: `ps aux | grep -E "(bun|node|vite|cargo|conduit)"`
  - Logs rift-next: `apps/rift-next/src/core/logger/logger-utils.ts`
  - Logs conduit-next: buscar en `~/.local/share/Mimic/logs/` o directorio de datos de Tauri
  - Puerto rift-next: `ss -tlnp | grep 51001`

  **Acceptance Criteria**:
  - [ ] Confirmar si rift-next está corriendo y en qué puerto
  - [ ] Confirmar si web-next está corriendo y en qué puerto
  - [ ] Confirmar si conduit-next está corriendo (proceso Tauri/Cargo)
  - [ ] Recolectar últimos 100 líneas de logs de rift-next
  - [ ] Buscar logs de conduit-next en directorios estándar
  - [ ] Documentar si hay múltiples intentos de conexión en logs

  **QA Scenarios**:
  ```
  Scenario: Verificar estado de rift-next
    Tool: Bash
    Steps: curl -s http://localhost:51001/health/protocol
    Expected: {"riftOpcodesLoaded":true}
    Evidence: .sisyphus/evidence/task-1-rift-health.json

  Scenario: Verificar puertos abiertos
    Tool: Bash
    Steps: ss -tlnp | grep -E "51001|5173"
    Expected: Ambos puertos en estado LISTEN
    Evidence: .sisyphus/evidence/task-1-ports.log
  ```

  **Commit**: NO

- [x] 2. Prueba Directa de WebSocket a rift-next

  **What to do**: Probar la conexión WebSocket a `/mobile` y `/conduit` usando herramientas de línea de comandos. Simular un cliente móvil enviando un código y capturar la respuesta exacta del servidor.
  **Must NOT do**: Depender del browser; esta es prueba de transporte puro.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: prueba de conectividad de red
  - Skills: [] - No skills especiales
  - Omitted: [`playwright`] - Prueba de red pura

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T5 | Blocked By: —

  **References**:
  - Protocolo: `apps/rift-next/src/core/realtime/realtime.ts`
  - Frame parser: `apps/rift-next/src/core/realtime/realtime-utils.ts`
  - Códigos de operación: `packages/protocol-contract/src/index.ts`

  **Acceptance Criteria**:
  - [ ] Conectar WS a `ws://localhost:51001/mobile` y enviar `[0, "TEST12"]`
  - [ ] Capturar respuesta exacta del servidor
  - [ ] Verificar si la conexión se cierra inmediatamente o persiste
  - [ ] Probar WS a `ws://localhost:51001/conduit` sin auth
  - [ ] Documentar comportamiento de cada endpoint

  **QA Scenarios**:
  ```
  Scenario: WebSocket /mobile sin código válido
    Tool: Bash (script con websocat o similar)
    Steps: echo '[4, "TEST12"]' | websocat ws://localhost:51001/mobile
    Expected: Recibir frame [5, null] (CONNECT_PUBKEY sin conduit) o conexión cerrada
    Evidence: .sisyphus/evidence/task-2-ws-mobile.log

  Scenario: WebSocket /conduit sin auth
    Tool: Bash
    Steps: websocat ws://localhost:51001/conduit
    Expected: Conexión cerrada por servidor (401/403 equivalente en WS)
    Evidence: .sisyphus/evidence/task-2-ws-conduit.log
  ```

  **Commit**: NO

- [x] 3. Verificar Configuración de URLs y Hosts

  **What to do**: Revisar todas las configuraciones de URL en web-next, rift-next, y conduit-next. Verificar si las variables de entorno están definidas. Probar conexión desde diferentes hosts (localhost, 127.0.0.1, LAN IP). Verificar si Vite proxy o allowedHosts afectan.
  **Must NOT do**: Modificar configuraciones aún; solo auditar.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: auditoría de configuración
  - Skills: [] - No skills especiales
  - Omitted: [`playwright`] - No se necesita browser

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T5 | Blocked By: —

  **References**:
  - web-next URLs: `apps/web-next/src/core/rift/rift-client.ts:66-81` (resolveMobileWsBaseUrl)
  - web-next HTTP: `apps/web-next/src/core/http/http-client.ts:24-29` (resolveHttpBaseUrl)
  - rift-next config: `apps/rift-next/src/core/config/env-config.ts:35-37` (HOSTNAME default 0.0.0.0)
  - vite config: `apps/web-next/vite.config.ts:14-18` (host: 0.0.0.0, allowedHosts: true)
  - conduit URLs: `apps/conduit-next/src-tauri/src/manager.rs:27-28` (DEFAULT_HUB_HTTP_URL, DEFAULT_HUB_WS_URL)

  **Acceptance Criteria**:
  - [ ] Verificar si `VITE_RIFT_WS_BASE_URL` o `VITE_RIFT_HTTP_BASE_URL` están definidos
  - [ ] Probar `curl` desde 127.0.0.1 y desde la IP LAN
  - [ ] Verificar si `allowedHosts: true` en Vite permite conexiones externas
  - [ ] Documentar todas las URLs que cada componente usa
  - [ ] Identificar si hay mismatch de host (localhost vs 127.0.0.1 vs IP LAN)

  **QA Scenarios**:
  ```
  Scenario: Verificar variables de entorno
    Tool: Bash
    Steps: env | grep -E "VITE_RIFT|RIFT_HUB"
    Expected: Documentar cuáles están definidas y cuáles no
    Evidence: .sisyphus/evidence/task-3-env.log

  Scenario: Conectividad desde diferentes hosts
    Tool: Bash
    Steps: curl -s http://127.0.0.1:51001/ && curl -s http://$(hostname -I | awk '{print $1}'):51001/
    Expected: Ambos devuelven respuesta de rift-next
    Evidence: .sisyphus/evidence/task-3-hosts.log
  ```

  **Commit**: NO

- [x] 4. Capturar Errores de Browser con Playwright

  **What to do**: Abrir web-next en browser headless con Playwright, intentar conectar con un código de prueba, y capturar console logs, network requests, y WebSocket events. Verificar si hay errores de CORS, WS, o JavaScript.
  **Must NOT do**: Depender de que el usuario vea errores; automatizar la captura.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: requiere browser automation
  - Skills: [`agent-browser`] - Necesario para Playwright
  - Omitted: [] - Todas las skills relevantes incluidas

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: T5 | Blocked By: —

  **References**:
  - Connect screen: `apps/web-next/src/features/connect/components/connect-screen.tsx`
  - Connection flow: `apps/web-next/src/features/connect/hooks/use-connection-flow.ts`
  - Rift client: `apps/web-next/src/core/rift/rift-client.ts`
  - Playwright config: `apps/web-next/playwright.config.ts`

  **Acceptance Criteria**:
  - [ ] Navegar a `http://localhost:5173`
  - [ ] Capturar console logs antes de interactuar
  - [ ] Ingresar código "123456" y hacer click en Connect
  - [ ] Esperar 5 segundos y capturar console logs, network requests, WS frames
  - [ ] Capturar screenshot del estado final
  - [ ] Documentar cualquier error visible

  **QA Scenarios**:
  ```
  Scenario: Capturar errores de browser al conectar
    Tool: Playwright
    Steps:
      1. page.goto('http://localhost:5173')
      2. page.on('console', msg => log msg)
      3. page.on('websocket', ws => log ws.url())
      4. page.fill('#code-input', '123456')
      5. page.click('button:has-text("Connect")')
      6. page.wait_for_timeout(5000)
      7. screenshot
    Expected: Tener logs de console, WS events, y screenshot
    Evidence: .sisyphus/evidence/task-4-browser-logs.json, task-4-screenshot.png

  Scenario: Verificar WebSocket frames en browser
    Tool: Playwright
    Steps: Capturar ws.on('framesent') y ws.on('framereceived')
    Expected: Ver frames JSON enviados y recibidos
    Evidence: .sisyphus/evidence/task-4-ws-frames.json
  ```

  **Commit**: NO

- [x] 5. Analizar Hallazgos y Determinar Causa Raíz

  **What to do**: Consolidar evidencia de T1-T4, identificar la causa raíz exacta de la falla de conectividad, y decidir el plan de corrección. Documentar hipótesis validadas vs descartadas.
  **Must NOT do**: Asumir causa sin evidencia; cada conclusión debe citar datos de T1-T4.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: análisis y síntesis compleja
  - Skills: [] - Análisis puro
  - Omitted: [`playwright`] - No se necesita browser

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T6-T9 | Blocked By: T1-T4

  **References**:
  - Evidencia de T1-T4 en `.sisyphus/evidence/`
  - Código de rift realtime: `apps/rift-next/src/core/realtime/realtime.ts:190-230` (handleMobileMessage)
  - Código de conexión web: `apps/web-next/src/core/rift/rift-client.ts:274-290` (connect)

  **Acceptance Criteria**:
  - [ ] Documentar hipótesis inicial: ¿falta conduit, problema de red, o bug de código?
  - [ ] Citar evidencia específica que confirma o descarta cada hipótesis
  - [ ] Identificar la causa raíz con 100% de confianza
  - [ ] Definir el fix mínimo necesario
  - [ ] Identificar si hay múltiples causas simultáneas

  **QA Scenarios**:
  ```
  Scenario: Reporte de diagnóstico completo
    Tool: Bash (generar markdown)
    Steps: Consolidar todos los .json/.log en reporte estructurado
    Expected: Documento con causa raíz confirmada y fix recomendado
    Evidence: .sisyphus/evidence/task-5-diagnosis-report.md
  ```

  **Commit**: NO

- [x] 6. Verificar Estado de conduit-next y Capacidad de Ejecución

  **What to do**: Determinar si conduit-next puede ejecutarse en el entorno actual. Verificar si Rust/Cargo está instalado, si el proyecto compila, y si se necesita el League Client abierto. Si no es posible ejecutar conduit-next, proponer un mock/test harness.
  **Must NOT do**: Asumir que conduit-next debe correr; evaluar factibilidad técnica.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: evaluación técnica compleja
  - Skills: [] - No skills especiales
  - Omitted: [`playwright`] - No se necesita browser

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: T7-T9 | Blocked By: T5

  **References**:
  - Cargo.toml: `apps/conduit-next/src-tauri/Cargo.toml`
  - Manager: `apps/conduit-next/src-tauri/src/manager.rs`
  - Main: `apps/conduit-next/src-tauri/src/main.rs`

  **Acceptance Criteria**:
  - [ ] Verificar si `cargo` está instalado (`cargo --version`)
  - [ ] Verificar si `rustc` está instalado
  - [ ] Intentar `cargo check` en `apps/conduit-next/src-tauri`
  - [ ] Documentar si se necesita League Client para probar
  - [ ] Si no compila, documentar errores de compilación
  - [ ] Proponer alternativa: mock de conduit o ambiente de test

  **QA Scenarios**:
  ```
  Scenario: Verificar toolchain de Rust
    Tool: Bash
    Steps: cargo --version && rustc --version
    Expected: Versiones instaladas o error claro
    Evidence: .sisyphus/evidence/task-6-rust-toolchain.log

  Scenario: Check de compilación de conduit-next
    Tool: Bash
    Steps: cd apps/conduit-next/src-tauri && cargo check 2>&1
    Expected: Éxito o lista de errores de compilación
    Evidence: .sisyphus/evidence/task-6-cargo-check.log
  ```

  **Commit**: NO

- [x] 7. Fix de Configuración/URL/Host (N/A — URLs correctas)

  **What to do**: Si T3/T5 identificó un problema de URL/host (mismatch de localhost vs IP, CORS, allowedHosts), implementar el fix. Esto puede incluir: agregar `.env` para web-next, modificar vite.config.ts proxy, o agregar variable de entorno para rift-next.
  **Must NOT do**: Hardcodear URLs; usar mecanismos de configuración existentes.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: cambios de configuración simples
  - Skills: [] - No skills especiales
  - Omitted: [`playwright`] - Tests se hacen en T9

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: F1-F4 | Blocked By: T5-T6

  **References**:
  - web-next env: `apps/web-next/src/core/rift/rift-client.ts:66-81`
  - web-next http: `apps/web-next/src/core/http/http-client.ts:24-29`
  - vite config: `apps/web-next/vite.config.ts:14-18`
  - rift env: `apps/rift-next/src/core/config/env-config.ts`

  **Acceptance Criteria**:
  - [ ] Si el problema es LAN vs localhost: agregar `.env.example` con opciones
  - [ ] Si el problema es CORS: verificar que rift-next responde correctamente
  - [ ] Si el problema es allowedHosts: documentar configuración necesaria
  - [ ] Verificar que `curl` funciona desde todos los hosts relevantes

  **QA Scenarios**:
  ```
  Scenario: Verificar fix de URL
    Tool: Bash
    Steps: curl -s http://<host-corregido>:51001/health/protocol
    Expected: {"riftOpcodesLoaded":true} desde todos los hosts
    Evidence: .sisyphus/evidence/task-7-url-fix.log
  ```

  **Commit**: YES | Message: `fix(config): correct rift connection URLs for dev environment` | Files: depende del fix específico

- [x] 8. Fix de Handshake/WebSocket (N/A — WS funciona correctamente)

  **What to do**: Si T2/T5 identificó un problema en el handshake WebSocket (frames incorrectos, cierre prematuro, opcode mismatch), implementar el fix en el código de rift-next o web-next. Limitado a transporte y protocolo de framing, NO criptografía.
  **Must NOT do**: Modificar RSA-OAEP, AES-CBC, o generación de claves.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: debug de protocolo WebSocket
  - Skills: [] - No skills especiales
  - Omitted: [`playwright`] - Tests se hacen en T9

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: F1-F4 | Blocked By: T5-T6

  **References**:
  - rift realtime: `apps/rift-next/src/core/realtime/realtime.ts`
  - rift frame utils: `apps/rift-next/src/core/realtime/realtime-utils.ts`
  - web rift client: `apps/web-next/src/core/rift/rift-client.ts`
  - protocol contract: `packages/protocol-contract/src/index.ts`

  **Acceptance Criteria**:
  - [ ] WebSocket /mobile acepta conexión sin cerrar inmediatamente
  - [ ] Frames JSON parsean correctamente en ambos lados
  - [ ] Secuencia CONNECT → CONNECT_PUBKEY → SEND funciona
  - [ ] No hay errores de "opcode inválido" en logs

  **QA Scenarios**:
  ```
  Scenario: Handshake completo con mock
    Tool: Bash (script WebSocket)
    Steps:
      1. Conectar a ws://localhost:51001/mobile
      2. Enviar [4, "CODIGO"]
      3. Esperar respuesta
    Expected: Recibir [5, <pubkey>] o [5, null] (no timeout). Opcode 5 = CONNECT_PUBKEY.
    Evidence: .sisyphus/evidence/task-8-handshake.log
  ```

  **Commit**: YES | Message: `fix(rift): WebSocket handshake frame handling` | Files: depende del fix

- [x] 9. Mejora de UX y Logs cuando no hay Conduit

  **What to do**: Si el diagnóstico confirma que el problema es "no hay conduit conectado", mejorar la experiencia: (1) agregar log/debug en web-next cuando recibe CONNECT_PUBKEY con null, (2) mejorar mensaje de error en UI para que no sea silencioso, (3) documentar en UI que se necesita conduit-next corriendo.
  **Must NOT do**: Agregar polling o reconexión automática; solo mejorar diagnósticos.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: cambios UI/UX limitados
  - Skills: [`react-patterns`] - Mejora de componentes React
  - Omitted: [`playwright`] - Tests se hacen en T9

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: F1-F4 | Blocked By: T5-T6

  **References**:
  - rift client: `apps/web-next/src/core/rift/rift-client.ts:489-504` (handleSecretResponse)
  - connection flow: `apps/web-next/src/features/connect/hooks/use-connection-flow.ts:52-69`
  - connect screen: `apps/web-next/src/features/connect/components/connect-screen.tsx`
  - i18n: `apps/web-next/src/i18n/translations/en.ts`, `es.ts`

  **Acceptance Criteria**:
  - [ ] Cuando rift responde CONNECT_PUBKEY=null, web-next loguea en consola
  - [ ] UI muestra mensaje claro: "No desktop client connected. Please open Mimic Conduit."
  - [ ] Mensaje traducido en en/es (o al menos en en)
  - [ ] No hay error silencioso; siempre hay feedback visual

  **QA Scenarios**:
  ```
  Scenario: UI muestra error cuando no hay conduit
    Tool: Playwright
    Steps:
      1. Abrir web-next
      2. Ingresar código válido pero sin conduit
      3. Click Connect
      4. Esperar 3 segundos
      5. Screenshot
    Expected: UI muestra mensaje "No desktop client connected" o similar
    Evidence: .sisyphus/evidence/task-9-no-conduit-ui.png

  Scenario: Logs de browser capturan el evento
    Tool: Playwright
    Steps: page.on('console', ...) durante conexión
    Expected: Log con mensaje claro sobre CONNECT_PUBKEY=null
    Evidence: .sisyphus/evidence/task-9-browser-logs.json
  ```

  **Commit**: YES | Message: `feat(connect): improve UX when no conduit is connected` | Files: `apps/web-next/src/core/rift/rift-client.ts`, `apps/web-next/src/features/connect/`, `apps/web-next/src/i18n/`

## Final Verification Wave

- [x] F1. Plan Compliance Audit

  **What to do**: Verificar que todas las tareas del plan fueron ejecutadas, que los acceptance criteria se cumplen, y que no hay código sin justificar.
  **Must NOT do**: Revisar calidad de código; solo cumplimiento del plan.

  **Recommended Agent Profile**:
  - Category: `oracle` - Reason: verificación lógica y coherencia
  - Skills: []
  - Omitted: [`playwright`] - No browser needed

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: T7-T9

  **References**:
  - Plan: `.sisyphus/plans/mimic-connectivity-fix.md`
  - Evidence: `.sisyphus/evidence/`

  **Acceptance Criteria**:
  - [ ] Todas las tareas T1-T9 tienen evidence generada
  - [ ] Todos los fixes de código están documentados en commits
  - [ ] No hay código modificado fuera del scope definido

  **QA Scenarios**:
  ```
  Scenario: Verificar completitud de evidencia
    Tool: Bash
    Steps: ls .sisyphus/evidence/task-* | wc -l
    Expected: ≥ 9 archivos de evidence (uno por tarea T1-T9)
    Evidence: .sisyphus/evidence/f1-compliance.log

  Scenario: Verificar scope
    Tool: Bash
    Steps: git diff --name-only | grep -vE "(apps/web-next|apps/rift-next|packages/protocol-contract)"
    Expected: Lista vacía o solo archivos de config/docs permitidos
    Evidence: .sisyphus/evidence/f1-scope.log
  ```

  **Commit**: NO

- [x] F2. Code Quality Review

  **What to do**: Revisar que el código modificado pasa lint, formato, y no introduce anti-patterns. Verificar TypeScript strict y react-doctor score.
  **Must NOT do**: Cambiar funcionalidad; solo reportar issues.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: revisión exhaustiva de calidad
  - Skills: []
  - Omitted: [`playwright`] - No browser needed

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: T7-T9

  **References**:
  - Lint: `bun run lint`
  - Format: `bun run fmt:check`
  - React Doctor: `bun run doctor:react:check`
  - Oxlint config: `oxlint.config.ts`

  **Acceptance Criteria**:
  - [ ] `bun run lint` pasa sin errores
  - [ ] `bun run fmt:check` pasa sin errores
  - [ ] `bun run doctor:react:check` pasa (score ≥ 75)
  - [ ] No hay `any` explícito en código nuevo
  - [ ] No hay console.log sin justificar

  **QA Scenarios**:
  ```
  Scenario: Lint y formato pasan
    Tool: Bash
    Steps: bun run lint && bun run fmt:check
    Expected: Exit code 0
    Evidence: .sisyphus/evidence/f2-lint.log

  Scenario: React Doctor score válido
    Tool: Bash
    Steps: bun run doctor:react:check
    Expected: Score ≥ 75 para web-next y conduit-next
    Evidence: .sisyphus/evidence/f2-doctor.log
  ```

  **Commit**: NO

- [x] F3. Real Manual QA

  **What to do**: Ejecutar Playwright para capturar evidencia visual de éxito y fallo. Verificar que la UI responde correctamente en ambos casos.
  **Must NOT do**: Depender de intervención humana; todo automatizado.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: QA automatizado con browser
  - Skills: [`agent-browser`] - Playwright para captura visual
  - Omitted: []

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: T7-T9

  **References**:
  - Playwright config: `apps/web-next/playwright.config.ts`
  - Connect screen: `apps/web-next/src/features/connect/components/connect-screen.tsx`

  **Acceptance Criteria**:
  - [ ] Playwright abre web-next y toma screenshot del estado inicial
  - [ ] Playwright simula conexión fallida (sin conduit) y captura screenshot con mensaje de error visible
  - [ ] Playwright captura console logs del browser
  - [ ] No hay errores de JavaScript no manejados en console

  **QA Scenarios**:
  ```
  Scenario: QA visual de conexión fallida
    Tool: Playwright
    Steps:
      1. page.goto('http://localhost:5173')
      2. page.fill('#code-input', '123456')
      3. page.click('button:has-text("Connect")')
      4. page.wait_for_timeout(3000)
      5. screenshot
      6. capture console logs
    Expected: Screenshot muestra mensaje de error claro. Console logs sin excepciones.
    Evidence: .sisyphus/evidence/f3-qa-fail.png, f3-qa-fail-console.json

  Scenario: QA visual de estado inicial
    Tool: Playwright
    Steps: page.goto('http://localhost:5173'), screenshot
    Expected: UI carga sin errores de JS. Input de código visible.
    Evidence: .sisyphus/evidence/f3-qa-initial.png
  ```

  **Commit**: NO

- [x] F4. Scope Fidelity Check

  **What to do**: Verificar que el fix realmente resuelve el problema original (web-next no conecta) y no introdujo regressions. Confirmar que los tests existentes siguen pasando.
  **Must NOT do**: Agregar nueva funcionalidad; solo validar fix.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: validación profunda de solución
  - Skills: []
  - Omitted: [`playwright`] - No browser needed

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: — | Blocked By: T7-T9

  **References**:
  - Tests rift-next: `apps/rift-next/tests/`
  - Tests web-next: `apps/web-next/src/**/tests/`
  - Test command: `bun run test`

  **Acceptance Criteria**:
  - [ ] `bun run test` pasa en apps/rift-next
  - [ ] `bun run test` pasa en apps/web-next
  - [ ] Tests existentes de conectividad no fueron rotos
  - [ ] El problema original (conexión silenciosa/fallida) está resuelto

  **QA Scenarios**:
  ```
  Scenario: Tests existentes pasan
    Tool: Bash
    Steps: bun run --filter @mimic/rift-next test && bun run --filter @mimic/web-next test
    Expected: Todos los tests pasan
    Evidence: .sisyphus/evidence/f4-tests.log

  Scenario: Verificar fix del problema original
    Tool: Bash
    Steps: curl -s http://localhost:51001/health/protocol && echo '[4, "TEST99"]' | websocat ws://localhost:51001/mobile
    Expected: HTTP OK + WS recibe respuesta (no timeout silencioso)
    Evidence: .sisyphus/evidence/f4-fix-verification.log
  ```

  **Commit**: NO

## Commit Strategy
- Commits atómicos por tarea de implementación (T7, T8, T9)
- No commit para tareas de diagnóstico (T1-T6)
- Mensajes en formato `type(scope): description`
- Archivos de evidence en `.sisyphus/evidence/` (no trackeados por git)

## Success Criteria
- [ ] web-next puede conectar WebSocket a rift-next sin timeout silencioso
- [ ] Si no hay conduit, el usuario recibe mensaje claro en UI
- [ ] Si hay conduit, el handshake completo funciona
- [ ] Todos los tests existentes pasan (`bun test`)
- [ ] Playwright captura evidencia de éxito y fallo
- [ ] No hay regression en funcionalidad existente

Vamos a hacer una refactorización grande de este código. El objetivo es mejorar mantenibilidad, legibilidad, tipado, separación de responsabilidades, consistencia del estilo y capacidad de evolución del proyecto sin cambiar el comportamiento funcional existente.

No quiero una limpieza superficial. Quiero una refactorización real, estructural y segura.

El criterio de éxito no es solamente que compile. El criterio es que el código quede más mantenible, más tipado, mejor separado, más fácil de leer, correctamente testeado, documentado y respaldado por reglas automatizadas cuando sea posible.

Antes de modificar código, analiza la estructura actual, identifica los problemas principales y propón un plan breve de refactorización. Después implementa los cambios por partes, manteniendo el proyecto funcional en cada etapa.

---

## Principios generales

1. No cambiar comportamiento funcional salvo que sea claramente un bug.
2. No introducir dependencias nuevas sin justificarlo.
3. No esconder problemas con casts, mocks, silenciamiento de errores o configuraciones laxas.
4. No hacer refactors gigantes en una sola masa si se pueden dividir por módulos, carpetas o componentes.
5. No eliminar código sin verificar que no se usa.
6. No dejar reglas importantes como conocimiento implícito.
7. No depender de criterio manual cuando una regla pueda automatizarse con linting, TypeScript, Vitest u otra configuración existente.
8. Si aparece un conflicto entre reglas, detente y explica el conflicto antes de continuar.
9. Si una regla no puede cumplirse, no la ignores: justifica el motivo y propone alternativas.
10. Si una solución requiere saltarse una regla, detente y explícame por qué antes de implementarla.

---

## Objetivos principales

1. Separar responsabilidades por archivo.
2. Dejar un único componente por archivo.
3. Extraer estilos fuera de la capa de renderización.
4. Mejorar el tipado y eliminar patrones inseguros.
5. Reducir complejidad visual del JSX.
6. Usar correctamente las librerías existentes del proyecto.
7. Mantener o mejorar la cobertura de tests.
8. Evitar hacks, soluciones frágiles o cambios innecesarios de comportamiento.
9. Documentar las reglas y decisiones del proyecto.
10. Automatizar con linters y configuración todas las reglas que sea razonable automatizar.

---

## Flujo de trabajo esperado

Sigue este proceso:

1. Analiza el código actual.
2. Identifica:
   - componentes mezclados
   - múltiples componentes en un mismo archivo
   - tipos inline
   - utilidades locales mezcladas con render
   - estilos dentro del JSX
   - ternarios anidados
   - assertions de tipo
   - `any`
   - `unknown` innecesario
   - magic strings
   - imports inconsistentes
   - lógica pesada dentro del render
   - hooks o efectos innecesarios
   - posibles usos incorrectos de librerías
   - tests frágiles, ausentes o demasiado acoplados a implementación
   - documentación faltante o desactualizada
   - reglas que podrían automatizarse con tooling
3. Propón un plan breve de refactorización.
4. Implementa por módulos, carpetas o componentes.
5. Después de cada cambio relevante:
   - verifica tipado
   - verifica lint
   - verifica tests
   - verifica que las reglas nuevas estén cubiertas por tooling cuando sea posible
   - actualiza la documentación correspondiente si cambiaste una convención, estructura o decisión técnica
6. Antes de finalizar:
   - ejecuta o deja preparados los comandos reales del proyecto para validar typecheck, lint, tests, build y format check si aplica
   - entrega un resumen claro de cambios, decisiones y reglas automatizadas

---

## Separación de archivos

Aplica estas reglas de estructura:

1. Cada archivo debe tener una responsabilidad clara.
2. Solo debe existir un componente React por archivo.
3. No declarar componentes auxiliares dentro del mismo archivo del componente principal.
4. Extraer componentes auxiliares a su propio archivo.
5. Si un archivo contiene tipos, extraerlos a un archivo separado con sufijo `-types`.
6. Si un archivo contiene utilidades que solo se usan dentro de ese módulo o carpeta, extraerlas a un archivo con sufijo `-utils`.
7. Si el archivo contiene estilos, variantes visuales o clases Tailwind complejas, extraerlas a un archivo con sufijo `-styles`.
8. Los tests pueden vivir dentro de la misma carpeta usando sufijo `-test`, salvo en rutas si eso interfiere con la estructura esperada del routing.
9. No crear archivos genéricos como `utils.ts`, `types.ts` o `styles.ts` cuando el contexto específico del módulo sea más claro.

Ejemplo de intención:

```txt
user-card.tsx
user-card-types.ts
user-card-styles.ts
user-card-utils.ts
user-card-test.tsx
```

---

## Estilos

Extrae los estilos de la capa de renderización.

1. No dejar strings largos de clases Tailwind directamente dentro del JSX.
2. Crear archivos `-styles` para variantes visuales.
3. Usar `tailwind-variants`.
4. Usar `slots` cuando el componente tenga varias partes visuales.
5. El componente debe consumir los estilos de forma limpia desde el archivo `-styles`.
6. Los estilos deben estar tipados cuando corresponda.
7. Las variantes visuales deben usar nombres claros y consistentes.
8. No duplicar clases complejas entre componentes.
9. No convertir estilos en abstracciones globales si solo aplican localmente al componente.
10. Si no conoces bien `tailwind-variants` o su sistema de `slots`, revisa la documentación antes de implementar.

Ejemplo de intención:

```txt
button.tsx          -> renderiza el componente
button-types.ts    -> contiene tipos del componente
button-styles.ts   -> contiene variantes y slots
button-utils.ts    -> contiene helpers locales si son necesarios
button-test.tsx    -> contiene tests del componente
```

---

## Reglas estrictas de TypeScript

### Type assertions

Está prohibido usar aserciones de tipo.

No usar:

```ts
;(value as SomeType) < SomeType > value
```

Busca alternativas reales:

1. narrowing
2. type guards
3. validación con schemas
4. tipos derivados
5. overloads
6. discriminated unions
7. refactors de modelado
8. validación con `valibot` cuando aplique

Si de verdad no hay una alternativa razonable, detente y explícame el motivo antes de continuar.

---

### `any` y `unknown`

1. Todo debe estar tipado.
2. No usar `any`.
3. Evitar `unknown` dentro de lo posible.
4. Si se usa `unknown`, debe existir narrowing claro y seguro.
5. No usar `unknown` como forma de evitar modelar correctamente los datos.
6. No debilitar tipos para hacer pasar errores.

---

### Props y parámetros

Para props y parámetros complejos, declarar el tipo por fuera.

Preferido:

```ts
type UserCardProps = {
  name: string
  age: number
}

function UserCard(props: UserCardProps) {
  return null
}
```

Evitar:

```ts
function UserCard({ name, age }: { name: string; age: number }) {
  return null
}
```

Reglas:

1. Usar `props: ComponentNameProps`.
2. Declarar el tipado fuera del parámetro.
3. Evitar tipos inline complejos.
4. Desestructurar dentro del cuerpo si mejora legibilidad.
5. Mantener nombres consistentes: `ComponentNameProps`, `ComponentNameState`, `ComponentNameVariant`, etc.

---

## Imports

Reglas obligatorias:

1. Importar tipos usando `import type`.
2. Separar imports normales e imports de tipos.
3. Los imports de tipos deben ir después de los imports normales.
4. Usar un solo tipo por import.
5. No usar `import("...").Type`.
6. Evitar imports duplicados.
7. Eliminar imports no usados.
8. Mantener orden consistente de imports.

Ejemplo:

```ts
import { useMemo } from 'react'

import type { User } from './user-types'
import type { UserStatus } from './user-status-types'
```

No hacer:

```ts
import type { User, UserStatus } from './user-types'

type Item = import('./item-types').Item
```

---

## Funciones

Reglas obligatorias:

1. Siempre que sea posible, usar funciones normales por sobre arrow functions.
2. Todas las arrow functions deben tener curly braces.
3. No usar arrow functions con retorno implícito.
4. No hacer returns sin curly braces en condicionales.
5. Para funciones asíncronas que se ejecutan intencionalmente sin esperar su resultado, usar `void`.

Preferido:

```ts
function getUserName(user: User) {
  return user.name
}
```

Evitar cuando no sea necesario:

```ts
const getUserName = (user: User) => {
  return user.name
}
```

Prohibido:

```ts
const getName = () => user.name
```

Permitido:

```ts
const getName = () => {
  return user.name
}
```

Prohibido:

```ts
if (!user) return null
```

Permitido:

```ts
if (!user) {
  return null
}
```

Para operaciones async intencionalmente no esperadas:

```ts
void refetchUser()
```

---

## Condicionales

1. Está prohibido el anidamiento de operadores ternarios.
2. Los ternarios simples están permitidos solo si mejoran la legibilidad.
3. Reemplazar ternarios anidados por soluciones más claras.

Alternativas válidas:

1. `if / else if / else`
2. funciones auxiliares con `return`
3. mapas tipados
4. early returns con bloques
5. discriminated unions
6. helpers de render
7. componentes separados

Prohibido:

```tsx
const label = isLoading ? 'Loading' : error ? 'Error' : 'Ready'
```

Preferido:

```ts
function getStatusLabel(status: Status) {
  if (status === 'loading') {
    return 'Loading'
  }

  if (status === 'error') {
    return 'Error'
  }

  return 'Ready'
}
```

---

## Magic strings y constantes

1. No usar magic strings con significado funcional.
2. Extraer valores repetidos, estados, claves, rutas, mensajes, acciones o variantes a constantes tipadas.
3. Usar objetos `const`, unions, mapas tipados o enums si el proyecto ya los usa.
4. No introducir abstracciones innecesarias para strings triviales que solo aparecen una vez y son puramente texto de UI.
5. Sí extraer strings que tengan significado de dominio, estado, ruta, key, evento, query key, storage key, action o comportamiento.

Ejemplos de strings que deben extraerse:

```ts
'admin'
'pending'
'/dashboard'
'user-id'
'local-storage-key'
'user.updated'
'primary'
```

Ejemplo de intención:

```ts
const USER_ROLES = {
  admin: 'admin',
  editor: 'editor',
  viewer: 'viewer',
} as const
```

Nota: si esta regla entra en conflicto con la prohibición de type assertions, no uses `as const` automáticamente sin evaluar alternativas. Si el proyecto necesita `as const` para modelar constantes literales, revisa si la regla de assertions permite este caso concreto o si hay que resolverlo de otra forma. Si hay conflicto, detente y explícame el problema.

---

## JSX

1. Separar bloques de JSX con líneas en blanco para mejorar legibilidad.
2. Extraer bloques complejos a componentes separados.
3. Extraer lógica compleja fuera del render.
4. Evitar cálculos grandes directamente dentro del JSX.
5. Evitar handlers inline complejos.
6. Evitar JSX profundamente anidado cuando pueda dividirse.
7. No mezclar render, estilos, validación, transformación de datos y side effects en el mismo bloque.
8. Si hay reglas de lint que puedan reforzar separación visual de bloques JSX, configurarlas o respetarlas.

Ejemplo de intención:

```tsx
return (
  <section>
    <Header />

    <Content />

    <Footer />
  </section>
)
```

---

## Separación visual de statements

1. Separar bloques de variables, condicionales, efectos, funciones internas y returns con líneas en blanco.
2. No juntar declaraciones no relacionadas.
3. Agrupar statements por intención.
4. Mantener el código escaneable.

Ejemplo:

```ts
const user = getUser()
const permissions = getPermissions(user)

if (!permissions.canEdit) {
  return null
}

const formattedName = formatUserName(user)

return formattedName
```

---

## Uso de librerías del proyecto

El proyecto ya tiene librerías que deben usarse correctamente en vez de reinventar soluciones.

Usar cuando corresponda:

### Zustand

1. Usar para estado global o compartido de cliente.
2. No usar para estado local simple que vive bien en un componente.
3. Mantener stores pequeñas y enfocadas.
4. Evitar stores genéricas que acumulen responsabilidades sin relación.

### React Query / TanStack Query

1. Usar para server state, fetching, cache, invalidación, mutations y sincronización con backend.
2. Evitar `useEffect` manual para fetching si React Query resuelve el caso.
3. Mantener query keys tipadas y consistentes.
4. Extraer query keys con significado funcional.
5. Evitar duplicar lógica de fetching entre componentes.

### TanStack Router

1. Usar para rutas, navegación, params, search params y estructura de routing.
2. Mantener la integración idiomática del router.
3. No romper la estructura esperada de rutas.
4. Validar params y search params cuando aplique.
5. No co-localizar tests de rutas si eso interfiere con el routing.

### Valibot

1. Usar para validación de datos, params, search params, formularios o respuestas externas cuando aplique.
2. Usarlo especialmente donde ayude a evitar casts o tipado inseguro.
3. Preferir validación explícita de datos externos antes que assertions.
4. Mantener schemas cerca del dominio o módulo correspondiente.

### Integraciones

1. Usar integraciones disponibles entre TanStack Router, React Query y Valibot cuando tengan sentido.
2. No crear wrappers innecesarios si la librería ya ofrece una solución clara.
3. No añadir abstracciones por estética si no reducen complejidad real.

---

## Tests

1. Mantener o mejorar los tests existentes.
2. Agregar tests donde el refactor cambie estructura o extraiga lógica relevante.
3. Los tests deben vivir con sufijo `-test` cuando sea posible.
4. Ajustar la configuración de Vitest si el naming actual no cuadra.
5. Evitar mocks raros, frágiles o excesivos.
6. Preferir tests que validen comportamiento real.
7. Mockear solo cuando sea necesario.
8. No modificar tests para ocultar errores reales.
9. Si un test falla por un problema real del código, corregir el código.
10. Si un test falla porque estaba mal planteado o demasiado acoplado a implementación, refactorizar el test explicando el motivo.

Mockear solo cuando sea necesario para:

1. red
2. storage
3. timers
4. router
5. dependencias externas difíciles de controlar
6. APIs del navegador difíciles de reproducir

Naming esperado:

```txt
component-test.tsx
utils-test.ts
store-test.ts
query-test.ts
```

Excepción: para rutas, no colocar tests dentro de la misma carpeta si eso rompe o ensucia la estructura esperada del routing.

---

## Documentación del proyecto

Todas estas reglas deben quedar documentadas dentro del proyecto para que cualquier persona o agente que trabaje en el código tenga expectativas claras desde el inicio.

Actualizar o crear, según aplique:

### `AGENTS.md` / `agents.md`

1. Usar el casing real existente del proyecto.
2. Si no existe, crear `AGENTS.md` salvo que el proyecto ya tenga una convención distinta.
3. Documentar las reglas que deben seguir agentes de IA, asistentes de código o herramientas automatizadas.
4. Incluir reglas obligatorias de arquitectura, formato, tipado, testing y estilo.
5. Incluir instrucciones explícitas sobre:
   - no usar `any`
   - no usar type assertions
   - no usar ternarios anidados
   - no usar múltiples componentes por archivo
   - separar tipos, utils y estilos
   - usar `tailwind-variants` con `slots`
   - respetar imports de tipos con `import type`
   - usar correctamente Zustand, React Query, TanStack Router y Valibot
   - ejecutar checks antes de finalizar
   - actualizar documentación cuando cambien convenciones
   - no modificar configuración de lint o tests para ocultar errores reales

### `context.md`

1. Documentar el contexto técnico y arquitectónico del proyecto.
2. Explicar las decisiones relevantes de estructura.
3. Explicar cómo se organizan:
   - componentes
   - rutas
   - hooks
   - stores
   - queries
   - estilos
   - tipos
   - tests
   - documentación
4. Incluir convenciones del proyecto que no sean obvias solo mirando el código.
5. Mantenerlo alineado con las decisiones reales aplicadas durante la refactorización.

### `README.md`

1. Actualizar la documentación general para desarrolladores.
2. Incluir comandos reales de:
   - instalación
   - desarrollo
   - build
   - lint
   - typecheck
   - tests
   - format check, si aplica
3. Explicar la estructura del proyecto.
4. Explicar las reglas principales de contribución.
5. No saturar el README con todo el detalle interno si ya existe documentación específica.
6. Enlazar a `AGENTS.md`, `context.md`, `CONTRIBUTING.md` o documentos dentro de `/docs` cuando aplique.

### Otros documentos del proyecto

Actualizar cualquier documento existente relacionado con:

1. arquitectura
2. contribución
3. testing
4. estilos
5. rutas
6. convenciones
7. onboarding
8. agentes
9. calidad de código
10. tooling

Si existe `CONTRIBUTING.md`, agregar ahí las reglas para contributors humanos.

Si existe documentación interna dentro de `/docs`, mantenerla alineada.

Evitar contradicciones entre documentos. Si una regla vive en varios documentos, asegurar que el documento principal sea claro y que los demás lo referencien.

La documentación no debe ser genérica. Debe reflejar las decisiones reales aplicadas durante esta refactorización.

---

## Automatización con linters y configuración

Varias de estas reglas no deben depender solo de disciplina manual. Hay que automatizarlas con ESLint, TypeScript, Vitest, configuración de formato y cualquier herramienta existente del proyecto.

Antes de terminar la refactorización:

1. Revisar la configuración actual de:
   - ESLint
   - TypeScript
   - Vitest
   - Prettier, si existe
   - configuración de rutas
   - configuración de imports
   - reglas específicas de React
   - reglas específicas de TypeScript
2. Configurar reglas de lint para automatizar todo lo que sea posible.
3. Si una regla no puede automatizarse completamente, documentarla explícitamente en `AGENTS.md`, `context.md`, `README.md` o el documento más adecuado.
4. No introducir herramientas nuevas sin justificarlo.
5. Si la regla puede resolverse con la configuración actual, usar la configuración actual.
6. Si hace falta instalar un plugin nuevo de ESLint u otra herramienta, explicar por qué antes de hacerlo.
7. No relajar reglas existentes para hacer pasar errores reales.

---

## Reglas que deben automatizarse cuando sea posible

### TypeScript

Configurar linting y TypeScript para cubrir, como mínimo:

1. Prohibir `any`.
2. Prohibir type assertions:
   - `as SomeType`
   - `<SomeType>value`
3. Forzar imports de tipos con `import type`.
4. Separar imports normales e imports de tipos.
5. Evitar `import("...").Type`.
6. Detectar código inseguro relacionado con tipos.
7. Evitar `unknown` innecesario cuando sea posible.
8. Mantener `strict` activado en TypeScript.

Reglas o enfoques esperados si el stack lo permite:

```ts
"@typescript-eslint/no-explicit-any": "error",
"@typescript-eslint/consistent-type-imports": "error",
"@typescript-eslint/no-unnecessary-type-assertion": "error",
"@typescript-eslint/consistent-type-assertions": [
  "error",
  {
    "assertionStyle": "never"
  }
]
```

Además, revisar si pueden activarse reglas más estrictas de `@typescript-eslint` para evitar código inseguro, siempre que no generen ruido innecesario.

---

### Condicionales y returns

Automatizar:

1. No ternarios anidados.
2. No returns sin curly braces.
3. Curly braces obligatorios en bloques `if`, `else`, `for`, `while`, etc.

Reglas esperadas:

```ts
"no-nested-ternary": "error",
"curly": ["error", "all"]
```

---

### Arrow functions

Automatizar parcialmente:

1. Todas las arrow functions deben usar body con curly braces.
2. Evitar `() => value`.

Regla esperada:

```ts
"arrow-body-style": ["error", "always"]
```

Preferir funciones normales por sobre arrow functions puede no ser 100% automatizable sin afectar callbacks legítimos, APIs que esperan closures o patrones específicos de React. Si no se puede automatizar de forma segura, documentarlo claramente como convención obligatoria y aplicarlo durante el refactor.

---

### React y JSX

Automatizar cuando sea posible:

1. Un solo componente por archivo.
2. Evitar componentes múltiples dentro del mismo archivo.
3. Separación visual de bloques JSX.
4. Evitar JSX demasiado complejo.
5. Evitar lógica pesada dentro del render.

Reglas o enfoques posibles:

```ts
"react/no-multi-comp": "error",
"react/jsx-newline": "error"
```

Si alguna regla no encaja exactamente con el comportamiento deseado, ajustarla con opciones o documentar la parte que debe revisarse manualmente.

---

### Imports

Automatizar:

1. Orden de imports.
2. Separación entre imports normales e imports de tipos.
3. Evitar imports inconsistentes.
4. Evitar imports duplicados.
5. Evitar imports no usados.
6. Evitar imports circulares si el tooling actual lo permite.

Revisar si el proyecto ya usa una herramienta para esto. Si no, evaluar reglas de ESLint existentes antes de introducir plugins nuevos.

---

### Magic strings

Automatizar donde sea razonable.

No todos los magic strings pueden detectarse bien sin falsos positivos. Aun así, revisar opciones para detectar:

1. strings repetidos
2. keys de dominio
3. nombres de rutas
4. estados
5. actions
6. nombres de eventos
7. variantes visuales
8. query keys
9. storage keys
10. mensajes o códigos de error con significado funcional

Si no se puede automatizar sin generar demasiado ruido, documentar la regla y aplicarla manualmente durante la refactorización.

---

### Vitest

Actualizar la configuración de Vitest si es necesario para soportar el naming esperado:

1. Tests con sufijo `-test`.
2. Tests co-localizados cuando tenga sentido.
3. Excepción para rutas cuando la colocación de tests interfiera con TanStack Router o con la estructura esperada del routing.
4. Mantener compatibilidad con tests existentes si tienen naming distinto, salvo que se migren explícitamente.

Ejemplo de intención:

```txt
component-test.tsx
utils-test.ts
store-test.ts
```

Revisar y ajustar la configuración para que los tests sean descubiertos correctamente sin romper los tests existentes.

---

### Formato

Si el proyecto usa Prettier u otra herramienta de formato:

1. Mantener configuración consistente.
2. No usar formatters para ocultar problemas de estructura.
3. Documentar el comando real de format o format check.
4. Evitar conflictos entre Prettier y ESLint.

---

## Checks obligatorios antes de finalizar

Antes de dar por terminada la refactorización, ejecutar o dejar preparados los comandos equivalentes del proyecto para:

1. typecheck
2. lint
3. tests
4. build, si aplica
5. format check, si aplica

Documentar estos comandos en `README.md` y, si aplica, en `AGENTS.md`.

Ejemplo de sección esperada:

````md
## Quality checks

Antes de abrir un PR o entregar cambios, ejecutar:

\```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
\```
````

Usar los comandos reales del proyecto. No inventar comandos si el proyecto usa otros nombres.

---

## Restricciones importantes

No hacer lo siguiente:

1. No cambiar comportamiento funcional salvo que sea claramente un bug.
2. No introducir dependencias nuevas sin justificarlo.
3. No hacer refactors gigantes en una sola masa si se puede dividir en pasos.
4. No eliminar código sin verificar que no se usa.
5. No esconder problemas con casts, mocks o silenciamiento de errores.
6. No usar `any`.
7. No usar type assertions.
8. No usar ternarios anidados.
9. No usar returns sin curly braces.
10. No dejar componentes múltiples en el mismo archivo.
11. No dejar estilos complejos dentro del JSX.
12. No dejar reglas importantes solo como conocimiento implícito.
13. No depender de memoria o criterio manual cuando una regla pueda automatizarse con linting o configuración.
14. No modificar configuración de lint, TypeScript o Vitest de forma laxa para hacer pasar errores reales.
15. No crear documentación genérica que no refleje el estado real del proyecto.
16. No duplicar documentación contradictoria entre archivos.
17. No usar mocks raros para hacer pasar tests.
18. No usar wrappers innecesarios sobre librerías que ya resuelven el problema.
19. No añadir abstracciones sin valor real.
20. No dejar el proyecto en un estado intermedio difícil de validar.

---

## Casos en los que debes detenerte y preguntar

Detente y explícame antes de continuar si:

1. Parece imposible evitar una type assertion.
2. Una regla entra en conflicto con otra.
3. Hace falta introducir una dependencia nueva.
4. Hace falta relajar una regla de lint o TypeScript.
5. El refactor requiere cambiar comportamiento funcional.
6. La estructura actual del router impide co-localizar tests o componentes como se esperaba.
7. Una regla no puede automatizarse sin generar muchos falsos positivos.
8. Un test existente parece incorrecto o demasiado acoplado a implementación.
9. Hay una decisión arquitectónica que afecta varias carpetas o módulos.
10. La documentación existente contradice el código real.

---

## Resultado esperado

Al terminar, quiero:

1. Archivos más pequeños y enfocados.
2. Un solo componente por archivo.
3. Tipos extraídos a archivos `-types`.
4. Utilidades locales extraídas a archivos `-utils`.
5. Estilos extraídos a archivos `-styles` usando `tailwind-variants` y `slots`.
6. JSX más limpio y legible.
7. Cero `any`.
8. Cero type assertions.
9. Cero ternarios anidados.
10. Cero magic strings relevantes.
11. Imports de tipos correctamente separados.
12. Tests funcionando.
13. Tipado, lint y Vitest pasando.
14. Uso idiomático de Zustand, React Query, TanStack Router y Valibot cuando aplique.
15. `AGENTS.md` o `agents.md`, `context.md`, `README.md` y documentación relacionada actualizados.
16. Reglas del proyecto documentadas para humanos y agentes.
17. Linters configurados para automatizar todas las reglas posibles.
18. Vitest configurado para reconocer el naming de tests esperado.
19. Comandos de validación documentados.
20. Resumen claro de qué reglas se automatizaron y cuáles siguen siendo convenciones manuales.

---

## Resumen final obligatorio

Al finalizar, entrega un resumen con esta estructura:

````md
## Resumen de la refactorización

### Archivos modificados

- ...

### Componentes separados

- ...

### Tipos extraídos

- ...

### Utilidades extraídas

- ...

### Estilos extraídos

- ...

### Cambios de JSX y render

- ...

### Problemas de tipado corregidos

- ...

### Tests actualizados o agregados

- ...

### Documentación actualizada

- ...

### Reglas automatizadas

- ...

### Reglas no automatizadas

- Regla:
- Motivo:
- Cómo queda documentada:

### Configuración modificada

- ESLint:
- TypeScript:
- Vitest:
- Prettier/formato:
- Otros:

### Comandos de validación

\```bash

# usar los comandos reales del proyecto

...
\```

### Decisiones técnicas relevantes

- ...

### Riesgos o pendientes

- ...
````

---

## Criterio de aceptación

La refactorización se considera completa solo si:

1. El código compila.
2. TypeScript pasa sin errores.
3. ESLint pasa sin errores.
4. Vitest pasa sin errores.
5. El build pasa si aplica.
6. El formato pasa si aplica.
7. No hay `any`.
8. No hay type assertions.
9. No hay ternarios anidados.
10. No hay returns sin curly braces.
11. No hay múltiples componentes en un mismo archivo.
12. No hay estilos complejos directamente en JSX.
13. Las reglas principales están documentadas.
14. Las reglas automatizables están configuradas en tooling.
15. Las reglas no automatizables están documentadas y justificadas.
16. Los documentos del proyecto no se contradicen entre sí.
17. El resumen final explica claramente qué cambió y por qué.

# React Doctor Integration

React Doctor is a diagnostic tool used in the Mimic project to ensure React best practices, performance, and maintainability. It complements our existing linting setup by providing a health score and specific recommendations for React components.

## Why React Doctor?

While Oxlint and ESLint catch syntax and general code quality issues, React Doctor focuses specifically on React-related patterns, such as:
- Proper hook usage and dependencies.
- Component complexity and prop drilling.
- Performance bottlenecks in rendering.
- Adherence to React 19 patterns.

## Commands

The following scripts are available in the root `package.json`:

- `bun run doctor:react`: Runs a full diagnostic on the project and outputs a human-readable report.
- `bun run doctor:react:json`: Runs diagnostics and outputs the results in JSON format.
- `bun run doctor:react:check`: Runs the score enforcement wrapper. This is used in CI to ensure the project health remains above the defined threshold.

## Score Enforcement

We maintain a minimum health score to ensure code quality doesn't degrade over time.

- **Target Score:** >= 75
- **Enforcement Script:** `scripts/react-doctor-check.ts`

The check script runs `react-doctor` for each configured project (currently `web` and `conduit`) and fails if the score falls below the threshold defined in `package.json`.

### Configuration in `package.json`

```json
"reactDoctor": {
  "projects": [
    "web",
    "conduit"
  ],
  "scoreThreshold": 75
}
```

## Configuration

The tool is configured via `react-doctor.config.json` in the root directory.

### Key Settings
- `share: false`: Telemetry is disabled.
- `adoptExistingLintConfig: true`: It respects our existing ESLint/Oxlint rules.
- `respectInlineDisables: true`: It allows for granular suppression of rules.

### Ignored Files
We ignore auto-generated files, legacy code, and third-party UI components:
- `**/routeTree.gen.ts`
- `web/**` and `rift/**` (legacy stack)
- `**/components/ui/**` (Shadcn UI components)

## Suppression Policy

If a diagnostic reports a false positive or a rule cannot be followed for a valid architectural reason, you can suppress it using inline comments.

### Examples

**Disable for a specific line:**
```tsx
// react-doctor-disable-line rule-name
const MyComponent = () => { ... }
```

**Disable for the next line:**
```tsx
// react-doctor-disable-next-line rule-name
useEffect(() => { ... }, []);
```

**Disable for a block:**
```tsx
/* react-doctor-disable rule-name */
const ComplexComponent = () => { ... }
/* react-doctor-enable rule-name */
```

*Note: Always provide a comment explaining why a rule is being suppressed.*

## Interpreting Diagnostics

When you run `bun run doctor:react`, the output will list specific issues categorized by severity. 

1. **Identify the file and line:** The report points directly to the source of the issue.
2. **Understand the rule:** Each diagnostic includes a rule name and a brief explanation.
3. **Fix or Suppress:** 
   - If it's a genuine improvement (e.g., missing dependency in `useMemo`), apply the fix.
   - If it's a false positive or intentional pattern, use an inline suppression.

Maintaining a high score (currently ~88 for `web` and ~95 for `conduit`) ensures our React codebase remains modern and efficient.

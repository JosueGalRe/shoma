## Issues

- `lsp_diagnostics` could not run in this environment because `typescript-language-server` is not installed, so build verification had to carry the type-check confidence for this pass.
- The same `typescript-language-server` gap blocked diagnostics for the lobby logging pass as well; the production build still completed successfully.

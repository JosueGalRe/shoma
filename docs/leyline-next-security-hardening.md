# Security Hardening: Future Work

This document outlines security improvements for `leyline` identified during the technical diagnostic. These items are scheduled as separate work from the Effect-TS migration.

## 1. CORS Hardening

The current implementation uses a wildcard for cross-origin requests, which exposes endpoints to any web origin.

*   **Current behavior**: `Access-Control-Allow-Origin` is set to `*`.
*   **Recommended change**: Restrict the allowed origins to known Sho'ma client domains.
*   **Risk level**: High
*   **Effort estimate**: Low
*   **Files affected**: `leyline/src/index.ts`

## 2. JWT Error Exposure

The registration endpoint reveals internal configuration details when the JWT secret is missing. This provides unnecessary information about the server environment.

*   **Current behavior**: Returns "Missing LEYLINE_JWT_SECRET." when the environment variable isn't set.
*   **Recommended change**: Return a generic "Internal Server Error" or "Configuration Error" without naming specific variables.
*   **Risk level**: Medium
*   **Effort estimate**: Low
*   **Files affected**: `leyline/src/index.ts`

## 3. Input Validation Refinements

HTTP schemas currently check for basic types like strings but don't verify the actual content. This allows malformed or malicious data to reach deeper layers.

*   **Current behavior**: `http-schemas.ts` decoders validate structure but not semantics, such as string length or specific formats.
*   **Recommended change**: Add refinements to `Schema` definitions for public keys, 6-digit codes, and other inputs.
*   **Risk level**: Medium
*   **Effort estimate**: Medium
*   **Files affected**: `leyline/src/core/http/http-schemas.ts`

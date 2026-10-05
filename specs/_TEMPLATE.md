# Spec: <Feature / Change Name>

**Status:** Draft | In Progress | Done
**Related files:** <paths this spec covers>

See [SPEC.md](../SPEC.md) for project-wide standards this spec inherits.

## 1. Overview

What is this feature/change, and why is it needed? Keep to a few sentences.

## 2. Code Spec

### Types / Interfaces

New or changed types (add to `src/types/project.ts` if shared; keep backend field names
exact, e.g. `desiredManpower`).

```ts
// example
```

### Function / Component Signatures

Public functions, hooks, or component props this change introduces or modifies.

### Business Rules / Formulas

For calculators or derived values, document formula, units, and rounding behavior —
follow the style in `src/utils/calculatorUtils.ts`.

### Guards & Edge Cases

What invalid/boundary inputs must be handled, and what should happen (e.g. return zeroed
output, show an error message, disable a button)?

### API Contract (if applicable)

Endpoint, method, request/response shape, and which `*API` object in
`src/services/api.ts` it belongs to.

## 3. Test Suite

List the concrete test cases to write, grouped per the standard in `SPEC.md`:

### Nominal cases
-

### Edge cases
-

### Guards / invalid input
-

### Integration (component-level, mocked API/hooks)
-

## 4. Validation Checklist

- [ ] Types match the backend contract
- [ ] `canEdit` gates every write action touched by this change
- [ ] Async calls show loading state and handle errors
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Manually verified in the browser
- [ ] <feature-specific criteria>

## 5. Open Questions

-

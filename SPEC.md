# NSE Scheduler Frontend — Project Specification

This file defines how we do **spec-driven development** in this repo: every non-trivial
feature or fix gets a spec (code spec + test suite + validation checklist) before or
alongside implementation.

## Structure

| Path | Purpose |
|---|---|
| `SPEC.md` (this file) | Project-wide standards that apply to every spec |
| `specs/README.md` | How to use the spec process day-to-day |
| `specs/_TEMPLATE.md` | Copy this to start a new feature spec |
| `specs/<feature-name>.spec.md` | One spec per feature/change (created as needed) |
| `.github/copilot-instructions.md` | Architecture rules for AI assistants — read first |

## Process

1. Copy `specs/_TEMPLATE.md` → `specs/<feature-name>.spec.md`.
2. Fill in **Code Spec** and **Test Suite** sections before (or alongside, for small
   changes) writing implementation code.
3. Implement against the spec.
4. Write/update tests per the Test Suite section.
5. Walk the **Validation Checklist** before calling the work done.
6. Keep the spec file up to date — it's the source of truth, not a one-time artifact.

Trivial changes (typo fixes, styling tweaks) don't need a spec file. Use judgment: if it
touches business logic, API contracts, or shared types, write the spec.

## Project-Wide Code Spec Standards

- Follow the architecture rules in [.github/copilot-instructions.md](.github/copilot-instructions.md)
  (never call the AI service directly, API calls go through `src/services/api.ts`, etc.) —
  don't duplicate them here, link to them.
- Match backend contract types exactly: `Project.desiredManpower` (lowercase `p`),
  `EstimationOutputs.efficiencySource` (`"provided" | "agent_inferred" | "fallback_default"`),
  `calculatedEfficiency` as a decimal (0–2.0), not a percentage.
- Business-logic functions (calculators, validators, formatters) must document **formula,
  units, and guards/edge cases** in a JSDoc block — follow the existing style in
  [src/utils/calculatorUtils.ts](src/utils/calculatorUtils.ts) as the reference example.
- New API methods go in `src/services/api.ts`, grouped by resource (`authAPI`,
  `projectAPI`, `estimateAPI`, ...), typed with request/response types from
  `src/types/project.ts`.
- UI write actions (create/edit/delete) must be gated behind `canEdit` from
  `useUserRole()`.

## Project-Wide Test Suite Standards

- Test files are colocated: `Component.test.tsx` next to `Component.tsx`,
  `util.test.ts` next to `util.ts`.
- Structure `describe` blocks by category, in this order:
  1. **Nominal cases** — expected inputs, expected outputs.
  2. **Edge cases** — boundary values, non-integer inputs, inflation/scaling behavior.
  3. **Guards / invalid input** — zero, negative, NaN, out-of-range values.
  4. **Integration** (component tests only) — rendering, user interaction, async
     loading/error states.
- Mock `../services/api` with an explicit `jest.mock(..., () => ({...}))` factory, not
  automock — required to avoid the axios ESM issue (see
  [src/components/ProjectCalculator.test.tsx](src/components/ProjectCalculator.test.tsx)).
- Mock `useUserRole` per test with explicit role helpers (e.g. `asEditor()`, `asViewer()`)
  whenever behavior depends on `canEdit`/`role`.
- New business logic requires at minimum: nominal + boundary + guard test cases before
  it's considered spec-complete.

## Project-Wide Validation Standards (manual checklist)

Every spec's Validation Checklist should include at least:

- [ ] Types match the backend contract (see Code Spec standards above).
- [ ] `canEdit` gates every write action touched by this change.
- [ ] Async calls show a loading state and handle/display errors.
- [ ] `npm test` passes.
- [ ] `npx tsc --noEmit` passes (no type errors).
- [ ] Manually verified in the browser (`localhost:3000` against backend `localhost:5000`).

## References

- [.github/copilot-instructions.md](.github/copilot-instructions.md) — architecture rules.
- [src/utils/calculatorUtils.ts](src/utils/calculatorUtils.ts) — reference example of
  code-spec-level documentation already in this codebase.
- [src/utils/calculatorUtils.test.ts](src/utils/calculatorUtils.test.ts) — reference
  example of the nominal/edge/guard test structure.

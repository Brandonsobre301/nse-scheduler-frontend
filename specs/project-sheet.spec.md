# Spec: Project sheet (MVP)

**Status:** Draft
**Related files:** `src/pages/ProjectDetailPage.tsx`, `src/types/project.ts`, `src/services/api.ts`, backend `models/Project.ts`, `routes/projectRoutes.ts`

See [SPEC.md](../SPEC.md) for project-wide standards this spec inherits.

## 1. Overview

A Smartsheet-like **grid for one project**: rows are phases or areas, columns are dates, crew size, and hours. This is not a spreadsheet engine and not Bluebeam. It is the first MVP slice so office and field can share one crew plan.

## 2. Code Spec

### Types / Interfaces

Extend `Project` (keep existing `desiredManpower` spelling) with an ordered list of rows:

```ts
export interface ProjectSheetRow {
  id: string;
  name: string;          // phase or area
  startDate?: string;    // ISO date
  endDate?: string;
  crewSize: number;      // people, integer >= 0
  manHours: number;      // hours, >= 0
}

// on Project
sheetRows?: ProjectSheetRow[];
```

Backend field names must match exactly when the API is added.

### Function / Component Signatures

- `ProjectSheet` on `ProjectDetailPage` — table, `canEdit` gates writes.
- Read/write via `projectAPI` (get by id, patch sheet rows). No new axios clients.

### Business Rules / Formulas

- Totals: `sum(manHours)`, `max(crewSize)` for the header.
- Duration of a row is calendar days between `startDate` and `endDate` (inclusive). Do not invent efficiency math here; the existing calculator stays on the project totals.
- Empty sheet is valid (zero rows).

### Guards & Edge Cases

- Viewer: read-only grid.
- Invalid dates (`end` before `start`): inline error, do not save.
- Negative crew or hours: reject.
- Unauthenticated: existing `ProtectedRoute`.

### API Contract (if applicable)

Not implemented yet. Proposed:

- `PATCH /projects/:id/sheet` — body `{ sheetRows: ProjectSheetRow[] }`
- Auth required; `admin` | `manager` to write. **Do not invent tenancy** until ownership is a product requirement; document that any authenticated user can still `GET` all projects today.

## 3. Test Suite

### Nominal cases

- Render rows from a project payload
- Manager adds a row and saves

### Edge cases

- Zero rows
- Missing optional dates

### Guards / invalid input

- Viewer cannot save
- endDate before startDate

### Integration (component-level, mocked API/hooks)

- Mock `projectAPI` update; assert loading and error banner

## 4. Validation Checklist

- [ ] Types match the backend contract
- [ ] `canEdit` gates every write action touched by this change
- [ ] Async calls show loading state and handle errors
- [ ] `npm test` passes
- [ ] `npx tsc --noEmit` passes
- [ ] Manually verified in the browser
- [ ] Confirm row columns with a superintendent/PM before coding

## 5. Open Questions

- Who owns a project (user vs company vs job number)? Needed before BOLA.
- Should timeline (`ProjectTimeline`) read the same `sheetRows` in the next spec?
- CSV export this slice or wait for roadmap item 4?

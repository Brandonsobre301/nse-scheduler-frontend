# NSE Scheduler — Frontend Workspace Instructions

You are working on the React (TypeScript + Tailwind CSS + CRA) frontend for the NSE Scheduler.

## Critical Architecture Rule
**Never call the FastAPI service (`http://ai-service:8000`) directly.** All API calls go to the Express backend at `http://localhost:5000` (dev) or relative `/api` path (Docker). The proxy to the AI service is handled server-side.

## API Service Layer (`src/services/api.ts`)
All HTTP calls go through the axios instance in `api.ts` with the JWT interceptor.
- `authAPI` — login, signup, profile
- `projectAPI` — project CRUD
- `estimateAPI.calculate()` — POST `/api/v1/estimate` — estimation engine + AI inference

## Type Conventions
- `Project.desiredManpower` — lowercase `p` (matches backend MongoDB schema). Do NOT use `desiredManPower`.
- `EstimationOutputs.efficiencySource` — `"provided" | "agent_inferred" | "fallback_default"`
- `EstimationOutputs.calculatedEfficiency` — decimal (0–2.0), NOT a percentage

## Key Files

| Concern | File |
|---|---|
| API service | `src/services/api.ts` |
| Type definitions | `src/types/project.ts` |
| Auth context | `src/context/AuthContext.tsx` |
| Role hook | `src/hooks/useUserRole.ts` |
| Calculator + AI UI | `src/components/ProjectCalculator.tsx` |
| Project detail | `src/pages/ProjectDetailPage.tsx` |
| Routes | `src/AppRoutes.tsx` |

## Coding Standards
- `canEdit` from `useUserRole()` gates all write operations in the UI
- `estimateAPI.calculate()` is async — always show loading state, handle errors
- The "✨ AI Infer" toggle defaults to `true` — omit `assumedEfficiency` from the request body when active
- Evidence drawer is collapsible — do not auto-expand on render
- CORS origin is `http://localhost:3000` (CRA dev port)
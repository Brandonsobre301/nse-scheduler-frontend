# NSE Resource Scheduler (frontend)

React (CRA + TypeScript) UI for project scheduling, calculators, and estimates.

The browser talks only to Express (`REACT_APP_API_URL` in local dev, or `/api` behind nginx in Docker). It never calls the FastAPI `ai-service`.

## Local dev

```bash
cp .env.example .env   # REACT_APP_API_URL=http://localhost:5000
npm install
npm start              # http://localhost:3000
```

Backend must be running on port 5000 (`cd ../backend && npm run dev`).

## Docker

From the parent `nse-scheduler` folder: `./bin/nse up`. See [../docs/DOCKER.md](../docs/DOCKER.md).

## Specs

Feature work uses [SPEC.md](./SPEC.md) and [specs/](./specs/).

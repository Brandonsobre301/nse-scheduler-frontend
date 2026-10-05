1. **Zero Secret Storage:**

   * Never store database URIs, JWT signing secrets, or private API keys in `.env.local` or React code. Anything prefixed with `REACT_APP_` or `VITE_` is visible in plain text in browser bundles.

2. **Strict Route Targeting:**

   * The frontend code must only know the address of the Express gateway (e.g., `http://localhost:5000/api/v1/...`). It must have zero references or direct connections to the internal Python container port (`:8000`).

3. **Client-Side Form Constraints (UX Layer):**

   * Use HTML5/React constraints (`min="1"`, `type="number"`) so estimators cannot submit negative hours by accident.

   * Provide immediate feedback (e.g., "Manpower must be greater than 0") before wasting an HTTP call.

4. **Debounce & Double-Submission Prevention:**

   * Because vector search takes 1–3 seconds, disable calculation buttons immediately on click and show a loading spinner. This stops accidental rapid-fire requests against the embedding service.

5. **Cross-Site Scripting (XSS) Prevention:**

   * When displaying historical project descriptions or supervisor names retrieved from MongoDB, let React render them safely via JSX (`<div>{project.description}</div>`).

   * Never use `dangerouslySetInnerHTML` for project metadata.

6. **Graceful Error Display:**

   * If Express returns an HTTP 400 or 500, intercept it and show a readable error banner. Never dump raw JSON error responses into the UI.

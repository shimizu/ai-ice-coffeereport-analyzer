# Repository Guidelines

## Project Structure & Module Organization
Frontend code lives at the repo root. Key entry points are `index.tsx` and `App.tsx`, with shared types and constants in `types.ts` and `constants.ts`. UI pieces are organized under `components/`, auth and global state in `contexts/`, and API/data logic in `services/`. The backend is a Firebase/Express setup in `functions/` (and a local `server.js` for the dev server). Configuration and deployment files include `firebase.json`, `firestore.rules`, and `firestore.indexes.json`. Generated assets live in `dist/`, and supporting docs live in `docs/` (and `refrence/` for supplemental notes).

## Build, Test, and Development Commands
- `npm run dev`: Start the Vite frontend dev server.
- `npm run server`: Run the local Node/Express server in `server.js`.
- `npm run dev:all`: Run frontend and server together via `concurrently`.
- `npm run build`: Build the production frontend into `dist/`.
- `npm run preview`: Preview the Vite build locally.
- `npm run deploy`: Deploy to Firebase (Hosting + Functions as configured).

## Coding Style & Naming Conventions
Use TypeScript with React. The codebase uses 2-space indentation, semicolons, and single quotes. Component files are `PascalCase` (e.g., `UploadSection.tsx`), hooks and helpers are `camelCase`, and types/interfaces are `PascalCase`. Tailwind CSS utility classes are used directly in JSX; keep class lists readable and grouped by layout → spacing → color.

## Testing Guidelines
There is no automated test framework configured yet. If you add tests, place them alongside the feature or under a `__tests__/` folder and use `*.test.ts`/`*.test.tsx` naming. Include a short note in the PR describing what you validated manually.

## Commit & Pull Request Guidelines
Commits follow a conventional style like `feat: ...`, `fix: ...`, or `docs: ...` (Japanese summaries are acceptable). For PRs, include a brief summary, list relevant commands you ran, and add screenshots for UI changes. Link related issues when applicable.

## Security & Configuration Tips
Store secrets in `.env` (see `.env.example`) and keep `service-account.json` out of version control. Update Firestore rules and indexes (`firestore.rules`, `firestore.indexes.json`) alongside any schema or security changes.

## Agent Communication
Developers are Japanese, so respond in Japanese.

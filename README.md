# CodeLingo

AI-assisted programming learning app built with React, Vite, TypeScript, and
TanStack Router.

## Scripts

- `npm run dev` starts the local Vite dev server.
- `npm run build` creates a production build.
- `npm run lint` runs Oxlint.
- `npm run typecheck` runs TypeScript checks.

## Routing

Routes follow `CONVENTION.MD`:

- File-based routes live in `src/routes/`.
- Route files stay thin.
- Feature UI lives under `src/features/<feature-name>/`.

The current app exposes only the `/login` route.

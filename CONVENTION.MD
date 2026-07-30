# Project Conventions

This document defines the folder structure, naming, and routing conventions for this codebase.
Follow these rules exactly when creating or editing files. Do not invent alternate patterns.

---

## 1. Tech Stack

- Framework: TanStack Start (React)
- Routing: TanStack Router (file-based, `src/routes/`)
- Language: TypeScript

---

## 2. File Naming

- **All file and folder names use kebab-case.** No camelCase, no PascalCase, no snake_case.
  - Correct: `streak-card.tsx`, `use-onboarding-progress.ts`, `email-input.tsx`
  - Incorrect: `StreakCard.tsx`, `useOnboardingProgress.ts`, `email_input.tsx`
- Exceptions (framework-mandated, do not rename):
  - `__root.tsx` (TanStack Router root route file)
  - Route files that must match TanStack Router's file-based routing syntax (see Section 4) — these use `$`, `_`, and `.` as required by the router, but the rest of the filename (outside those special characters) stays kebab-case, e.g. `$post-id.tsx`, `_auth.tsx`.
- Component names inside files are still PascalCase (that's a React/TS convention, not a filesystem one). Only the **file name on disk** is kebab-case.
  ```
  // file: streak-card.tsx
  export function StreakCard() { ... }
  ```

---

## 3. Top-Level Folder Structure

```
src/
├── routes/                # TanStack Router file-based routes (thin — see Section 4)
├── features/               # Feature-folder modules (all real logic lives here)
│   ├── onboarding/
│   ├── streak/
│   ├── auth/
│   └── ...
├── components/              # Shared/global UI primitives used across 2+ features
│   └── ui/                  # Base primitives (button, input, dialog, etc.)
├── lib/                     # Shared utilities, API client, helpers (non-feature-specific)
├── hooks/                   # Shared hooks used across multiple features
├── stores/                  # Global app-level state (if any), not feature-local state
├── styles/
├── router.tsx                # TanStack Router instance config
└── server.ts                 # Custom server entry (if used)
```

Rule of thumb: if a piece of code is only used by one feature, it lives inside that feature's folder.
It only gets promoted to `components/`, `hooks/`, or `lib/` once a second feature needs it.

---

## 4. Feature Folder Structure

Every feature under `src/features/<feature-name>/` follows this internal shape:

```
src/features/onboarding/
├── components/            # Components used only within this feature
│   ├── welcome-step.tsx
│   ├── profile-form.tsx
│   └── progress-bar.tsx
├── hooks/                  # Hooks scoped to this feature
│   └── use-onboarding-state.ts
├── api/                     # Server functions / queries / mutations for this feature
│   ├── get-onboarding-status.ts
│   └── submit-onboarding-step.ts
├── types.ts                  # TypeScript types/interfaces for this feature
├── schema.ts                  # Zod schemas for validation (forms, server function input)
├── constants.ts                # Feature-local constants
└── index.ts                     # Public exports — other features/routes import from here only
```

Notes:
- Not every feature needs every folder. Only create what's needed (e.g. a simple feature might just have `components/` and `index.ts`).
- `index.ts` is the feature's public API. Routes and other features should import from `features/onboarding` (the barrel), not reach into `features/onboarding/components/welcome-step` directly, unless there's a good reason.
- Feature-to-feature imports should be rare. If `streak` needs something from `onboarding`, prefer lifting the shared piece into `src/lib/` or `src/components/` instead of importing across features.

---

## 5. TanStack Router File-Based Routing Rules

Routes live in `src/routes/`. TanStack Start uses TanStack Router's file-based routing, and the file name maps directly to the URL — these special characters are load-bearing and must not be changed:

| Pattern | Meaning | Example file | Resulting URL |
|---|---|---|---|
| `index.tsx` | Index route for a directory | `routes/index.tsx` | `/` |
| `about.tsx` | Static segment | `routes/about.tsx` | `/about` |
| `$param.tsx` | Dynamic path param | `routes/posts/$postId.tsx` | `/posts/:postId` |
| `_layout.tsx` (leading `_`) | Pathless layout route — wraps children, no URL segment | `routes/_auth.tsx` | wraps children, adds no path |
| `posts.$postId.tsx` (flat, dot-separated) | Same as nested `posts/$postId.tsx` | — | `/posts/:postId` |
| `__root.tsx` | Root route, wraps the entire app | `routes/__root.tsx` | — |

Rules for this project:
- **Routes stay thin.** A route file should only:
  1. Import the page/screen component from the matching `features/` folder
  2. Define `loader`, route-level validation (`params`, `search` schemas), and `beforeLoad` (auth guards)
  3. Render the imported component
- **No business logic, no data-fetching logic, and no large JSX trees directly inside `routes/`.** That belongs in `features/<feature>/components/`.
- Group related routes using directories that mirror the URL, e.g.:
  ```
  routes/
  ├── __root.tsx
  ├── index.tsx
  ├── _auth.tsx                    # pathless layout wrapping auth-only routes
  ├── _auth.dashboard.tsx
  ├── onboarding/
  │   ├── index.tsx
  │   └── $step.tsx
  └── streak/
      └── index.tsx
  ```
- Use pathless layout routes (`_name.tsx`) for shared wrappers (auth guard, shared shell) instead of duplicating layout logic per route.

### Example route file (thin, correct pattern)

```tsx
// routes/onboarding/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { OnboardingPage } from '@/features/onboarding'

export const Route = createFileRoute('/onboarding/')({
  component: OnboardingPage,
})
```

```ts
// features/onboarding/index.ts
export { OnboardingPage } from './components/onboarding-page'
```

---

## 6. Server Functions

- Server functions belong inside the owning feature's `api/` folder, one function (or closely related group) per file.
- Name files after the action they perform: `get-onboarding-status.ts`, `submit-onboarding-step.ts` — not generic names like `api.ts` or `queries.ts`.
- Server functions are imported into feature components or route loaders — never called directly from `routes/` files without going through the feature's `api/` layer.

---

## 7. Quick Checklist (for the AI agent before creating a file)

1. Is this a route (URL-addressable page)? → `src/routes/`, follow Section 5, keep it thin.
2. Is this feature-specific logic/UI? → `src/features/<feature>/...`, follow Section 4.
3. Is this used by 2+ features already? → `src/components/`, `src/hooks/`, or `src/lib/`.
4. Is the file name kebab-case? → Required, except router-mandated tokens (`$`, `_`, `.`, `__root.tsx`).
5. Does the feature expose only what's needed via `index.ts`? → Avoid deep cross-feature imports.
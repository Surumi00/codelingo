# CodeLingo Web → React Native: Technical Brief

Source of truth: this repo only (frontend). Backend lives in a separate repo/process on `http://localhost:3000` [UNSURE — not in this repo].
Labels: **[INCOMPLETE]** = unfinished/stubbed/buggy, **[UNSURE]** = not determinable from code.

---

## 1. OVERVIEW

- **What it does:** Learn-to-code app (Duolingo-style). Flow: register/login → onboarding questions → 15-question diagnostic → AI review + level placement → syllabus browser. Lessons/practice not built yet.
- **Frontend:** React 19 + Vite + TypeScript, TanStack Router (file-based routes), Tailwind v4 + per-feature plain CSS. HTTP: `axios`. State: React local state + `localStorage` (no global store).
- **Backend:** REST at `http://localhost:3000` (separate service, hardcoded in 8 axios call sites across 6 files). DB: unknown from here; `.env` exists with var names `DATABASE_URL`, `codelingo@password` (names only; not used by frontend) [UNSURE].
- **Auth:** Bearer JWT-style token returned by `/auth/login`, stored in `localStorage` under key `token`, sent as `Authorization: Bearer <token>`. No cookies.

---

## 2. BACKEND API CONTRACT

### Endpoints used by the frontend

| # | Method | Path | Auth | Request | Response shape (as consumed) | Error cases handled |
|---|--------|------|------|---------|------------------------------|---------------------|
| 1 | POST | `/auth/login` | none | `{ email: string, password: string}` | `{ token: string, ...rest [UNSURE]}` — only `token` is read | non-2xx → generic "Login failed"; body not parsed |
| 2 | POST | `/auth/register` | none | `{ name, email, password }` (trimmed) | [UNSURE] — body ignored on success | non-2xx → reads `response.data.message`, else "Registration failed." |
| 3 | GET | `/auth/me` | Bearer | — | `data.user ?? data` → `{ name: string, email: string, language: string, ...[UNSURE]}` | any failure → token cleared + redirect to `/login` (no status distinction) |
| 4 | POST | `/me/onboarding` | Bearer | `{ occupation: 'STUDENT'\|'PROFESSIONAL'\|'HOBBYIST', experienceLevel: 'STUDENT'\|'BEGINNER'\|'SOME_EXPERIENCE'\|'EXPERIENCED', language: 'PYTHON'\|'JAVA'\|'JAVASCRIPT' }` | ignored [UNSURE] | non-2xx → inline "couldn't save" message, retry allowed |
| 5 | GET | `/diagnostic/questions` | Bearer | — | `{ questions: Array<{ id: number, conceptSlug: string, difficulty: string, prompt: string, options: string[] }> }` | network fail → error screen w/ Retry; empty array → "No diagnostic questions…" |
| 6 | POST | `/diagnostic/submit` | Bearer | `{ answers: Array<{ questionId: number, selectedOptionIndex: number }> }` (order = question order) | `{ score: number, totalQuestions: number, percentage: number, level: 'BEGINNER'\|'ELEMENTARY'\|'INTERMEDIATE'\|'ADVANCED', review: string, startingSyllabusLevel: { id: number, title: string } \| null, breakdown: Record<conceptSlug, { correct: number, total: number }> }` | non-2xx → inline submit error, form stays filled |
| 7 | GET | `/diagnostic/result` | Bearer | — | Highly-tolerant normalization accepts `raw.result ?? raw.diagnostic ?? raw` with `score` (number or `"x/y"` string), `scoreTotal`, `questionsAnswered`, `level`, `insight`, `concepts: [{ name, score: 0–5, status: 'Strong'\|'Developing'\|'Weak' }]`. Exact wire shape [UNSURE] | 404 / 204 / 400 / 422 → treated as "no diagnostic yet"; other errors → same |
| 8 | GET | `/api/syllabus` | Bearer sent if token exists (may be optional [UNSURE]) | — | Either `Level[]` or `{ data: Level[] }`. Parsed leniently: `Level = { id: string\|number, title\|name\|label: string, slug?, description?, label?, order?: number, topics: Topic[] }`, `Topic = { id, title\|name\|slug, blurb\|description?, icon?: string, order?, concepts: Concept[] }`, `Concept = { id, title\|name\|conceptSlug\|slug, description? }` | network fail → error screen w/ Retry; empty → "No syllabus content yet" |

### Base URL / transport

- Base URL **hardcoded** `http://localhost:3000` in 8 axios call sites across 6 files: `login-page.tsx`, `register-page.tsx`, `onboarding-page.tsx`, `diagnostic-page.tsx` (×2), `profile-page.tsx` (×2), `syllabus/api/get-syllabus.ts`. No `import.meta.env` usage, no shared API client. **Mobile must introduce one config constant.**
- Tokens: `Authorization: Bearer <token>` header only. No cookies anywhere (no `document.cookie`, no `withCredentials`).
- **No refresh, no expiry handling, no 401 interceptor.** A dead token is only discovered when `GET /auth/me` fails (profile screen), which then clears the token.
- **CORS:** web app calls a different origin (5173 → 3000), so backend must currently allow CORS for the web dev origin. React Native is **not** subject to CORS — no backend change needed for mobile, but confirm the backend doesn't rely on an `Origin` check / cookie.
- Error body format: only confirmed field is `message` (used by register) [UNSURE for the rest].

---

## 3. AUTH FLOW

| Step | Behavior | Status |
|------|----------|--------|
| Signup | `POST /auth/register`, client-side validation, then `alert()` + stay on page; user must manually go to `/login`. **No token stored, no auto-login.** | done [INCOMPLETE flow] |
| Login | `POST /auth/login` → store `res.data.token` in `localStorage['token']` → **always navigate to `/onboarding`** (even for returning users) | done [INCOMPLETE routing] |
| Logout | **No logout button/route.** Token removed only as a side effect of `GET /auth/me` failing. | [INCOMPLETE] |
| Password reset / forgot password | Not implemented anywhere. | [INCOMPLETE] |
| Social login | "GitHub" / "Google" buttons rendered on login page with **no onClick handlers** (no backend endpoints referenced). | [INCOMPLETE] |
| Session persistence | `localStorage` key `token` (web); also `diagnostic_result`, `codelingo_profile` keys. | done |
| Route protection | **No `beforeLoad`/route guards exist.** Each page checks `localStorage.getItem('token')` itself and `navigate({to:'/login'})` if missing (`diagnostic-page.tsx`, `onboarding-page.tsx`, `profile-page.tsx`). Syllabus does **not** check the token server-side beyond sending it. | partial [INCOMPLETE] |
| Cross-screen data | Diagnostic result passed via TanStack Router **history `state`** with `localStorage['diagnostic_result']` as fallback. Startup path: `/` renders LoginPage; `/login`, `/register` separate. | done |

→ Mobile implications: replace `localStorage` with AsyncStorage/SecureStore; replace router history-state passing with navigation params + persisted result; build a real guard/middleware and a proper post-login route decision.

---

## 4. DATA MODELS (as the API exposes them)

| Entity | Fields | Relationships / notes |
|--------|--------|-----------------------|
| User | `name: string`, `email: string`, `language: string` (from `/auth/me`; more fields [UNSURE]) | Stores onboarding answers (`occupation`, `experienceLevel`, `language`) via `POST /me/onboarding` |
| Auth session | `token: string` (opaque to client; JWT [UNSURE]) | client-held only, no refresh |
| DiagnosticQuestion | `id: number`, `conceptSlug: string`, `difficulty: string`, `prompt: string`, `options: string[]` | grouped by `conceptSlug` in results |
| DiagnosticResult | `score`, `totalQuestions`, `percentage`, `level` (enum), `review: string`, `startingSyllabusLevel: {id,title}\|null`, `breakdown: Record<slug,{correct,total}>` | `startingSyllabusLevel.id` should match a Syllabus level `id`, but the UI matches by **title/name fuzzy string** (bug-risk) |
| DiagnosticResultAlt (profile view) | `score`, `scoreTotal`, `questionsAnswered`, `level`, `insight`, `concepts: [{name, score 0–5, status}]` | Same concept, second shape; likely from `/diagnostic/result` — exact mapping [UNSURE] |
| SyllabusLevel | `id`, `name/title/label`, `slug?`, `description?`, `order?`, `topics[]` | parent of topics |
| SyllabusTopic | `id`, `name/title/slug`, `blurb?/description?`, `icon?`, `order?`, `concepts[]`, (`levelId` client-derived) | child of level |
| SyllabusConcept | `id`, `name/title`, `description?`, `slug?/conceptSlug?`, `order?` | child of topic |
| Lesson / Progress / XP / Streak / QuizAttempt | **Not present in frontend code.** Endpoints for these are only in the build plan (`public/*.html`, tickets SYL-11…SYL-20). | [INCOMPLETE] |

---

## 5. FEATURES / SCREENS

| Name | Route | Purpose | API calls | Key UI | State/logic notes | Status |
|------|-------|---------|-----------|--------|-------------------|--------|
| Login | `/` and `/login` (both render LoginPage) | Email/password login | `POST /auth/login` | form, social buttons (dead), character image | stores token, always → `/onboarding` | partial [INCOMPLETE social + routing] |
| Register | `/register` | Create account | `POST /auth/register` | form + field errors | client validation (name/email required, pwd ≥ 8), `alert()` on success | partial [INCOMPLETE auto-login] |
| Onboarding | `/onboarding` | 7 steps: welcome, mascot messages, 3 question screens, "ready" screen | `POST /me/onboarding` (once, on last step) | step dots, option cards, "Coming soon" chips (Java/JS) | steps defined in `src/mocks/onboarding-data.ts` (**bundled, not from API**); Continue disabled until answered; final button submits then → `/diagnostic` | done |
| Diagnostic player | `/diagnostic` | 15-question one-at-a-time quiz | `GET /diagnostic/questions`, `POST /diagnostic/submit` | progress bar, radio options, Back/Next/Finish | all-answered required client-side; result saved to `localStorage['diagnostic_result']` + router state | done |
| Diagnostic results | `/diagnostic/results` | score, level badge, AI review, concept breakdown | none (reads passed state / localStorage) | score hero, review block, breakdown list, "Start Learning" → `/syllabus` | if no result → empty state screen | done |
| Syllabus browser | `/syllabus` | levels as tabs → topic list → concept detail | `GET /api/syllabus` | level tabs w/ ★ recommended, topic map, sidebar nav | recommended level matched by **normalized string compare** of diagnostic level vs level name/title/description/id; first topic auto-selected | partial — **START and START TOPIC buttons do nothing** [INCOMPLETE] |
| Profile | `/profile` | account info, diagnostic summary, skill radar | `GET /auth/me`, `GET /diagnostic/result` | sidebar, avatar initials, edit form, SVG radar (6 fixed axes), insight banner, breakdown dots, hardcoded `8 XP` badge | **edits save only to `localStorage['codelingo_profile']`, never PATCH the server** [INCOMPLETE]; XP badge hardcoded [INCOMPLETE]; redirects to `/login` if token invalid | partial |
| Lessons | — | — | — | — | — | **not started** |
| Exercises / practice quiz | — | — | — | — | — | **not started** (Batch Two ticket SYL-18) |
| Code editor / execution | — | — | — | — | — | **not started** — nothing exists |
| XP / streaks / hearts / leaderboard / achievements | — | — | — | `8 XP` hardcoded in profile topbar | backend endpoints only in Batch Two plan (`SYL-14 Progress, XP and streak endpoints`) | **not started** [INCOMPLETE] |
| Settings | — | — | — | — | — | **not started** |
| Sidebar nav (inside `/syllabus`, `/profile`) | — | Learn / Syllabus / Practice / Projects / Ranks / Profile | — | icon buttons | **all non-navigating decorative buttons** except Profile via `<a href>` | [INCOMPLETE] |
| `/tickets-dev` | internal-only dev page rendering static plan HTML in an **iframe** | dev tool, not a product screen | — | tabs | exclude from mobile | internal |

---

## 6. CORE BUSINESS LOGIC (where it lives)

| Rule | Location | Notes for mobile |
|------|----------|------------------|
| Diagnostic grading, score, %, level assignment, breakdown, starting level | **Backend** (`POST /diagnostic/submit`) | Just render the response |
| AI review text | **Backend** (`review` field) | Just render |
| "All questions answered" gate, answer selection, back/next | Frontend | Reimplement (trivial local state) |
| Diagnostic → syllabus recommended-level matching | **Frontend** (`syllabus-page.tsx`): lowercase/strip-punct compare against level `name\|title\|description\|id`, fallback to first level | Reimplement identically (or request backend return level `id` and use it — fragile today) |
| Register validation (required name/email, password ≥ 8 chars) | Frontend (`register-page.tsx`) | Reimplement; server rules [UNSURE] |
| Onboarding gating (continue disabled until choice; submit on final step; language options JAVA/JS "coming soon") | Frontend (`onboarding-page.tsx` + `mocks/onboarding-data.ts`) | Reimplement, copy step data |
| Profile diagnosis normalization (parse `"x/y"` scores, map status strings, clamp scores 0–5, fallback `scoreTotal=15`, 6 fixed radar axes with alias matching) | Frontend (`profile-page.tsx`) | Reimplement; brittle — depends on uncertain `/diagnostic/result` shape |
| Progress saving / lesson unlocking / XP / streak calculation | **Neither — does not exist yet** | [INCOMPLETE] planned as backend endpoints (Batch Two SYL-14) |
| Persistence of cross-screen data | Frontend `localStorage` keys: `token`, `diagnostic_result`, `codelingo_profile` | Replace with AsyncStorage/SecureStore |

---

## 7. CODE EXECUTION / EDITOR

- **Not applicable.** No Monaco, CodeMirror, iframe-based editor, WASM, sandboxes, or run-code endpoints anywhere in `src/`.
- Only iframe usage is the internal `/tickets-dev` page (`src/routes/tickets-dev.tsx`) embedding static HTML — dev tooling, do not port.

---

## 8. WEB-ONLY DEPENDENCIES (won't work as-is in RN)

| Dependency / API | Used for | RN replacement |
|------------------|----------|----------------|
| `react-dom`, `index.html` root | rendering | `react-native` App |
| `localStorage` (token, diagnostic_result, codelingo_profile) | auth + cached data | AsyncStorage / expo-secure-store |
| TanStack Router history `state` (`navigate({state})`) | passing diagnostic result, recommended level | navigation params + persisted result |
| `window.location.reload()` | Retry buttons (diagnostic, syllabus) | re-run the fetch |
| `alert()` | register success | Alert/Toast |
| `<a href="/login">` etc. | in-page links | navigation |
| `<img>` tags | character PNGs | `Image` with `require()` for bundled assets |
| Plain CSS files (`.css` per feature) + Tailwind v4 + CSS custom properties | styling | StyleSheet / nativewind; no CSS files |
| Inline `<svg>` (radar chart, nav icons) | profile radar, sidebar icons | `react-native-svg` |
| CSS gradients/backdrop visuals (`--bg`, radial gradients, glow shadows) | dark theme look | manual RN styling |
| `iframe` (`/tickets-dev`) | internal plan viewer | skip |
| `axios` | HTTP | ✅ works in RN (XHR adapter) — keep |
| DOM/A11y attributes (`aria-*`, `role`) | accessibility | map to `accessibilityProps` |

---

## 9. SHARED / REUSABLE CODE (copy as-is)

- `src/features/diagnostic/types.ts` — `DiagnosticSubmitResponse`, `DiagnosticLevel`, `DiagnosticBreakdown`.
- `src/features/syllabus/types.ts` — `SyllabusLevel/Topic/Concept`, `DiagnosticLikeResult`.
- `src/features/syllabus/api/get-syllabus.ts` — whole normalizer (`normalizeLevel/Topic/Concept`, `extractLevels`) is pure TS; only the axios call + `localStorage` token read need swapping.
- `src/features/profile/components/profile-page.tsx` — pure helpers: `normalizeDiagnosis`, `normalizeConceptStatus`, `getInitials`, `radarAxisOrder` (extract before porting; file is a component).
- `src/features/auth/components/register-page.tsx` — `validate()` (pure).
- `src/mocks/onboarding-data.ts` — full onboarding step/option definitions (pure data).
- Constants: `languageOptions`, `formatConceptLabel`, `formatLevelLabel`, `normalizeComparableValue`, `getTopicGlyph`.
- ⚠️ **Not reusable as-is:** duplicated hardcoded base URL — 8 call sites across 6 files (needs one shared API client), all fetch call sites (per-component axios calls).

---

## 10. DESIGN & CONTENT

- **Theme:** dark, defined by CSS vars in `src/index.css`: `--bg #09070f`, `--surface #0d0a14`, `--border #292335`, `--accent #8c4ff2`, `--accent-dark #7438d8`, `--text #aaa2bd`, `--text-strong #f7f4ff`. Purple gradient CTAs (`purple-500→600`).
- **Font:** `"Avenir Next", Avenir, "Segoe UI", sans-serif` — system fonts, **nothing bundled**; pick an RN default or license/bundle one.
- **Reusable UI patterns:** auth card (split copy + form), option card grid, progress bar + Back/Next footer, level tab strip + topic list/detail two-column, sidebar shell with icon nav, profile card grid, SVG radar, insight banner, mascot character with speech bubble.
- **Bundled assets:** character PNGs in `src/assets/characters/` (happy, hi, excited, confused, crying, sad, thinking, celebrating, strugling) + `src/assets/hero.png`. Copy into RN assets.
- **Content source:** diagnostic questions, AI review, syllabus levels/topics/concepts = **backend**. Onboarding copy/steps, radar axis labels, language option list, empty-state copy, nav labels = **frontend bundle**.

---

## 11. KNOWN GAPS

**Backend endpoints mobile will likely need (none exist in frontend usage):**
- `PATCH/PUT /me` (profile update — ticket SYL-17 explicitly says frontend should use it; not implemented) [INCOMPLETE]
- Lessons endpoint, practice-quiz endpoints, progress/XP/streak endpoints, "latest diagnostic result" endpoint [INCOMPLETE — planned Batch Two SYL-11…SYL-16]
- Logout/token revoke, refresh token, password reset, OAuth (GitHub/Google) start/verify endpoints [INCOMPLETE]
- Push notification registration, file upload, email templates — nothing [INCOMPLETE]

**Web-side tech debt affecting mobile:**
- Base URL hardcoded in 8 call sites across 6 files; no API client, no interceptors, no typed request layer.
- No token expiry/refresh handling; silent auth failures only surface on the profile screen.
- No centralized route guard; auth checks duplicated per screen; syllabus unprotected.
- Profile edits are localStorage-only (users lose them cross-device) — do **not** copy this behavior.
- Diagnostic result shape differs between `/diagnostic/submit` and `/diagnostic/result` consumers; `/diagnostic/result` handling is defensive guesswork [UNSURE real shape].
- Recommended-level matching by fuzzy string compare instead of `startingSyllabusLevel.id` (id is available but unused for matching) — bug-prone if backend titles change.
- Hardcoded `8 XP`; dead START buttons; decorative nav items; `alert()`/`console.log` for errors; `alert`-based register UX.
- No tests in repo (`detected_test_files: 0`).

---

## Questions the mobile developer should clarify before starting

1. Production base URL(s) (and env-injection strategy) — is `localhost:3000` only a dev target? Staging/prod?
2. Exact wire formats for `/auth/register`, `/auth/me`, `/me/onboarding`, and `/diagnostic/result` (the frontend guesses at all four)?
3. Token format/expiry: JWT or opaque? Is a refresh token planned? What should mobile do on 401?
4. Should users always land on `/onboarding` after login, or is that a dev-time shortcut? Is onboarding/diagnostic completion stored server-side so we can skip it for returning users?
5. Does the backend rely on CORS/cookies (`Set-Cookie`) for anything beyond the `Authorization` header?
6. Backend ownership of XP/streak/progress/lesson/quiz endpoints — timeline, and who owns the contract?
7. Where should profile updates go (`PATCH /me`?) and which fields are editable server-side?
8. Social login (GitHub/Google) — planned? Native OAuth flow or web-based?
9. Should the recommended-level match use `startingSyllabusLevel.id` instead of title matching (is `id` guaranteed to equal a syllabus level id)?
10. Which languages are actually supported (onboarding offers Python only; profile dropdown offers 6)?
11. Android/iOS targets, minimum OS versions, and whether one codebase (Expo vs bare RN) is assumed.
12. Offline behavior: is any caching/offline progress expected, given progress endpoints don't exist yet?
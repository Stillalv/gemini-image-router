# AGENTS.md - Gemini Image Router Engineering Standards

This document establishes the architecture principles, code quality guidelines, backend security standards, anti-monolith regulations, testing requirements, commit conventions, and automation invariants for all AI agents and contributors working on this codebase.

---

## 1. Core Architecture & Tech Stack

- **Runtime**: [Bun](https://bun.sh) (1.4+)
- **Framework**: [SvelteKit](https://kit.svelte.dev) (Full-stack TypeScript)
- **UI & Components**: Svelte 5 (Runes: `$state`, `$derived`, `$props`, `$effect`) with [`lucide-svelte`](https://lucide.dev) icons (Zero external emoji icons)
- **Database & Persistence**: MongoDB Atlas via official `mongodb` client with indexed collections (`users`, `plans`, `daily_usages`, `usage_logs`, `sessions`, `messages`)
- **Automation Engine**: Playwright (Persistent context on Chrome profile with warm tab pooling)
- **Styling**: Modern dark theme with CSS custom properties & utility classes (Tailwind CSS v4)

---

## 2. Directory Structure & Separation of Concerns

```
src/
├── app.html                       # HTML shell template
├── app.d.ts                       # Global SvelteKit ambient type definitions
├── app.css                        # Global tokens, 60fps transitions & liquid gold styles
├── lib/
│   ├── components/                # Modular Svelte UI components (< 300 LOC per component)
│   ├── i18n/                      # Internationalization dictionaries (id.json & en.json)
│   ├── stores/                    # Client reactive stores (account, theme, etc.)
│   ├── types/                     # Shared TypeScript interfaces & schemas
│   └── server/                    # Server-only logic (Database, Browser, Automation, Security)
│       ├── db/                    # MongoDB Atlas connection & Data Repositories
│       ├── browser/               # Playwright persistent browser manager & tab pool
│       ├── gemini/                # Gemini Web workflows (Generator, Editor, Mode-Switcher, Extractor)
│       └── security/              # Auth, Validators, Quota Guard, Path Traversal Defense
└── routes/
    ├── +layout.svelte             # Root layout with view transitions
    ├── +page.svelte               # Main chat workspace & generation canvas
    ├── output/[...file]/+server.ts# Secure static image serving endpoint
    └── api/                       # REST API endpoints
        ├── generate/+server.ts    # POST /api/generate (Text-to-Image)
        ├── edit/+server.ts        # POST /api/edit (Image-to-Image with attachment)
        ├── sessions/              # CRUD /api/sessions & /api/sessions/[id]
        ├── auth/                  # Authentication endpoints (login, register, logout, me)
        ├── account/               # Account management endpoints (plan, keys, usage)
        ├── status/+server.ts      # GET /api/status (Worker pool health)
        └── docs/+server.ts        # GET /api/docs (OpenAPI specs)
```

---

## 3. Anti-Monolith & Modular Component Standards

To prevent code bloat, maintainability bottlenecks, and architectural decay, all components and modules MUST follow these strict decomposition rules:

1. **Component Line Limit (< 300 Lines Rule)**:
   - UI components should focus on a single responsibility.
   - Large modals or complex views containing multiple sub-features (e.g. Account Modal with auth forms, API key manager, and plan selector) MUST be decomposed into modular sub-components under `src/lib/components/`.
2. **Decoupled Business Logic**:
   - UI components MUST NOT execute raw database operations or browser automation directly.
   - All server operations flow strictly through standard SvelteKit API endpoints (`/api/*`).
   - Shared client logic resides in dedicated stores (`$lib/stores/`) or helper utilities.
3. **Svelte 5 Runes Invariants**:
   - Always use Svelte 5 runes (`$state`, `$derived`, `$props`, `$effect`) for local component state.
   - Avoid mixing legacy Svelte 4 `export let` or `$: reactive` statements in new code.
   - Use `$derived` for computed values to eliminate unnecessary reactive loops.

---

## 4. Backend Security Standards

1. **Path Traversal Protection**:
   - File serving from `output/` or `data/` MUST validate resolved absolute paths against designated root directories using `getSafeFilePath()`.
2. **Payload Size & MIME Validation**:
   - Ingested Base64 images are capped at 50MB.
   - Enforce image MIME types (`image/png`, `image/jpeg`, `image/webp`).
3. **Prompt Sanitization**:
   - Input strings must be trimmed, bounded by length limits (max 2000 chars), and stripped of non-printable control characters via Zod schemas.
4. **Error Masking**:
   - Internal stack traces and browser context details must not leak to client API responses. Provide clean, standardized error messages.

---

## 5. Code Quality & TypeScript Rules

- **100% Strict TypeScript**: No implicit `any`, no untyped objects in server handlers or stores.
- **Async Safety**: Every browser interaction must be wrapped with timeouts and error recovery handlers.
- **Resource Cleanup**:
   - Every acquired browser page from the pool MUST be released in a `finally` block.
   - Temporary upload files must be deleted immediately in `finally` blocks after completion or failure.

---

## 6. Gemini Automation Invariants

1. **Canvas-based Extraction**:
   - Never use `fetch()` on `blob:` URLs in page context due to CSP. Always extract images by rendering onto an in-memory `<canvas>` element and extracting via `canvas.toDataURL("image/png")` or intercepting live Google CDN network streams (`lh3.googleusercontent.com`).
2. **Overlay Prevention**:
   - Always dispatch `Escape` before interacting with the prompt box to dismiss any Material CDK backdrop overlays.
3. **Response Image vs Input Thumbnail**:
   - Never extract images located inside `.input-area`, `rich-textarea`, or having `alt="Pratinjau..."`. Only extract from model response containers.
4. **State Isolation**:
   - Clean navigation to `https://gemini.google.com/app` before each task to ensure zero cross-conversation pollution.

---

## 7. Frontend Theming & Standard Color System

All UI components MUST adhere strictly to the dual-mode semantic color palette. Never hardcode absolute hex values in component templates without dark mode variants.

### Semantic Color Token Matrix

| Semantic Token | Light Mode Value | Dark Mode Value (`html.dark`) | Usage Context |
| :--- | :--- | :--- | :--- |
| `--bg-app` | `#ffffff` | `#0f0f10` | Main application background |
| `--bg-sidebar` | `#fafafa` | `#141416` | Collapsible sidebar background |
| `--bg-surface` | `#f4f4f5` | `#202022` | Modal cards & elevated panels |
| `--bg-card` | `#ffffff` | `#18181a` | Chat bubbles & image cards |
| `--bg-input` | `#f9fafb` | `#1f1f22` | Textarea & active input controls |
| `--border-subtle` | `#e5e7eb` | `#27272a` | Dividers & light card borders |
| `--border-strong` | `#d1d5db` | `#3f3f46` | Focus rings & active tabs |
| `--text-primary` | `#111827` | `#f4f4f5` | Headings & main body text |
| `--text-secondary` | `#6b7280` | `#a1a1aa` | Subtitles & helper metadata |
| `--text-muted` | `#9ca3af` | `#71717a` | Timestamps & inactive icons |
| `--accent-primary` | `#18181b` | `#ffffff` | Primary CTA buttons |
| `--accent-gold` | `#f59e0b` | `#fbbf24` | Highlights, badges & active states |

---

## 8. Internationalization (i18n) Architecture

1. **Zero Hardcoded Frontend Text**:
   - All user-facing strings (labels, tooltips, dialogs, button texts, status messages) MUST reside in structured JSON dictionary files (`src/lib/i18n/id.json` and `src/lib/i18n/en.json`).
2. **Reactive Store Integration**:
   - Consume translations exclusively via `$t('namespace.key')` from `$lib/i18n`.
3. **Locale Persistence**:
   - User selected locale is persisted in `localStorage('gemini_locale')` and synced to `document.documentElement.lang`.

---

## 9. Testing & Quality Assurance Standards

1. **Automated Typechecking**:
   - Run `bun run check` before concluding tasks to ensure 0 TypeScript / Svelte compiler errors.
2. **Unit & API Testing**:
   - Core server utilities (validators, path-guard, quota-guard, auth helpers) should have accompanying test suites runnable via `bun test`.
3. **Failure State Verification**:
   - Verify error responses return standardized `{ ok: false, error: string }` JSON structures with appropriate HTTP status codes (400, 401, 403, 404, 500).
4. **Browser Isolation Tests**:
   - Automation workflows must be tested against network dropouts, Google login expiry, and unexpected DOM modal changes.

---

## 10. Git Commit Standards & Mandatory Local Commits

1. **Mandatory Local Commits**:
   - Every task, bug fix, feature addition, or refactoring MUST be committed locally (`git add` and `git commit`) once code changes and quality tests (`bun test`, `bun run check`) pass.
   - Do not leave untracked or unstaged working tree changes after completing a task.

2. **Conventional Commits**:
   All commits MUST follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
   - `feat:` A new feature for the user or API consumer
   - `fix:` A bug fix in frontend, backend, or automation
   - `refactor:` Code refactoring with zero change in external behavior (e.g. modular decomposition)
   - `perf:` Performance optimizations
   - `docs:` Documentation updates (`README.md`, `AGENTS.md`, OpenAPI specs)
   - `style:` Formatting or CSS styling changes that do not affect code logic
   - `test:` Adding or updating tests
   - `chore:` Dependency updates, tooling, or build configuration changes

   Format: `<type>(<optional scope>): <short description in imperative mood>`  
   Example: `feat(models): add tiered quota multiplier and model selector popover`

---

## 11. STRICT GIT PUSH SAFETY INVARIANT (CRITICAL)

> [!CAUTION]
> ### 🚫 ABSOLUTE RULE: DO NOT PUSH TO REMOTE REPOSITORIES
> **AI Agents and automated tooling are STRICTLY FORBIDDEN from executing `git push` or pushing commits/branches to any remote repository (e.g. GitHub, GitLab, origin) unless the USER EXPLICITLY AND SPECIFICALLY INSTRUCTS A PUSH COMMAND.**
>
> 1. Local staging (`git add`) and local commits (`git commit`) are REQUIRED for every completed change.
> 2. `git push` MUST NEVER be run autonomously.
> 3. Always request explicit confirmation before performing any remote push operations.


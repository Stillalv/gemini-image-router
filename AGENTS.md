# AGENTS.md - Gemini Image Router Engineering Standards

This document establishes the architecture principles, code quality guidelines, backend security standards, and automation invariants for all AI agents and contributors working on this codebase.

---

## 1. Core Architecture & Tech Stack

- **Runtime**: [Bun](https://bun.sh) (1.4+)
- **Framework**: [SvelteKit](https://kit.svelte.dev) (Full-stack TypeScript)
- **UI & Components**: Svelte 5 with [`lucide-svelte`](https://lucide.dev) icons (Zero external emoji icons)
- **Database**: SQLite via `bun:sqlite` for zero-overhead persistence
- **Automation**: Playwright (Persistent context on Chrome profile)
- **Styling**: Modern dark theme with CSS custom properties & utility classes

---

## 2. Directory Structure & Separation of Concerns

```
src/
├── app.html                       # HTML shell template
├── app.d.ts                       # Global SvelteKit ambient type definitions
├── lib/
│   ├── components/                # Modular Svelte UI components
│   ├── types/                     # Shared TypeScript interfaces & schemas
│   └── server/                    # Server-only logic (Database, Browser, Gemini Automation, Security)
│       ├── db/                    # SQLite database & data repository
│       ├── browser/               # Playwright browser manager & tab pool
│       ├── gemini/                # Gemini Web automation workflows (Generator & Editor)
│       └── security/              # Request validators, path traversal defense, sanitizers
└── routes/
    ├── +layout.svelte             # Root layout with sidebar navigation & global modals
    ├── +page.svelte               # Main chat workspace & generation canvas
    ├── output/[...file]/+server.ts# Secure static image serving endpoint
    └── api/                       # REST API endpoints
        ├── generate/+server.ts    # POST /api/generate (Text-to-Image)
        ├── edit/+server.ts        # POST /api/edit (Image-to-Image with attachment)
        ├── sessions/              # CRUD /api/sessions
        ├── status/+server.ts      # GET /api/status (Worker pool health)
        └── docs/+server.ts        # GET /api/docs (OpenAPI specs)
```

---

## 3. Backend Security Standards

1. **Path Traversal Protection**:
   - File serving from `output/` or `data/` MUST validate resolved absolute paths against the designated root directory.
2. **Payload Size & MIME Validation**:
   - Ingested Base64 images are capped at 50MB.
   - Enforce image MIME types (`image/png`, `image/jpeg`, `image/webp`).
3. **Prompt Sanitization**:
   - Input strings must be trimmed and stripped of non-printable control characters.
4. **Error Masking**:
   - Internal stack traces and browser context details must not leak to the API response. Provide clean, standardized error objects.

---

## 4. Code Quality & TypeScript Rules

- **100% Strict TypeScript**: No implicit `any`, no untyped objects in server handlers.
- **Async Safety**: Every browser interaction must be wrapped with timeouts and error recovery handlers.
- **Resource Cleanup**:
   - Every acquired browser page from the pool MUST be released in a `finally` block.
   - Temporary upload files must be deleted immediately after completion or failure.

---

## 5. Gemini Automation Invariants

1. **Canvas-based Extraction**:
   - Never use `fetch()` on `blob:` URLs in page context due to CSP. Always extract images by rendering onto an in-memory `<canvas>` element and extracting via `canvas.toDataURL("image/png")` or intercepting live Google CDN network streams (`lh3.googleusercontent.com`).
2. **Overlay Prevention**:
   - Always dispatch `Escape` before interacting with the prompt box to dismiss any Material CDK backdrop overlays.
3. **Response Image vs Input Thumbnail**:
   - Never extract images located inside `.input-area`, `rich-textarea`, or having `alt="Pratinjau..."`. Only extract from model response containers.
4. **State Isolation**:
   - Clean navigation to `https://gemini.google.com/app` before each task to ensure zero cross-conversation pollution.

---

## 6. Frontend Theming & Standard Color System

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

## 7. Internationalization (i18n) Architecture

1. **Zero Hardcoded Frontend Text**:
   - All user-facing strings (labels, tooltips, dialogs, status text) must reside in structured JSON dictionary files (`src/lib/i18n/id.json` and `src/lib/i18n/en.json`).
2. **Reactive Store Integration**:
   - Consume translations exclusively via `$t('namespace.key')` from `$lib/i18n`.
3. **Locale Persistence**:
   - User selected locale is persisted in `localStorage('gemini_locale')` and synced to `document.documentElement.lang`.


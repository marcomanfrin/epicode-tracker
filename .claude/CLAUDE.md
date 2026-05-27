# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # devcl server on http://localhost:5173
npm run build        # production build
npm run lint         # ESLint
npm run test         # vitest run (single pass)
npm run test:watch   # vitest interactive watch
npx tsc --noEmit     # type-check without emitting
```

No test filtering flag is needed — Vitest picks up all `*.test.ts` files under `src/test/`.

## Architecture

**Stack**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Supabase (auth + DB + realtime).

### Routing (`src/App.tsx`)

Four protected routes wrapped in `<Protected>` (redirects to `/auth` if unauthenticated):

- `/` → `Index` — course tracker dashboard
- `/calendar` → `Calendar` — personal calendar with annotations
- `/share/:token` → `Shared` — public read-only view (no auth required)
- `/reset-password` — unauthenticated

### Data layer (`src/integrations/supabase/`)

- `client.ts` — typed Supabase client; always import from here: `import { supabase } from "@/integrations/supabase/client"`
- `types.ts` — auto-generated DB types; **do not edit manually**

**DB tables**: `courses`, `calendar_entries`, `calendar_todos`, `share_tokens`.  
**RPC functions**: `get_shared_courses(_token)` and `get_shared_calendar(_token)` serve the public share view without auth.

### Key cross-page exports

`courseColor()` is exported from `src/pages/Index.tsx` and imported by `Calendar.tsx`, `Shared.tsx`, and `AppNavbar.tsx`. It resolves a course's display color from its `color` field or a positional palette fallback.

### Context providers (`src/hooks/`)

- `useAuth` — exposes `{ user, session, loading, signOut }`. `AuthProvider` must be inside `BrowserRouter` because it uses router context indirectly via Supabase auth listeners.
- `useTheme` — exposes `{ mode, setMode, resolved }`. Persists to `localStorage` under key `theme-mode`. Toggles `dark` class on `<html>`.

### Navigation (`src/components/AppNavbar.tsx`)

Sticky top navbar shared between `Index` and `Calendar`. Accepts an `actions` ReactNode slot for page-specific buttons (share, logout). `ThemeToggle` is always included inside `AppNavbar` — do not add it separately to pages that use it.

### Design system (`src/index.css`)

Editorial aesthetic: serif headings (DM Serif Display), mono body numbers (JetBrains Mono), sans prose (Inter). Key utility classes:

- `.container-editorial` — max-width 1200px with fluid horizontal padding
- `.hairline` — full-contrast `border-t` divider
- `.label-meta` — mono, uppercase, small-tracked, muted

CSS variables use HSL without the `hsl()` wrapper so they can be composed: `hsl(var(--primary) / 0.5)`. Custom vars beyond shadcn defaults: `--surface-dark`, `--surface-dark-foreground`, `--border-soft`, `--chart-fatto`, `--chart-caricato`.

### Realtime

`Index.tsx` subscribes to a Supabase realtime channel on the `courses` table and re-fetches on any change. Unsubscribe happens in the `useEffect` cleanup. Calendar does not use realtime — it fetches on range change.

### Environment variables

Required in `.env`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

## graphify

- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.

### project

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:

- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

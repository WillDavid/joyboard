# JoyBoard — Project Context for AI Agents

## Overview
**JoyBoard** (codename "Nuvem de Projetos") is a collaborative visual project management web app with a **retro terminal/CRT aesthetic**. Users create projects (called "módulos") and organize tasks visually on an infinite canvas with drag-and-drop, connection lines, real-time sync, and multiple views (visual graph, list, kanban).

The entire UI uses a dark blue color scheme (`#04152A`), monospace fonts (IBM Plex Mono), CRT scanline overlays, and bracket-style UI elements `[ LIKE THIS ]`.

---

## Stack
| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Build | Vite 8 |
| Language | TypeScript 6 |
| State | Pinia (3 stores) |
| Router | Vue Router 5 |
| Canvas Graph | @vue-flow/core + @vue-flow/background + @vue-flow/controls |
| Backend | Supabase (PostgreSQL + Realtime + Storage) |
| Styling | Pure CSS with CSS Variables (no framework) |
| Fonts | IBM Plex Sans + IBM Plex Mono (Google Fonts) |
| Auth | Custom password-based login via `users` table (no Supabase Auth) |

---

## Project Structure
```
JoyBoard/
├── src/
│   ├── assets/styles/
│   │   ├── variables.css          # CSS custom properties (colors, spacing, fonts, z-index)
│   │   ├── main.css               # Global styles, CRT effects, utility classes
│   │   └── animations.css         # Keyframe animations (pulse, fade, slide)
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginScreen.vue    # Terminal-style login with password code
│   │   │   └── UserFormModal.vue  # Create new operators (users)
│   │   ├── layout/
│   │   │   └── AppTopbar.vue      # Top bar with project name, progress, view switcher
│   │   ├── project/
│   │   │   ├── ProjectList.vue    # List of projects on home page
│   │   │   └── ProjectFormModal.vue # Create/edit project + delete with auth code
│   │   └── task/
│   │       ├── TaskCard.vue       # Node card on the VueFlow canvas
│   │       ├── TaskDetailModal.vue # Side panel for task CRUD (parent tasks)
│   │       ├── SubtaskDetailModal.vue # Side panel for subtasks
│   │       ├── ListView.vue       # Table view with expandable subtrees
│   │       └── KanbanView.vue     # Kanban board with drag-drop columns
│   ├── composables/
│   │   ├── useRealtime.ts         # Supabase Realtime subscriptions (tasks, connections)
│   │   ├── useClock.ts            # Live clock for the terminal UI
│   │   └── useActivityLog.ts      # Local activity logging to localStorage
│   ├── pages/
│   │   ├── HomePage.vue           # Login/landing page (route: /)
│   │   ├── ProjectsPage.vue       # Project selection terminal (route: /home)
│   │   └── ProjectPage.vue        # Main canvas/project page (route: /project/:slug)
│   ├── router/
│   │   └── index.ts               # Routes: /, /home, /project/:slug
│   ├── services/
│   │   └── supabase.ts            # Supabase client + all TypeScript interfaces
│   ├── stores/
│   │   ├── auth.ts                # Auth state (users, login/logout, session restore)
│   │   ├── project.ts             # Project CRUD + current project selection
│   │   ├── task.ts                # Task/comment/connection/image CRUD + undo + realtime handlers
│   │   ├── user.ts                # Anonymous user ID (UUID in localStorage)
│   │   └── ui.ts                  # UI state (modal, viewport, view mode, connection mode)
│   ├── utils/
│   │   └── security.ts            # sanitize(), slugify(), hashPassword(), validators
│   ├── App.vue                    # Root: router-view + fetch projects on mount
│   └── main.ts                    # Entry: createApp + Pinia + Router + global CSS
├── supabase-setup.sql             # Full DB schema + seed data + RLS policies
├── SPEC.md                        # Complete design specification
├── .env.example                   # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
├── vite.config.ts                 # Vite config (Vue plugin only)
```

---

## Routes
| Path | Page | Purpose |
|------|------|---------|
| `/` | `HomePage.vue` | Login screen with password code |
| `/home` | `ProjectsPage.vue` | Terminal-style project browser |
| `/project/:slug` | `ProjectPage.vue` | Canvas / List / Kanban views |

---

## Auth System (Custom)
- No Supabase Auth — uses a `users` table with plain-text passwords
- Login: enter password code → `authStore.login(code)`
- Session saved to `localStorage` key `joyboard_session` (30-day expiry)
- Session restored on page load — auto-redirects to `/home`
- Users have: `username`, `password`, `role`, `sigla` (abbreviation like "DNP", "L&R")

## Database Tables (Supabase)
1. **users** — id, username, password, role, sigla, created_at
2. **projects** — id, name, slug (unique), description, color, created_at, updated_at
3. **tasks** — id, project_id (FK), parent_id (FK self, for subtasks), title, description, status (criado/fazendo/pronto/impedido), priority (low/medium/high), position_x/y, due_date, responsavel_1_id (FK users), responsavel_2_id (FK users), data_inicio, data_fim_prevista, data_finalizacao, created_at, updated_at
4. **comments** — id, task_id (FK), content, user_id, created_at
5. **reactions** — id, task_id (FK), emoji, user_id, created_at
6. **connections** — id, project_id (FK), from_task_id (FK), to_task_id (FK), created_at
7. **task_images** — id, task_id (FK), url, created_at (stored in Supabase Storage bucket `task-images`)

### Status Flow
- ☁️ **criado** (Created) → 🌈 **fazendo** (In Progress) → ✨ **pronto** (Done)
- 🌧️ **impedido** (Blocked) — can come from any status
- Auto-logic: `data_inicio` set when first moved to `fazendo`, `data_finalizacao` set when moved to `pronto`, cascade `impedido` to connected successors

## Real-time Subscriptions
- Tasks table: INSERT/UPDATE/DELETE filtered by `project_id`
- Connections table: INSERT/DELETE filtered by `project_id`
- Handled in `useRealtime.ts` composable, processed by `taskStore.handleRealtimeTask()` and `taskStore.handleRealtimeConnection()`

## View Modes (3 views)
- **visual** (PAINEL) — VueFlow canvas with draggable nodes, zoom (0.5x–2x), snap-to-grid (24px), smoothstep connection edges
- **list** (LISTA) — Table with expandable subtask rows, columns for title/desc/status/priority/responsible/dates/links
- **kanban** (KANBAN) — 4-column board (criado/fazendo/pronto/impedido) with HTML5 drag-and-drop

## Key Behaviors
- **Undo**: Ctrl+Z undoes last task create/delete/move via stacked undo functions (max 30)
- **Overdue check**: Runs every 30s — auto-sets tasks past `data_fim_prevista` to `impedido`
- **Connection mode**: Click [LINK] on a card, then click another card to create a directed edge
- **Delete project**: requires secret auth code `@Daito#36158809` (hardcoded in `ProjectFormModal.vue`)
- **Activity log**: Stored in `localStorage` key `joyboard_activities` (last 100 entries)

## CSS Architecture
- All styling via CSS custom properties in `variables.css`
- Dark terminal theme: `#04152A` base, `#D6ECFA` text, `#4A8DB8` blue accent
- CRT effects: scanline overlay (`#app::after`), vignette (`#app::before`)
- Monospace font everywhere, bracket-style buttons, thin scrollbars
- Status colors: criado=gray, fazendo=blue, pronto=green, impedido=red

## Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

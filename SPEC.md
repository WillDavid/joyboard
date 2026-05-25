# Nuvem de Projetos - Specification Document

## 1. Project Overview

- **Project Name**: Nuvem de Projetos
- **Type**: Collaborative Visual Project Management Web Application
- **Core Functionality**: A real-time canvas-based task management system where users create projects and organize tasks visually through drag-and-drop, connections, and real-time collaboration
- **Target Users**: Teams and individuals looking for a fun, engaging way to manage projects

---

## 2. UI/UX Specification

### Layout Structure

**Page Sections**:
- Topbar (fixed, 56px height)
- Main Canvas (infinite, scrollable)
- Floating Action Buttons
- Task Detail Modal (overlay)

**Grid/Flex Layout**:
- Canvas uses absolute positioning for tasks
- Flexbox for topbar and modals

**Responsive Breakpoints**:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Visual Design

**Color Palette**:
```css
--color-bg-primary: #FFF5F8;
--color-bg-secondary: #FFE4EC;
--color-bg-canvas: #FDF2F7;
--color-pink-light: #FFB8D4;
--color-pink: #FF8FB1;
--color-pink-dark: #FF6B9D;
--color-rainbow-1: #FFB8D4;
--color-rainbow-2: #FFD4A3;
--color-rainbow-3: #FFF4B8;
--color-rainbow-4: #B8FFD4;
--color-rainbow-5: #B8D4FF;
--color-rainbow-6: #D4B8FF;
--color-cloud-white: #FFFFFF;
--color-cloud-shadow: #E8D4DC;
--color-text-primary: #5A3D4D;
--color-text-secondary: #8B6B7A;
--color-text-muted: #B8A0AA;
--color-success: #7DD3A8;
--color-warning: #FFD4A3;
--color-danger: #FFB8B8;
--color-info: #B8D4FF;
```

**Status Colors**:
```css
--status-criado: #B8D4FF;
--status-fazendo: #FFF4B8;
--status-pronto: #B8FFD4;
--status-impedido: #FFB8D4;
```

**Typography**:
- Font Family: 'Nunito', sans-serif (primary)
- Headings: 700 weight
- Body: 400/600 weight
- Font sizes:
  - h1: 28px
  - h2: 22px
  - h3: 18px
  - body: 14px
  - small: 12px

**Spacing System**:
- Base unit: 4px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, xxl: 48px

**Visual Effects**:
- Card shadows: `0 4px 12px rgba(255, 143, 177, 0.15)`
- Hover shadows: `0 8px 24px rgba(255, 143, 177, 0.25)`
- Border radius: 12px (cards), 8px (buttons), 16px (modals)
- Glassmorphism on topbar: `backdrop-filter: blur(12px)`

### Components

**Topbar**:
- Logo with cloud icon
- Project selector dropdown
- User presence indicators (colored dots)
- New Project button

**Canvas**:
- Infinite scroll with zoom (50% - 200%)
- Grid background (subtle dots pattern)
- Cloud decorations in background
- Zoom controls (floating)

**Task Cards**:
- Dimensions: min 200px width, auto height
- Status indicator stripe on left
- Drag handle on hover
- Quick action buttons (edit, delete, comment)
- Priority indicator (colored dot)
- Emoji reactions row

**Connection Lines**:
- Curved bezier paths
- Animated dash on hover
- Delete button on click

**Task Detail Modal**:
- Full task information
- Comments section with real-time updates
- Status dropdown
- Priority selector
- Due date picker
- Attachments area
- Connection management

**Floating Elements**:
- Add Task button (bottom right)
- Zoom controls
- Mini-map (optional)

### Animations

**Micro-interactions**:
- Card hover: subtle lift (transform: translateY(-2px))
- Button press: scale(0.95) -> scale(1)
- Card drag: slight rotation (max 2deg)

**Transitions**:
- All transitions: 200ms ease-out
- Modal: fade + scale
- Card appear: fade + slide up

**Special Effects**:
- Task completion: confetti burst (CSS only)
- Status change: rainbow shimmer
- New task: cloud poof animation
- Connection: pulse animation

---

## 3. Functionality Specification

### Core Features

**Projects**:
- Create project (name, description, color theme)
- Edit project details
- Delete project (with confirmation)
- Project list in topbar

**Tasks**:
- Create task (title, description, priority, due date)
- Edit task (all fields)
- Delete task (with confirmation)
- Move task (drag and drop on canvas)
- Change status (dropdown)
- Add/remove emojis (reactions)
- Add comments (real-time)
- Manage connections

**Status Flow**:
- ☁️ criado (Created)
- 🌈 fazendo (In Progress)
- ✨ pronto (Done)
- 🌧️ impedido (Blocked)

**Connections**:
- Create connection between two tasks
- Visual line representation
- Delete connection
- Connections stored as relations

**Real-time**:
- Task position sync
- Status changes sync
- New task creation sync
- Comments sync
- Reactions sync
- Presence (online users)

**Activity Log**:
- Track all actions with timestamp
- Store in localStorage initially
- Include: create, move, delete, status change, comment

### User Interactions

**Drag and Drop**:
- Click and hold card to start drag
- Visual feedback during drag (shadow, scale)
- Drop anywhere on canvas
- Real-time position broadcast

**Canvas Navigation**:
- Pan: click and drag on empty canvas
- Zoom: scroll wheel or buttons
- Double-click to create task at position

**Quick Actions**:
- Right-click on card for context menu
- Keyboard shortcuts (Ctrl+N for new task, etc.)

### Data Handling

**Supabase Tables**:
1. `projects` - id, name, description, color, created_at, updated_at
2. `tasks` - id, project_id, title, description, status, priority, position_x, position_y, due_date, created_at, updated_at
3. `comments` - id, task_id, content, user_id, created_at
4. `reactions` - id, task_id, emoji, user_id, created_at
5. `connections` - id, project_id, from_task_id, to_task_id, created_at

**Local State** (Pinia):
- Current user ID (generated UUID, stored in localStorage)
- Canvas viewport (pan, zoom)
- UI state (modals, selected task)

### Edge Cases

- Handle offline mode gracefully
- Conflict resolution for simultaneous edits
- Empty project state (show onboarding)
- Large number of tasks (virtualization if needed)

---

## 4. Acceptance Criteria

### Visual Checkpoints

- [ ] Topbar displays with glassmorphism effect
- [ ] Canvas has subtle dot grid background
- [ ] Cards have rounded corners and pink shadows
- [ ] Status colors match specification
- [ ] Animations are smooth (60fps)
- [ ] Responsive on all breakpoints
- [ ] Cloud decorations visible in background

### Functional Checkpoints

- [ ] Can create new project
- [ ] Can create tasks on canvas
- [ ] Can drag and drop tasks
- [ ] Task positions persist in database
- [ ] Real-time sync works between tabs/users
- [ ] Status changes reflect immediately
- [ ] Comments appear in real-time
- [ ] Can add emoji reactions
- [ ] Can create connections between tasks
- [ ] Zoom and pan work smoothly

### Technical Checkpoints

- [ ] Project builds without errors
- [ ] No console errors on load
- [ ] Supabase connection works
- [ ] Realtime subscriptions active
- [ ] Performance acceptable (no lag on drag)

---

## 5. Technical Stack

- **Framework**: Vue 3 (Composition API)
- **Build**: Vite
- **State**: Pinia
- **Canvas**: @vue-flow/core + @vue-flow/background + @vue-flow/controls
- **Backend**: Supabase (PostgreSQL, Realtime, Storage)
- **Styling**: Pure CSS with CSS Variables
- **Fonts**: Google Fonts (Nunito)

---

## 6. Project Structure

```
src/
├── assets/
│   └── styles/
│       ├── main.css
│       ├── variables.css
│       └── animations.css
├── components/
│   ├── layout/
│   │   ├── AppTopbar.vue
│   │   └── AppCanvas.vue
│   ├── task/
│   │   ├── TaskCard.vue
│   │   ├── TaskDetailModal.vue
│   │   └── TaskForm.vue
│   ├── connection/
│   │   └── ConnectionLine.vue
│   ├── ui/
│   │   ├── FloatingButton.vue
│   │   ├── StatusBadge.vue
│   │   └── EmojiPicker.vue
│   └── project/
│       ├── ProjectList.vue
│       └── ProjectForm.vue
├── composables/
│   ├── useRealtime.ts
│   ├── useDragAndDrop.ts
│   └── useActivityLog.ts
├── services/
│   └── supabase.ts
├── stores/
│   ├── project.ts
│   ├── task.ts
│   ├── user.ts
│   └── ui.ts
├── router/
│   └── index.ts
├── pages/
│   ├── HomePage.vue
│   └── ProjectPage.vue
├── App.vue
└── main.ts
```
<template>
  <div class="my-page" :class="`view-${uiStore.currentView}`">
    <header class="my-header">
      <div class="my-header-left">
        <router-link to="/home" class="my-back">
          <span class="my-back-arrow">←</span>
          <span class="my-back-text">VOLTAR</span>
        </router-link>
        <span class="my-sep">|</span>
        <span class="my-title">PASTA PESSOAL</span>
        <span class="my-subtitle">// MINHAS ATIVIDADES</span>
      </div>
      <div class="my-header-right">
        <span class="my-count">{{ filteredTasks.length }}/{{ myTasks.length }} ATIVIDADES</span>
        <span class="my-sep">|</span>
        <div class="my-view-group">
          <button
            v-for="v in views"
            :key="v.key"
            class="my-view-btn"
            :class="{ active: uiStore.currentView === v.key }"
            @click="uiStore.setView(v.key)"
          >
            [ {{ v.label }} ]
          </button>
          <span class="view-sep"></span>
          <button class="my-view-btn sair" @click="logout">[ SAIR ]</button>
        </div>
      </div>
    </header>

    <div class="filter-bar">
      <div class="filter-row">
        <div class="filter-search">
          <span class="filter-icon">🔍</span>
          <input
            v-model="searchText"
            class="filter-input"
            placeholder="BUSCAR ATIVIDADE..."
          />
        </div>

        <div class="filter-group">
          <button
            v-for="s in filterStatuses"
            :key="s.value"
            class="filter-chip"
            :class="{ active: filterStatus === s.value }"
            @click="filterStatus = s.value"
          >
            {{ s.label }}
          </button>
        </div>

        <div class="filter-group">
          <button
            v-for="p in filterPriorities"
            :key="p.value"
            class="filter-chip"
            :class="{ active: filterPriority === p.value }"
            @click="filterPriority = p.value"
          >
            {{ p.label }}
          </button>
        </div>

        <select v-model="filterProject" class="filter-select">
          <option value="">TODOS PROJETOS</option>
          <option v-for="p in projectOptions" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="my-loading">
      <span class="dim">CARREGANDO...</span>
    </div>

    <template v-else>
      <div v-if="uiStore.currentView === 'visual'" class="my-visual">
        <div v-if="filteredTasks.length === 0" class="my-empty">
          <span class="dim">NENHUMA ATIVIDADE ENCONTRADA</span>
        </div>
        <div v-else class="my-card-grid">
          <div
            v-for="task in filteredParentTasks"
            :key="task.id"
            class="my-task-card"
            :class="`status-${task.status}`"
            @click="handleTaskClick(task)"
          >
            <div class="my-card-header">
              <span class="my-card-project">{{ getProjectName(task.project_id) }}</span>
              <span class="my-card-status" :class="task.status">{{ statusLabel(task.status) }}</span>
            </div>
            <h3 class="my-card-title">{{ task.title }}</h3>
            <p v-if="task.description" class="my-card-desc">{{ truncate(task.description, 80) }}</p>
            <div class="my-card-footer">
              <span class="my-card-priority" :class="task.priority">{{ priorityLabel(task.priority) }}</span>
              <span v-if="task.data_fim_prevista" class="my-card-date">{{ formatDate(task.data_fim_prevista) }}</span>
            </div>
          </div>
        </div>
      </div>

      <ListView
        v-else-if="uiStore.currentView === 'list'"
        :tasks="filteredTasks"
      />

      <KanbanView
        v-else-if="uiStore.currentView === 'kanban'"
        :tasks="filteredTasks"
      />
    </template>

    <TaskDetailModal
      v-if="uiStore.isTaskModalOpen && !uiStore.isCreatingTask && selectedTask && !selectedTask.parent_id"
      :task="selectedTask"
      :is-creating="false"
      @close="uiStore.closeTaskModal()"
    />

    <SubtaskDetailModal
      v-if="uiStore.isTaskModalOpen && selectedTask && selectedTask.parent_id"
      :task="selectedTask"
      @close="uiStore.closeTaskModal()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useTaskStore } from '../stores/task'
import { useUIStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import ListView from '../components/task/ListView.vue'
import KanbanView from '../components/task/KanbanView.vue'
import TaskDetailModal from '../components/task/TaskDetailModal.vue'
import SubtaskDetailModal from '../components/task/SubtaskDetailModal.vue'
import type { Task } from '../services/supabase'

const router = useRouter()
const taskStore = useTaskStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

const views = [
  { key: 'visual' as const, label: 'PAINEL' },
  { key: 'list' as const, label: 'LISTA' },
  { key: 'kanban' as const, label: 'KANBAN' }
]

const loading = computed(() => taskStore.loading)

const myTasks = computed(() => taskStore.myTasks)

const filterStatuses = [
  { value: '', label: 'TODOS' },
  { value: 'criado', label: 'CRIADO' },
  { value: 'fazendo', label: 'FAZENDO' },
  { value: 'pronto', label: 'PRONTO' },
  { value: 'impedido', label: 'IMPEDIDO' }
]

const filterPriorities = [
  { value: '', label: 'TODAS' },
  { value: 'low', label: 'BAIXA' },
  { value: 'medium', label: 'MÉDIA' },
  { value: 'high', label: 'ALTA' }
]

const searchText = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const filterProject = ref('')

const projectOptions = computed(() => {
  const seen = new Set<string>()
  const result: { id: string; name: string }[] = []
  for (const task of myTasks.value) {
    if (seen.has(task.project_id)) continue
    seen.add(task.project_id)
    const name = taskStore.myProjectNames.get(task.project_id)
    if (name) result.push({ id: task.project_id, name })
  }
  return result
})

function matchesSearchT(t: Task, q: string): boolean {
  if (!q) return true
  const l = q.toLowerCase()
  return t.title.toLowerCase().includes(l) || (t.description || '').toLowerCase().includes(l)
}
function matchesStatusT(t: Task, s: string): boolean { return !s || t.status === s }
function matchesPriorityT(t: Task, p: string): boolean { return !p || t.priority === p }
function matchesProjectT(t: Task, p: string): boolean { return !p || t.project_id === p }

const filteredTasks = computed(() => {
  const list = myTasks.value
  const q = searchText.value
  const st = filterStatus.value
  const pr = filterPriority.value
  const pj = filterProject.value

  if (!q && !st && !pr && !pj) return list

  return list.filter(t =>
    matchesSearchT(t, q) &&
    matchesStatusT(t, st) &&
    matchesPriorityT(t, pr) &&
    matchesProjectT(t, pj)
  )
})

const filteredParentTasks = computed(() =>
  filteredTasks.value.filter(t => !t.parent_id)
)

const selectedTask = computed(() => {
  if (!uiStore.selectedTaskId) return null
  return taskStore.myTasks.find(t => t.id === uiStore.selectedTaskId) || null
})

function getProjectName(projectId: string): string {
  return taskStore.myProjectNames.get(projectId) || projectId.slice(0, 8)
}

function statusLabel(s: string): string {
  const labels: Record<string, string> = { criado: 'CRIADO', fazendo: 'FAZENDO', pronto: 'PRONTO', impedido: 'IMPEDIDO' }
  return labels[s] || s
}

function priorityLabel(p: string): string {
  const labels: Record<string, string> = { low: 'BAIXA', medium: 'MÉDIA', high: 'ALTA' }
  return labels[p] || p
}

function formatDate(d: string): string {
  if (!d) return ''
  const parts = d.slice(0, 10).split('-')
  if (parts.length !== 3) return d
  return `${parts[2]}/${parts[1]}`
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.substring(0, max) + '...' : text
}

function handleTaskClick(task: Task) {
  uiStore.selectTask(task.id)
}

function logout() {
  authStore.logout()
  router.push('/')
}

onMounted(async () => {
  authStore.restoreSession()
  if (!authStore.authenticated || !authStore.currentUser) {
    router.push('/')
    return
  }
  uiStore.setView('visual')
  await Promise.all([
    taskStore.fetchMyTasks(authStore.currentUser.id),
    taskStore.fetchMyProjectNames()
  ])
})

onBeforeUnmount(() => {
  uiStore.closeTaskModal()
})
</script>

<style scoped>
.my-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-mono);
}

.my-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--line-border);
  gap: 12px;
  flex-shrink: 0;
}

.my-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.my-back {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--text-dim);
  text-decoration: none;
  font-size: 11px;
  transition: color var(--transition-fast);
}

.my-back:hover { color: var(--blue-soft); }

.my-back-arrow { font-size: 14px; }

.my-sep { color: var(--line-border); font-size: 11px; }

.my-title {
  font-size: 13px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 1.5px;
  color: var(--blue-soft);
}

.my-subtitle {
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 0.5px;
}

.my-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.my-count {
  font-size: 10px;
  color: var(--text-dim);
  letter-spacing: 0.5px;
}

.my-view-group {
  display: flex;
  gap: 1px;
  background: var(--bg-secondary);
  border: 1px solid var(--line-border);
  padding: 2px;
}

.my-view-btn {
  padding: 2px 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  transition: all var(--transition-fast);
  letter-spacing: 0.8px;
}

.my-view-btn:hover { color: var(--text-primary); }

.my-view-btn.active {
  background: var(--bg-elevated);
  color: var(--blue-soft);
}

.view-sep {
  width: 1px;
  height: 18px;
  background: var(--line-border);
  align-self: center;
}

.my-view-btn.sair:hover {
  color: var(--danger);
}

/* ─── Filter Bar ─── */
.filter-bar {
  flex-shrink: 0;
  padding: 6px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--line-border);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-search {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--line-border);
  background: var(--bg-input);
  padding: 2px 6px;
}

.filter-icon {
  font-size: 10px;
  opacity: 0.5;
}

.filter-input {
  border: none;
  background: transparent;
  padding: 3px 0;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  outline: none;
  width: 140px;
}

.filter-input::placeholder { color: var(--text-dim); }

.filter-group {
  display: flex;
  gap: 2px;
}

.filter-chip {
  padding: 3px 8px;
  border: 1px solid var(--line-border);
  background: transparent;
  cursor: pointer;
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.5px;
  transition: all var(--transition-fast);
}

.filter-chip:hover {
  border-color: var(--blue-soft);
  color: var(--text-primary);
}

.filter-chip.active {
  border-color: var(--blue-secondary);
  color: var(--blue-soft);
  background: rgba(29, 121, 179, 0.08);
}

.filter-select {
  padding: 3px 6px;
  border: 1px solid var(--line-border);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 9px;
  font-family: var(--font-mono);
  outline: none;
  cursor: pointer;
}

.filter-select:focus { border-color: var(--blue-secondary); }

.my-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dim { color: var(--text-dim); font-size: 11px; }

.my-visual {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.my-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
}

.my-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 8px;
}

.my-task-card {
  background: var(--bg-elevated);
  border: 1px solid var(--line-border);
  padding: 12px;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.my-task-card:hover {
  border-color: var(--blue-soft);
  box-shadow: 0 0 8px rgba(74, 141, 184, 0.08);
}

.my-task-card.status-pronto { border-left: 2px solid var(--success); }
.my-task-card.status-fazendo { border-left: 2px solid var(--blue-secondary); }
.my-task-card.status-impedido { border-left: 2px solid var(--danger); }

.my-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.my-card-project {
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.5px;
  border: 1px solid var(--line-border);
  padding: 0 4px;
}

.my-card-status {
  font-size: 9px;
  font-family: var(--font-mono);
  padding: 0 4px;
  letter-spacing: 0.5px;
}

.my-card-status.criado { color: var(--text-dim); border: 1px solid var(--line-border); }
.my-card-status.fazendo { color: var(--blue-soft); border: 1px solid var(--blue-soft); }
.my-card-status.pronto { color: var(--success); border: 1px solid var(--success); }
.my-card-status.impedido { color: var(--danger); border: 1px solid var(--danger); }

.my-card-title {
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
  line-height: 1.3;
}

.my-card-desc {
  font-size: 11px;
  color: var(--text-dim);
  margin: 0;
  line-height: 1.4;
}

.my-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-top: auto;
  padding-top: 6px;
  border-top: 1px solid var(--line-divider);
}

.my-card-priority {
  font-size: 9px;
  font-family: var(--font-mono);
  padding: 0 4px;
  letter-spacing: 0.3px;
}

.my-card-priority.low { color: var(--text-dim); border: 1px solid var(--line-border); }
.my-card-priority.medium { color: var(--warning); border: 1px solid var(--warning); }
.my-card-priority.high { color: var(--danger); border: 1px solid var(--danger); }

.my-card-date {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
}

</style>

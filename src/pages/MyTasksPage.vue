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
        <span class="my-count">{{ myTasks.length }} ATIVIDADES</span>
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
        </div>
      </div>
    </header>

    <div v-if="loading" class="my-loading">
      <span class="dim">CARREGANDO...</span>
    </div>

    <template v-else>
      <div v-if="uiStore.currentView === 'visual'" class="my-visual">
        <div v-if="myTasks.length === 0" class="my-empty">
          <span class="dim">NENHUMA ATIVIDADE ATRIBUÍDA A VOCÊ</span>
        </div>
        <div v-else class="my-card-grid">
          <div
            v-for="task in parentTasks"
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
        :tasks="myTasks"
      />

      <KanbanView
        v-else-if="uiStore.currentView === 'kanban'"
        :tasks="myTasks"
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
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useTaskStore } from '../stores/task'
import { useUIStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import ListView from '../components/task/ListView.vue'
import KanbanView from '../components/task/KanbanView.vue'
import TaskDetailModal from '../components/task/TaskDetailModal.vue'
import SubtaskDetailModal from '../components/task/SubtaskDetailModal.vue'
import type { Task } from '../services/supabase'

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

const parentTasks = computed(() =>
  myTasks.value.filter(t => !t.parent_id)
)

const selectedTask = computed(() => {
  if (!uiStore.selectedTaskId) return null
  return taskStore.tasks.find(t => t.id === uiStore.selectedTaskId) || null
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

onMounted(async () => {
  if (!authStore.currentUser) return
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

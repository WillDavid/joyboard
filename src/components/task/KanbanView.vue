<template>
  <div class="kanban-view">
    <div class="kanban-columns">
      <div v-for="col in columns" :key="col.key" class="kanban-col">
        <div class="kanban-col-header">
          <span class="kanban-col-id">{{ col.id }}</span>
          <span class="kanban-col-title">{{ col.label }}</span>
          <span class="kanban-col-count">{{ col.tasks.length }}</span>
        </div>
            <div
              :class="['kanban-col-body', { 'drag-over': dragOverCol === col.key }]"
              @dragover.prevent
              @dragenter.prevent="dragOverCol = col.key"
              @dragleave="dragOverCol = null"
              @drop="handleDrop(col.key, $event)"
            >
            <div
              v-for="task in col.tasks"
              :key="task.id"
              class="kanban-card"
              draggable="true"
              @dragstart="handleDragStart(task.id, $event)"
              @click="openTask(task)"
            >
              <div class="kanban-card-header">
                <h4>{{ task.title }}</h4>
              </div>
              <p v-if="task.description" class="kanban-card-desc">
                {{ truncate(task.description, 60) }}
              </p>
              <div class="kanban-meta">
                <span class="kanban-status-pill" :class="task.status">{{ statusLabel(task.status) }}</span>
                <span class="kanban-priority-tag">{{ priorityLabel(task.priority) }}</span>
              </div>
              <div class="kanban-responsaveis" v-if="task.responsavel_1_id || task.responsavel_2_id">
                <span v-if="getRespName(task.responsavel_1_id)" class="kanban-resp-tag">{{ getRespName(task.responsavel_1_id) }}</span>
                <span v-if="getRespName(task.responsavel_2_id)" class="kanban-resp-tag">{{ getRespName(task.responsavel_2_id) }}</span>
              </div>
              <div class="kanban-dates">
                <span class="kanban-date">{{ formatDate(task.data_inicio) }}</span>
                <span class="kanban-date fim" :class="{ overdue: isOverdue(task) }">{{ formatDate(task.data_fim_prevista) }}</span>
              </div>
              <div class="kanban-links" v-if="getLinks(task.id).length > 0">
                <span v-for="link in getLinks(task.id)" :key="link.id" class="kanban-link">
                  <span class="lk-arrow">{{ link.dir }}</span>
                  <span class="lk-name">{{ link.name }}</span>
                </span>
              </div>
            </div>
            <div v-if="col.tasks.length === 0" class="kanban-col-empty">
              NENHUMA ATIVIDADE
            </div>
          </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task } from '../../services/supabase'
import { useUIStore } from '../../stores/ui'
import { useTaskStore } from '../../stores/task'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{
  tasks: Task[]
}>()

const uiStore = useUIStore()
const taskStore = useTaskStore()
const authStore = useAuthStore()
const draggedTaskId = ref<string | null>(null)
const dragOverCol = ref<string | null>(null)

const parentTasks = computed(() => props.tasks.filter(t => !t.parent_id))

const columns = computed(() => [
  {
    key: 'criado',
    id: '01',
    label: 'CRIADO',
    tasks: parentTasks.value.filter(t => t.status === 'criado')
  },
  {
    key: 'fazendo',
    id: '02',
    label: 'FAZENDO',
    tasks: parentTasks.value.filter(t => t.status === 'fazendo')
  },
  {
    key: 'pronto',
    id: '03',
    label: 'PRONTO',
    tasks: parentTasks.value.filter(t => t.status === 'pronto')
  },
  {
    key: 'impedido',
    id: '04',
    label: 'IMPEDIDO',
    tasks: parentTasks.value.filter(t => t.status === 'impedido')
  }
])

function handleDragStart(taskId: string, e: DragEvent) {
  draggedTaskId.value = taskId
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', taskId)
  }
}

function handleDrop(status: string, e: DragEvent) {
  const id = e.dataTransfer?.getData('text/plain') || draggedTaskId.value
  if (id) {
    taskStore.updateTask(id, { status: status as Task['status'] })
  }
  draggedTaskId.value = null
}

function openTask(task: Task) {
  uiStore.selectTask(task.id)
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = { criado: 'CRIADO', fazendo: 'FAZENDO', pronto: 'PRONTO', impedido: 'IMPEDIDO' }
  return labels[status] || status
}

function priorityLabel(priority: string): string {
  const labels: Record<string, string> = { low: 'BAIXA', medium: 'MÉDIA', high: 'ALTA' }
  return labels[priority] || priority
}

function getRespName(id: string | null): string {
  if (!id) return ''
  const u = authStore.users.find(u => u.id === id)
  return u ? u.username.toUpperCase().slice(0, 5) : ''
}

function getLinks(taskId: string): { id: string; dir: string; name: string }[] {
  const result: { id: string; dir: string; name: string }[] = []
  for (const conn of taskStore.connections) {
    if (conn.from_task_id === taskId) {
      const target = taskStore.tasks.find(t => t.id === conn.to_task_id)
      if (target) result.push({ id: conn.id, dir: '→', name: target.title.slice(0, 16) })
    } else if (conn.to_task_id === taskId) {
      const source = taskStore.tasks.find(t => t.id === conn.from_task_id)
      if (source) result.push({ id: conn.id, dir: '←', name: source.title.slice(0, 16) })
    }
  }
  return result
}

function truncate(text: string, max: number): string {
  return text.length > max ? text.substring(0, max) + '...' : text
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  const parts = d.slice(0, 10).split('-')
  if (parts.length !== 3) return d.slice(0, 5)
  return `${parts[2]}/${parts[1]}`
}

function isOverdue(task: Task): boolean {
  if (!task.data_fim_prevista || task.status === 'pronto') return false
  const fim = new Date(task.data_fim_prevista + 'T23:59:59')
  return new Date() > fim
}
</script>

<style scoped>
.kanban-view {
  flex: 1;
  overflow-x: auto;
  padding: var(--space-md);
  background: var(--bg-primary);
}

.kanban-columns {
  display: flex;
  gap: var(--space-sm);
  min-height: 100%;
  height: 100%;
}

.kanban-col {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
}

.kanban-col-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  font-weight: var(--font-weight-semibold);
  font-size: 12px;
  font-family: var(--font-mono);
  letter-spacing: 1px;
  border-bottom: 1px solid var(--line-border);
  background: var(--bg-secondary);
}

.kanban-col-id {
  color: var(--text-dim);
  font-size: 12px;
}

.kanban-col-title {
  flex: 1;
  text-transform: uppercase;
}

.kanban-col-count {
  background: transparent;
  border: 1px solid var(--line-border);
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-family: var(--font-mono);
}

.kanban-col-body {
  flex: 1;
  padding: var(--space-xs);
  background: var(--bg-secondary);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.kanban-card {
  background: var(--bg-elevated);
  border: 1px solid var(--line-border);
  padding: var(--space-sm);
  cursor: grab;
  transition: all var(--transition-fast);
}

.kanban-card:active {
  cursor: grabbing;
}

.kanban-card:hover {
  border-color: var(--blue-soft);
}

.kanban-col-body.drag-over {
  background: var(--bg-secondary);
  border: 1px solid var(--blue-soft);
}

.kanban-card-header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

.kanban-card-header h4 {
  margin: 0;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  line-height: 1.3;
}

.kanban-card-desc {
  margin: var(--space-xs) 0 0;
  font-size: 13px;
  color: var(--text-dim);
  line-height: 1.4;
}

.kanban-card-bar {
  margin-top: 4px;
}

.kanban-meta {
  display: flex;
  gap: 4px;
  margin-top: 4px;
}

.kanban-status-pill {
  font-size: 12px;
  font-family: var(--font-mono);
  padding: 0 3px;
  border: 1px solid var(--line-border);
  letter-spacing: 0.5px;
  color: var(--text-dim);
}

.kanban-status-pill.fazendo { color: var(--blue-soft); border-color: var(--blue-soft); }
.kanban-status-pill.pronto { color: var(--success); border-color: var(--success); }
.kanban-status-pill.impedido { color: var(--danger); border-color: var(--danger); }

.kanban-priority-tag {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.3px;
}

.kanban-responsaveis {
  display: flex;
  gap: 2px;
  margin-top: 3px;
  flex-wrap: wrap;
}

.kanban-resp-tag {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  padding: 0 2px;
  letter-spacing: 0.3px;
}

.kanban-dates {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--line-divider);
}

.kanban-links {
  display: flex;
  gap: 2px;
  margin-top: 3px;
  flex-wrap: wrap;
}

.kanban-link {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  padding: 0 2px;
}

.lk-arrow { color: var(--blue-soft); }
.lk-name { max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.kanban-date {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.3px;
}

.kanban-date.fim {
  text-align: right;
}

.kanban-date.fim.overdue {
  color: var(--danger);
}

.kanban-col-empty {
  text-align: center;
  padding: var(--space-md);
  color: var(--text-dim);
  font-size: var(--font-size-xs);
}
</style>

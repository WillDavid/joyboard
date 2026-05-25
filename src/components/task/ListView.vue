<template>
  <div class="list-view">
    <div class="list-table" :class="{ 'with-project': showProject }">
      <div class="list-header">
        <span class="col-project" v-if="showProject">PROJETO</span>
        <span class="col-title">ATIVIDADE</span>
        <span class="col-desc">DESCRIÇÃO</span>
        <span class="col-status">STATUS</span>
        <span class="col-priority">PRIOR.</span>
        <span class="col-resp">RESP</span>
        <span class="col-inicio">INÍCIO</span>
        <span class="col-fim">FIM</span>
        <span class="col-finalizacao">FINALIZ.</span>
        <span class="col-links">LIGAÇÕES</span>
      </div>
      <template v-for="task in parentTasks" :key="task.id">
        <div class="list-row" :class="{ 'row-overdue': isOverdue(task) }" @click="openTask(task)">
          <span class="col-project" v-if="showProject">{{ getProjectName(task.project_id) }}</span>
          <span class="col-title">
            <button v-if="hasSubtasks(task.id)" class="expand-btn" @click.stop="toggleExpand(task.id)">
              {{ expanded.has(task.id) ? '[-]' : '[+]' }}
            </button>
            <span v-else class="expand-spacer"></span>
            <span class="title-text">{{ task.title }}</span>
            <span v-if="isOverdue(task)" class="badge-overdue">ATRASADA</span>
          </span>
          <span class="col-desc">{{ task.description || '—' }}</span>
          <span class="col-status">
            <span class="status-pill" :class="task.status">{{ statusLabel(task.status) }}</span>
          </span>
          <span class="col-priority">{{ priorityLabel(task.priority) }}</span>
          <span class="col-resp">
            <span class="resp-tags">
              <span v-if="getRespName(task.responsavel_1_id)" class="resp-tag">{{ getRespName(task.responsavel_1_id) }}</span>
              <span v-if="getRespName(task.responsavel_2_id)" class="resp-tag">{{ getRespName(task.responsavel_2_id) }}</span>
              <span v-if="!task.responsavel_1_id && !task.responsavel_2_id" class="resp-none">—</span>
            </span>
          </span>
          <span class="col-inicio"><span class="date-cell" :class="{ overdue: isOverdue(task) }">{{ formatDate(task.data_inicio) }}</span></span>
          <span class="col-fim"><span class="date-cell" :class="{ overdue: isOverdue(task) }">{{ formatDate(task.data_fim_prevista) }}</span></span>
          <span class="col-finalizacao"><span class="date-cell finalizacao">{{ formatDate(task.data_finalizacao) }}</span></span>
          <span class="col-links">
            <span class="links-wrap">
              <span v-for="link in getLinks(task.id)" :key="link.id" class="link-tag">
                <span class="link-arrow">{{ link.dir }}</span>
                <span class="link-name">{{ link.name }}</span>
              </span>
              <span v-if="getLinks(task.id).length === 0" class="resp-none">—</span>
            </span>
          </span>
        </div>
        <div v-for="sub in taskStore.getSubtasks(task.id)" v-show="expanded.has(task.id)" :key="sub.id" class="list-sub-wrapper">
          <div class="sub-tree-line"></div>
          <div class="list-row list-sub-row" :class="{ 'row-overdue': isOverdue(sub) }" @click="openTask(sub)">
            <span class="col-project" v-if="showProject">{{ getProjectName(sub.project_id) }}</span>
            <span class="col-title">
              <span class="sub-conn">└─</span>
              <span class="title-text">{{ sub.title }}</span>
              <span v-if="isOverdue(sub)" class="badge-overdue">ATRASADA</span>
            </span>
            <span class="col-desc">{{ sub.description || '—' }}</span>
            <span class="col-status">
              <span class="status-pill" :class="sub.status">{{ statusLabel(sub.status) }}</span>
            </span>
            <span class="col-priority">{{ priorityLabel(sub.priority) }}</span>
            <span class="col-resp">
              <span class="resp-tags">
                <span v-if="getRespName(sub.responsavel_1_id)" class="resp-tag">{{ getRespName(sub.responsavel_1_id) }}</span>
                <span v-if="getRespName(sub.responsavel_2_id)" class="resp-tag">{{ getRespName(sub.responsavel_2_id) }}</span>
                <span v-if="!sub.responsavel_1_id && !sub.responsavel_2_id" class="resp-none">—</span>
              </span>
            </span>
            <span class="col-inicio"><span class="date-cell" :class="{ overdue: isOverdue(sub) }">{{ formatDate(sub.data_inicio) }}</span></span>
            <span class="col-fim"><span class="date-cell" :class="{ overdue: isOverdue(sub) }">{{ formatDate(sub.data_fim_prevista) }}</span></span>
            <span class="col-finalizacao"><span class="date-cell finalizacao">{{ formatDate(sub.data_finalizacao) }}</span></span>
            <span class="col-links">
              <span class="links-wrap">
                <span v-for="link in getLinks(sub.id)" :key="link.id" class="link-tag">
                  <span class="link-arrow">{{ link.dir }}</span>
                  <span class="link-name">{{ link.name }}</span>
                </span>
                <span v-if="getLinks(sub.id).length === 0" class="resp-none">—</span>
              </span>
            </span>
          </div>
        </div>
      </template>
      <div v-if="parentTasks.length === 0" class="list-empty">NENHUMA ATIVIDADE NESTE MÓDULO</div>
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
  showProject?: boolean
}>()

const taskStore = useTaskStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

function getProjectName(projectId: string): string {
  return taskStore.allProjectNames.get(projectId) || taskStore.myProjectNames.get(projectId) || projectId.slice(0, 8)
}
const expanded = ref<Set<string>>(new Set())

const parentTasks = computed(() =>
  props.tasks.filter(t => !t.parent_id)
)

function hasSubtasks(id: string): boolean {
  return taskStore.getSubtasks(id).length > 0
}

function toggleExpand(id: string) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
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

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  const parts = d.slice(0, 10).split('-')
  if (parts.length !== 3) return d.slice(0, 5)
  return `${parts[2]}/${parts[1]}`
}

function isOverdue(task: Task): boolean {
  if (!task.data_fim_prevista || task.status === 'pronto') return false
  return new Date() > new Date(task.data_fim_prevista + 'T23:59:59')
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
      if (target) result.push({ id: conn.id, dir: '→', name: target.title.slice(0, 20) })
    } else if (conn.to_task_id === taskId) {
      const source = taskStore.tasks.find(t => t.id === conn.from_task_id)
      if (source) result.push({ id: conn.id, dir: '←', name: source.title.slice(0, 20) })
    }
  }
  return result
}
</script>

<style scoped>
.list-view {
  flex: 1;
  overflow: auto;
  padding: var(--space-md);
  background: var(--bg-primary);
}

.list-table {
  min-width: 960px;
}

.list-table.with-project .list-header,
.list-table.with-project .list-row {
  grid-template-columns: 0.8fr 1.8fr 1.5fr 1fr 1fr 1fr 0.8fr 0.8fr 0.8fr 1fr;
}

.col-project {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--blue-soft);
  letter-spacing: 0.3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-header {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 0.8fr 0.8fr 0.8fr 1fr;
  gap: 6px;
  padding: 6px var(--space-md);
  background: var(--bg-secondary);
  font-size: 10px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--line-border);
}

.list-row {
  display: grid;
  grid-template-columns: 2fr 1.5fr 1fr 1fr 1fr 0.8fr 0.8fr 0.8fr 1fr;
  gap: 6px;
  padding: 6px var(--space-md);
  border-bottom: 1px solid var(--line-divider);
  cursor: pointer;
  transition: background var(--transition-fast);
  align-items: center;
  min-height: 34px;
}

.list-row:hover { background: var(--bg-secondary); }
.list-row:last-child { border-bottom: none; }

.row-overdue {
  border-left: 2px solid var(--danger);
}

.col-title {
  color: var(--text-primary);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
}

.title-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-btn {
  width: 18px;
  padding: 0;
  border: 1px solid var(--line-border);
  background: var(--bg-elevated);
  cursor: pointer;
  font-size: 12px;
  font-family: var(--font-mono);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-muted);
  line-height: 14px;
}

.expand-btn:hover { border-color: var(--blue-secondary); color: var(--blue-soft); }

.expand-spacer { width: 18px; flex-shrink: 0; }

.badge-overdue {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--danger);
  border: 1px solid var(--danger);
  padding: 0 2px;
  letter-spacing: 0.5px;
  flex-shrink: 0;
}

/* ─── Sub ─── */
.list-sub-wrapper {
  position: relative;
}

.sub-tree-line {
  position: absolute;
  left: calc(var(--space-md) + 9px);
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--line-border);
}

.list-sub-row {
  background: rgba(6, 27, 51, 0.3);
}

.list-sub-row .col-title {
  padding-left: 24px;
}

.sub-conn {
  font-size: 12px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  flex-shrink: 0;
}

/* ─── Status ─── */
.status-pill {
  font-size: 12px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-medium);
  padding: 1px 4px;
  border: 1px solid var(--line-border);
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.status-pill.criado { color: var(--text-dim); }
.status-pill.fazendo { color: var(--blue-soft); border-color: var(--blue-soft); }
.status-pill.pronto { color: var(--success); border-color: var(--success); }
.status-pill.impedido { color: var(--danger); border-color: var(--danger); }

/* ─── Priority ─── */
.col-priority {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-secondary);
}

/* ─── Resp ─── */
.col-resp { overflow: hidden; }

.resp-tags {
  display: flex;
  gap: 1px;
  flex-wrap: wrap;
}

.resp-tag {
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  padding: 0 2px;
  letter-spacing: 0.3px;
}

.resp-none {
  font-size: 12px;
  color: var(--text-dim);
}

/* ─── Dates ─── */
.col-inicio, .col-fim, .col-finalizacao {
  font-family: var(--font-mono);
}

.date-cell.finalizacao {
  color: var(--success);
}

.date-cell {
  font-size: 12px;
  color: var(--text-dim);
}

.date-cell.overdue { color: var(--danger); }

/* ─── Links ─── */
.col-links { overflow: hidden; }

.links-wrap {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}

.link-tag {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  font-size: 12px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  padding: 0 2px;
  white-space: nowrap;
}

.link-arrow {
  color: var(--blue-soft);
}

.link-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ─── Description ─── */
.col-desc {
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.list-empty {
  padding: var(--space-xl);
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
}

</style>

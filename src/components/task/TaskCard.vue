<template>
  <div
    class="task-card"
    :class="[
      `status-${task.status}`,
      { 'is-selected': isSelected, 'is-connection-source': isConnectionSource, 'is-connection-target': isConnectionMode && !isConnectionSource, 'is-overdue': isOverdue, 'impedido-blink': task.status === 'impedido', 'fazendo-blink': task.status === 'fazendo' }
    ]"
    @click.stop="handleCardClick"
  >
    <div class="card-header">
      <span class="card-status-bar" :class="`s-${task.status}`"></span>
      <span class="card-id">{{ task.id.slice(0, 8) }}</span>
      <span class="card-status-label" :class="`s-${task.status}`">{{ statusLabel }}</span>
    </div>

    <div class="card-body">
      <h3 class="card-title">{{ task.title }}</h3>
      <p v-if="task.description" class="card-desc">{{ truncatedDescription }}</p>

    </div>

    <div class="card-meta-row">
      <span class="card-responsaveis" v-if="resp1Name || resp2Name">
        <span class="resp-tag" v-if="resp1Name">{{ resp1Name }}</span>
        <span class="resp-tag" v-if="resp2Name">{{ resp2Name }}</span>
      </span>
      <span class="card-badges">
        <span v-if="isOverdue" class="badge-overdue">ATRASADA</span>
        <span v-if="subtaskCount > 0" class="sub-count">{{ subtaskCount }} SUB</span>
      </span>
    </div>

    <div class="card-footer">
      <div class="card-actions" v-if="!isConnectionMode">
        <button class="action-btn" @click.stop="$emit('start-connection')" title="Conectar">[LINK]</button>
      </div>
      <div class="connect-badge" v-if="isConnectionMode && !isConnectionSource" @click.stop="$emit('click', task)">
        [ CONECTAR ]
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../../services/supabase'
import { useTaskStore } from '../../stores/task'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{
  task: Task
  isSelected?: boolean
  isConnectionSource?: boolean
  isConnectionMode?: boolean
}>()

const emit = defineEmits<{
  (e: 'click', task: Task): void
  (e: 'start-connection'): void
}>()

const taskStore = useTaskStore()
const authStore = useAuthStore()

function handleCardClick() {
  if (!props.isConnectionMode) {
    emit('click', props.task)
  }
}

const truncatedDescription = computed(() => {
  if (!props.task.description) return ''
  return props.task.description.length > 60
    ? props.task.description.substring(0, 60) + '...'
    : props.task.description
})

const subtaskCount = computed(() => taskStore.getSubtasks(props.task.id).length)

const statusLabel = computed(() => {
  const labels: Record<string, string> = { criado: 'CRIADO', fazendo: 'FAZENDO', pronto: 'PRONTO', impedido: 'IMPEDIDO' }
  return labels[props.task.status] || ''
})

function getUserName(id: string | null): string {
  if (!id) return ''
  const u = authStore.users.find(u => u.id === id)
  return u ? u.username.toUpperCase().slice(0, 6) : ''
}

const resp1Name = computed(() => getUserName(props.task.responsavel_1_id))
const resp2Name = computed(() => getUserName(props.task.responsavel_2_id))

const isOverdue = computed(() => {
  if (!props.task.data_fim_prevista || props.task.status === 'pronto') return false
  const fim = new Date(props.task.data_fim_prevista + 'T23:59:59')
  return new Date() > fim
})
</script>

<style scoped>
.task-card {
  width: 240px;
  background: var(--bg-elevated);
  border: 1px solid var(--line-border);
  cursor: grab;
  position: relative;
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
}

.task-card:hover { border-color: var(--blue-soft); }

.task-card.status-pronto {
  border-color: var(--status-pronto);
}

.task-card.is-selected {
  border-color: var(--blue-secondary);
  box-shadow: 0 0 0 1px var(--blue-secondary);
}

.task-card.is-connection-source {
  border-color: var(--status-fazendo);
  box-shadow: 0 0 0 1px var(--status-fazendo);
}

.task-card.is-connection-target {
  border-color: var(--blue-soft);
  cursor: pointer;
}

.card-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  border-bottom: 1px solid var(--line-divider);
}

.card-status-bar {
  position: absolute;
  left: 4px;
  top: 4px;
  width: 5px;
  height: 5px;
}
.s-criado .card-status-bar { background: var(--status-criado); }
.s-fazendo .card-status-bar { background: var(--status-fazendo); }
.s-pronto .card-status-bar { background: var(--status-pronto); }
.s-impedido .card-status-bar { background: var(--status-impedido); }

.card-id { font-size: 10px; color: var(--text-dim); font-family: var(--font-mono); }

.card-status-label {
  font-size: 10px;
  font-family: var(--font-mono);
  letter-spacing: 0.5px;
  margin-left: auto;
  color: var(--text-dim);
}

.s-fazendo .card-status-label { color: var(--status-fazendo); }
.s-pronto .card-status-label { color: var(--success); }
.s-impedido .card-status-label { color: var(--danger); }

.card-body { flex: 1; padding: 6px; }

.card-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
  padding: 2px 6px 4px;
  flex-wrap: wrap;
}

.card-responsaveis {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
}

.resp-tag {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  padding: 0 3px;
  letter-spacing: 0.3px;
}

.card-badges {
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 10px;
}

.badge-overdue {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--danger);
  border: 1px solid var(--danger);
  padding: 0 3px;
  letter-spacing: 0.5px;
  animation: impedido-pulse 0.8s ease-in-out infinite;
}

.task-card.is-overdue {
  border-color: var(--danger);
  box-shadow: 0 0 0 1px var(--danger), 0 0 6px rgba(185, 125, 125, 0.3);
}

.card-title {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 2px;
  line-height: 1.3;
  letter-spacing: 0.3px;
}

.card-desc { font-size: 11px; color: var(--text-dim); margin: 0; line-height: 1.4; }

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 3px 6px;
  border-top: 1px solid var(--line-divider);
}

.card-meta { display: flex; gap: 4px; font-size: 10px; color: var(--text-dim); }

.sub-count {
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.3px;
}

.card-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.task-card:hover .card-actions {
  opacity: 1;
}

.action-btn {
  padding: 1px 4px;
  border: 1px solid var(--line-border);
  background: var(--bg-elevated);
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  letter-spacing: 0.5px;
  color: var(--text-dim);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  border-color: var(--blue-soft);
  color: var(--blue-soft);
}

.connect-badge {
  padding: 1px 6px;
  border: 1px solid var(--blue-soft);
  background: transparent;
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  letter-spacing: 0.5px;
  color: var(--blue-soft);
  transition: all var(--transition-fast);
  animation: connect-pulse 1s ease-in-out infinite;
}

.connect-badge:hover {
  background: rgba(74, 141, 184, 0.1);
}

@keyframes connect-pulse {
  0%, 100% { border-color: var(--blue-soft); }
  50% { border-color: var(--blue-secondary); }
}

.impedido-blink { animation: impedido-pulse 0.8s ease-in-out infinite; }
.fazendo-blink { animation: fazendo-pulse 0.8s ease-in-out infinite; }
</style>
<style>
.vue-flow__handle {
  display: none !important;
}
</style>

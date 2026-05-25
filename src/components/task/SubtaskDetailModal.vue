<template>
  <div class="side-overlay" @click.self="handleClose">
    <div class="side-modal">
      <div class="side-accent-bar"></div>
      <button class="side-close" @click="handleClose">[ ESC ]</button>

      <div class="side-header">
        <div class="side-type">
          <span class="tag">SUB-ATIVIDADE</span>
        </div>
        <div class="side-parent" @click="goToParent">
          &lt; {{ parentTitle }}
        </div>
        <div class="side-title-row">
          <div v-if="!isEditingTitle" class="title-display" @click="isEditingTitle = true">
            <span class="title-text">{{ editTitle || 'Subtarefa' }}</span>
            <button class="btn btn-ghost btn-icon btn-edit-title">[EDITAR]</button>
          </div>
          <input
            v-else
            v-model="editTitle"
            ref="titleInputRef"
            class="title-input"
            placeholder="Subtarefa"
            @blur="confirmTitleEdit"
            @keydown.enter="confirmTitleEdit"
            @keydown.escape="cancelTitleEdit"
          />
        </div>
      </div>

      <div class="side-body">
        <div class="field-group">
          <label>STATUS</label>
          <div class="status-buttons">
            <button v-for="s in statuses" :key="s.value"
              class="status-btn" :class="[s.value, { active: editStatus === s.value }]"
              @click="editStatus = s.value as Task['status']">
              [ {{ s.label }} ]
            </button>
          </div>
        </div>

        <div class="field-group">
          <label>RESPONSÁVEIS</label>
          <div class="resp-selector">
            <select v-model="editResp1" class="resp-select">
              <option :value="null">—</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username.toUpperCase() }} ({{ u.sigla }})</option>
            </select>
            <select v-model="editResp2" class="resp-select">
              <option :value="null">—</option>
              <option v-for="u in users" :key="u.id" :value="u.id">{{ u.username.toUpperCase() }} ({{ u.sigla }})</option>
            </select>
          </div>
        </div>

        <div class="field-group">
          <label>DATAS</label>
          <div class="dates-row">
            <div class="date-field">
              <span class="date-label">INÍCIO</span>
              <input v-model="editDataInicio" type="date" class="date-input" />
            </div>
            <div class="date-field">
              <span class="date-label">FINAL</span>
              <input v-model="editDataFim" type="date" class="date-input" />
            </div>
            <div class="date-field">
              <span class="date-label">CONCLUÍDO</span>
              <input v-model="editDataFinalizacao" type="date" class="date-input" />
            </div>
            <span class="countdown" v-if="editDataFim">{{ countdownText }}</span>
          </div>
        </div>

        <div class="field-group">
          <label>DESCRIÇÃO</label>
          <textarea v-model="editDescription" class="description-input"
            placeholder="Adicione uma descrição..." rows="3"></textarea>
        </div>

        <div class="field-group">
          <label>COMENTÁRIOS</label>
          <div class="comments-list">
            <div v-for="comment in taskComments" :key="comment.id" class="comment">
              <span class="comment-avatar" :style="{ background: getUserColor(comment.user_id) }">
                {{ comment.user_id.slice(0, 2).toUpperCase() }}
              </span>
              <div class="comment-content">
                <p>{{ comment.content }}</p>
                <span class="comment-time">{{ formatTime(comment.created_at) }}</span>
              </div>
            </div>
          </div>
          <div class="comment-input-row">
            <input v-model="newComment" class="comment-input"
              placeholder="Adicionar comentário..." @keydown.enter="addComment" />
            <button class="btn btn-primary btn-sm" @click="addComment">[OK]</button>
          </div>
        </div>
      </div>

      <div class="side-footer">
        <button class="btn-delete-text" @click="deleteTask">
          [ EXCLUIR ]
        </button>
        <button class="btn btn-primary" @click="saveTask">
          [ SALVAR ]
        </button>
      </div>
      <div v-if="saveError" class="save-error">{{ saveError }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import type { Task } from '../../services/supabase'

import { useTaskStore } from '../../stores/task'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const taskStore = useTaskStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

const editTitle = ref(props.task.title)
const editDescription = ref(props.task.description || '')
const editStatus = ref<Task['status']>(props.task.status)
const editResp1 = ref<string | null>(props.task.responsavel_1_id)
const editResp2 = ref<string | null>(props.task.responsavel_2_id)
const editDataInicio = ref(props.task.data_inicio ? props.task.data_inicio.slice(0, 10) : '')
const editDataFim = ref(props.task.data_fim_prevista || '')
const editDataFinalizacao = ref(props.task.data_finalizacao ? props.task.data_finalizacao.slice(0, 10) : '')
const newComment = ref('')
const isEditingTitle = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)
const saveError = ref('')

const users = computed(() => authStore.users)

const countdownText = computed(() => {
  if (!editDataFim.value) return ''
  const hoje = new Date()
  const fim = new Date(editDataFim.value + 'T23:59:59')
  const diff = fim.getTime() - hoje.getTime()
  if (diff <= 0) return '[ VENCIDA ]'
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  return `${dias}d ${horas}h`
})

const parentTask = computed(() =>
  taskStore.tasks.find(t => t.id === props.task.parent_id)
)

const parentTitle = computed(() => parentTask.value?.title || 'Tarefa')

const statuses = [
  { value: 'criado', label: 'CRIADO' },
  { value: 'fazendo', label: 'FAZENDO' },
  { value: 'pronto', label: 'PRONTO' },
  { value: 'impedido', label: 'IMPEDIDO' }
]

const taskComments = computed(() => taskStore.comments.get(props.task.id) || [])

function confirmTitleEdit() {
  isEditingTitle.value = false
}

function cancelTitleEdit() {
  editTitle.value = props.task.title
  isEditingTitle.value = false
}

async function addComment() {
  if (!newComment.value.trim()) return
  await taskStore.addComment(props.task.id, newComment.value.trim())
  newComment.value = ''
}

async function saveTask() {
  saveError.value = ''

  if (editStatus.value === 'pronto' && !editDataFinalizacao.value) {
    saveError.value = '[ DEFINA A DATA DE CONCLUSÃO ]'
    return
  }

  if (editDataFinalizacao.value && editStatus.value !== 'pronto') {
    saveError.value = '[ APAGUE A DATA DE CONCLUSÃO PARA MUDAR O STATUS ]'
    return
  }
  if (editDataInicio.value && editDataFim.value && editDataFim.value < editDataInicio.value) {
    saveError.value = '[ DATA FINAL ANTECEDE DATA INICIAL ]'
    return
  }
  if (editDataInicio.value && editDataFinalizacao.value && editDataFinalizacao.value < editDataInicio.value) {
    saveError.value = '[ DATA DE CONCLUSÃO ANTECEDE DATA INICIAL ]'
    return
  }
  if (editDataFim.value && editDataFinalizacao.value && editDataFinalizacao.value < editDataFim.value) {
    saveError.value = '[ DATA DE CONCLUSÃO ANTECEDE DATA FINAL ]'
    return
  }
  saveError.value = ''

  const updates: Partial<Task> = {}
  if (editTitle.value !== props.task.title) updates.title = editTitle.value
  if (editDescription.value !== (props.task.description || '')) updates.description = editDescription.value || null
  if (editStatus.value !== props.task.status) updates.status = editStatus.value as Task['status']
  if (editResp1.value !== props.task.responsavel_1_id) updates.responsavel_1_id = editResp1.value
  if (editResp2.value !== props.task.responsavel_2_id) updates.responsavel_2_id = editResp2.value
  if (editDataInicio.value !== (props.task.data_inicio ? props.task.data_inicio.slice(0, 10) : '')) updates.data_inicio = editDataInicio.value ? new Date(editDataInicio.value + 'T04:00:00').toISOString() : null
  if (editDataFim.value !== (props.task.data_fim_prevista || '')) updates.data_fim_prevista = editDataFim.value || null
  if (editDataFinalizacao.value !== (props.task.data_finalizacao ? props.task.data_finalizacao.slice(0, 10) : '')) updates.data_finalizacao = editDataFinalizacao.value ? new Date(editDataFinalizacao.value + 'T04:00:00').toISOString() : null
  if (!editDataFinalizacao.value && editStatus.value === 'pronto') updates.status = 'criado' as Task['status']
  if (Object.keys(updates).length > 0) {
    await taskStore.updateTask(props.task.id, updates)
  }
  emit('close')
}

async function deleteTask() {
  if (confirm('Tem certeza que deseja excluir esta subtarefa?')) {
    await taskStore.deleteTask(props.task.id)
    emit('close')
  }
}

function handleClose() {
  const hasChanges = editTitle.value !== props.task.title
    || editDescription.value !== (props.task.description || '')
    || editStatus.value !== props.task.status

  if (hasChanges && !confirm('As alterações não salvas serão perdidas. Deseja sair?')) {
    return
  }
  emit('close')
}

function goToParent() {
  if (parentTask.value) {
    uiStore.selectTask(parentTask.value.id)
  }
}

function getUserColor(userId: string): string {
  const colors = ['#FFB8D4', '#FFD4A3', '#FFF4B8', '#B8FFD4', '#B8D4FF', '#D4B8FF']
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('pt-BR', {
    day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit'
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') handleClose()
}

watch(isEditingTitle, (editing) => {
  if (editing) nextTick(() => titleInputRef.value?.focus())
})

onMounted(() => {
  taskStore.fetchComments(props.task.id)
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.side-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: flex-end;
  z-index: var(--z-modal);
}

.side-modal {
  width: 440px;
  max-width: 90vw;
  height: 100vh;
  background: var(--bg-panel);
  box-shadow: -4px 0 16px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  animation: slide-in-right 0.15s ease-out;
  border-left: 1px solid var(--line-border);
}

.side-accent-bar {
  height: 2px;
  background: var(--blue-soft);
  flex-shrink: 0;
}

@keyframes slide-in-right {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.side-close {
  position: absolute;
  top: var(--space-sm);
  right: var(--space-sm);
  padding: 2px 6px;
  border: 1px solid var(--line-border);
  background: var(--bg-elevated);
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  z-index: 1;
  transition: all var(--transition-fast);
  letter-spacing: 0.5px;
}

.side-close:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.side-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--bg-secondary);
}

.side-type {
  margin-bottom: 4px;
}

.side-parent {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  cursor: pointer;
  margin-bottom: var(--space-sm);
  transition: color var(--transition-fast);
}

.side-parent:hover {
  color: var(--blue-primary);
}

.side-title-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
}

.title-display {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: text;
}

.title-text {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
}

.btn-edit-title {
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.title-display:hover .btn-edit-title {
  opacity: 1;
}

.title-input {
  flex: 1;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  border: none;
  background: transparent;
  padding: 0;
}

.title-input:focus {
  outline: none;
  box-shadow: none;
}

.side-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-lg);
}

.field-group {
  margin-bottom: var(--space-lg);
}

.field-group label {
  display: block;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--text-dim);
  letter-spacing: 1px;
  margin-bottom: var(--space-sm);
  text-transform: uppercase;
}

.status-buttons {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.status-btn {
  padding: var(--space-xs) var(--space-md);
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  border: 1px solid var(--line-border);
  background: var(--bg-elevated);
  cursor: pointer;
  transition: all var(--transition-fast);
  letter-spacing: 0.5px;
  color: var(--text-dim);
}

.status-btn:hover {
  border-color: var(--blue-soft);
  color: var(--text-primary);
}

.status-btn.active {
  border-color: var(--blue-secondary);
  color: var(--blue-soft);
}

.description-input {
  width: 100%;
  resize: vertical;
}

.comments-list {
  margin-bottom: var(--space-md);
  max-height: 160px;
  overflow-y: auto;
}

.comment {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  padding: var(--space-sm);
  background: var(--bg-secondary);
}

.comment-avatar {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  flex-shrink: 0;
  border: 1px solid var(--line-border);
}

.comment-content p {
  margin: 0;
  font-size: var(--font-size-sm);
}

.comment-time {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.comment-input-row {
  display: flex;
  gap: var(--space-sm);
}

.comment-input {
  flex: 1;
}

.side-footer {
  padding: var(--space-md) var(--space-lg);
  border-top: 1px solid var(--bg-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-delete-text {
  background: none;
  border: 1px solid var(--line-border);
  cursor: pointer;
  color: var(--text-dim);
  padding: var(--space-sm);
  font-size: 10px;
  font-family: var(--font-mono);
  transition: color var(--transition-fast);
  letter-spacing: 0.5px;
}

.btn-delete-text:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.save-error {
  text-align: center;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--danger);
  letter-spacing: 1px;
  padding: 0 var(--space-lg) var(--space-md);
}

.resp-selector {
  display: flex;
  gap: var(--space-sm);
}

.resp-select {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 4px 6px;
  border: 1px solid var(--line-border);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  cursor: pointer;
}

.resp-select:focus {
  border-color: var(--blue-secondary);
}

.dates-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.date-label {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.date-value {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  padding: 4px 6px;
  border: 1px solid var(--line-border);
  background: var(--bg-input);
  min-width: 80px;
}

.date-input {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 4px 6px;
  border: 1px solid var(--line-border);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
  color-scheme: dark;
}

.date-input:focus {
  border-color: var(--blue-secondary);
}

.countdown {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.5px;
  white-space: nowrap;
}
</style>

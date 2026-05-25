<template>
  <div class="side-overlay" @click.self="handleClose">
    <div class="side-modal">
      <div class="side-accent-bar"></div>
      <button class="side-close" @click="handleClose">[ ESC ]</button>

      <div class="side-header">
        <div class="modal-type-row">
          <span class="tag">{{ isCreating ? 'NOVA ATIVIDADE' : task?.parent_id ? 'SUB-ATIVIDADE' : 'ATIVIDADE' }}</span>
          <span v-if="task?.parent_id" class="modal-parent-link" @click="goToParent">
            &lt; {{ parentTaskTitle }}
          </span>
        </div>
        <div class="modal-title-row">
          <div v-if="!isEditingTitle" class="title-display" @click="isEditingTitle = true">
            <span class="title-text">{{ editTitle || 'ATIVIDADE SEM TÍTULO' }}</span>
            <button class="btn btn-ghost btn-icon btn-edit-title" title="EDITAR">[EDITAR]</button>
          </div>
        <input
          v-else
          v-model="editTitle"
          ref="titleInputRef"
          class="title-input"
          placeholder="Título da tarefa"
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
            <button
              v-for="s in statuses"
              :key="s.value"
              class="status-btn"
              :class="[s.value, { active: editStatus === s.value }]"
              @click="editStatus = s.value"
            >
              [ {{ s.label }} ]
            </button>
          </div>
        </div>

        <div class="field-group">
          <label>PRIORIDADE</label>
          <div class="priority-buttons">
            <button
              v-for="p in priorities"
              :key="p.value"
              class="priority-btn"
              :class="[p.value, { active: editPriority === p.value }]"
              @click="editPriority = p.value"
            >
              [ {{ p.label }} ]
            </button>
          </div>
        </div>

        <div class="field-group">
          <label>DESCRIÇÃO</label>
          <textarea
            v-model="editDescription"
            class="description-input"
            placeholder="Adicione uma descrição..."
            rows="4"
          ></textarea>
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

        <template v-if="!isCreating">
          <div class="field-group">
            <label>CHECKLIST — {{ subtaskCompletion }}/{{ taskSubtasks.length }}</label>
            <div class="checklist">
              <div v-for="sub in taskSubtasks" :key="sub.id" class="checklist-item">
                <button
                  class="checklist-status"
                  :class="`status-${sub.status}`"
                  @click="cycleSubtaskStatus(sub)"
                  :title="statusLabel(sub.status)"
                >
                  <span v-if="sub.status === 'pronto'">[CONCL]</span>
                  <span v-else>[{{ sub.status === 'criado' ? '--' : sub.status === 'fazendo' ? '>>' : '!!' }}]</span>
                </button>
                <span
                  class="checklist-title"
                  :class="{ done: sub.status === 'pronto' }"
                  @click="openSubtask(sub)"
                >
                  {{ sub.title }}
                </span>
              </div>
              <div v-if="taskSubtasks.length === 0" class="checklist-empty">
                NENHUMA SUB-ATIVIDADE
              </div>
            </div>
            <div class="checklist-input-row">
              <input v-model="newSubtaskTitle" placeholder="Nova sub-atividade..." @keydown.enter="addSubtaskFromModal" />
              <button class="btn btn-primary btn-sm" @click="addSubtaskFromModal">[ADD]</button>
            </div>
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
              <input
                v-model="newComment"
                class="comment-input"
                placeholder="Adicionar comentário..."
                @keydown.enter="addComment"
              />
              <button class="btn btn-primary btn-sm" @click="addComment">[OK]</button>
            </div>
          </div>

          <div v-if="taskConnections.length > 0" class="field-group">
            <label>CONEXÕES</label>
            <div class="connections-list">
              <div
                v-for="conn in taskConnections"
                :key="conn.id"
                class="connection-item"
              >
                <span class="tag">LINK</span>
                <span>{{ getConnectedTaskTitle(conn) }}</span>
                <button class="btn btn-ghost btn-icon" @click="deleteConnection(conn.id)">
                  [EXCL]
                </button>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="side-footer">
        <button v-if="!isCreating" class="btn-delete-text" @click="deleteTask">
          [ EXCLUIR ]
        </button>
        <button class="btn btn-primary" @click="saveTask">
          [ SALVAR ]
        </button>
      </div>
      <div v-if="saveError" class="save-error">{{ saveError }}</div>

      <div v-if="showDiscardConfirm" class="discard-overlay">
        <div class="discard-modal">
          <p>{{ isCreating ? 'A nova atividade não será criada.' : 'As alterações não salvas serão perdidas.' }}</p>
          <p class="discard-question">Deseja descartar as alterações?</p>
          <div class="discard-actions">
            <button class="btn btn-secondary" @click="showDiscardConfirm = false">[CANCELAR]</button>
            <button class="btn btn-danger" @click="discardAndClose">[DESCARTAR]</button>
          </div>
        </div>
      </div>

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
  task: Task | null
  isCreating: boolean
  positionX?: number
  positionY?: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const taskStore = useTaskStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

const editTitle = ref(props.isCreating ? '' : (props.task?.title || ''))
const editDescription = ref(props.isCreating ? '' : (props.task?.description || ''))
const editStatus = ref<Task['status']>(props.isCreating ? 'criado' : (props.task?.status || 'criado'))
const editPriority = ref<Task['priority']>(props.isCreating ? 'medium' : (props.task?.priority || 'medium'))
const newComment = ref('')
const isEditingTitle = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)
const showDiscardConfirm = ref(false)
const saveError = ref('')
const newSubtaskTitle = ref('')
const editResp1 = ref<string | null>(null)
const editResp2 = ref<string | null>(null)
const editDataInicio = ref('')
const editDataFim = ref('')
const editDataFinalizacao = ref('')

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

const statuses: { value: Task['status']; label: string }[] = [
  { value: 'criado', label: 'CRIADO' },
  { value: 'fazendo', label: 'FAZENDO' },
  { value: 'pronto', label: 'PRONTO' },
  { value: 'impedido', label: 'IMPEDIDO' }
]

const priorities: { value: Task['priority']; label: string }[] = [
  { value: 'low', label: 'BAIXA' },
  { value: 'medium', label: 'MÉDIA' },
  { value: 'high', label: 'ALTA' }
]

const taskComments = computed(() => (props.task ? taskStore.comments.get(props.task.id) || [] : []))
const parentTaskTitle = computed(() => {
  if (!props.task?.parent_id) return ''
  const parent = taskStore.tasks.find(t => t.id === props.task!.parent_id)
  return parent?.title || ''
})
const taskSubtasks = computed(() => (props.task ? taskStore.getSubtasks(props.task.id) : []))
const taskConnections = computed(() => {
  const t = props.task
  if (!t) return []
  return taskStore.connections.filter(
    c => c.from_task_id === t.id || c.to_task_id === t.id
  )
})

const subtaskCompletion = computed(() => taskSubtasks.value.filter(s => s.status === 'pronto').length)

const hasChanges = computed(() => {
  if (props.isCreating) {
    return editTitle.value !== ''
      || editDescription.value !== ''
      || editStatus.value !== 'criado'
      || editPriority.value !== 'medium'
  }
  if (!props.task) return false
  return editTitle.value !== props.task.title
    || editDescription.value !== (props.task.description || '')
    || editStatus.value !== props.task.status
    || editPriority.value !== props.task.priority
})

function confirmTitleEdit() {
  if (!editTitle.value.trim()) {
    editTitle.value = props.isCreating ? '' : (props.task?.title || '')
  }
  isEditingTitle.value = false
}

function cancelTitleEdit() {
  editTitle.value = props.isCreating ? '' : (props.task?.title || '')
  isEditingTitle.value = false
}

async function addComment() {
  if (!props.task || !newComment.value.trim()) return
  await taskStore.addComment(props.task.id, newComment.value.trim())
  newComment.value = ''
}

async function deleteConnection(id: string) {
  if (!props.task) return
  await taskStore.deleteConnection(id)
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

  const x = props.positionX ?? (window.innerWidth / 2 - 100)
  const y = props.positionY ?? (window.innerHeight / 2 - 50)

  if (props.isCreating) {
    await taskStore.createTask(editTitle.value || 'Nova Tarefa', x, y, {
      description: editDescription.value || null,
      status: editStatus.value,
      priority: editPriority.value,
      data_inicio: editDataInicio.value ? new Date(editDataInicio.value + 'T04:00:00').toISOString() : null,
      data_fim_prevista: editDataFim.value || null,
      data_finalizacao: editDataFinalizacao.value ? new Date(editDataFinalizacao.value + 'T04:00:00').toISOString() : null,
      responsavel_1_id: editResp1.value,
      responsavel_2_id: editResp2.value
    })
  } else if (props.task) {
    const updates: Partial<Task> = {}
    if (editTitle.value !== props.task.title) updates.title = editTitle.value
    if (editDescription.value !== (props.task.description || '')) updates.description = editDescription.value || null
    if (editStatus.value !== props.task.status) updates.status = editStatus.value as Task['status']
    if (editPriority.value !== props.task.priority) updates.priority = editPriority.value as Task['priority']
    if (editResp1.value !== props.task.responsavel_1_id) updates.responsavel_1_id = editResp1.value
    if (editResp2.value !== props.task.responsavel_2_id) updates.responsavel_2_id = editResp2.value
    if (editDataInicio.value !== (props.task.data_inicio ? props.task.data_inicio.slice(0, 10) : '')) updates.data_inicio = editDataInicio.value ? new Date(editDataInicio.value + 'T04:00:00').toISOString() : null
    if (editDataFim.value !== (props.task.data_fim_prevista || '')) updates.data_fim_prevista = editDataFim.value || null
    if (editDataFinalizacao.value !== (props.task.data_finalizacao ? props.task.data_finalizacao.slice(0, 10) : '')) updates.data_finalizacao = editDataFinalizacao.value ? new Date(editDataFinalizacao.value + 'T04:00:00').toISOString() : null
    if (!editDataFinalizacao.value && editStatus.value === 'pronto') updates.status = 'criado' as Task['status']
    if (Object.keys(updates).length > 0) {
      await taskStore.updateTask(props.task.id, updates)
    }
  }

  emit('close')
}

async function deleteTask() {
  if (!props.task) return
  if (confirm('Tem certeza que deseja excluir esta tarefa?')) {
    await taskStore.deleteTask(props.task.id)
    emit('close')
  }
}

async function addSubtaskFromModal() {
  if (!props.task || !newSubtaskTitle.value.trim()) return
  if (props.task.parent_id) return
  await taskStore.createSubtask(props.task.id, newSubtaskTitle.value.trim())
  newSubtaskTitle.value = ''
}

function cycleSubtaskStatus(sub: Task) {
  const order: Task['status'][] = ['criado', 'fazendo', 'pronto', 'impedido']
  const idx = order.indexOf(sub.status)
  const next = order[(idx + 1) % order.length]
  taskStore.updateTask(sub.id, { status: next })
}

function goToParent() {
  if (props.task?.parent_id) {
    uiStore.selectTask(props.task.parent_id)
  }
}

function openSubtask(sub: any) {
  uiStore.selectTask(sub.id)
}

function statusLabel(s: string): string {
  const labels: Record<string, string> = {
    criado: 'Criado', fazendo: 'Fazendo', pronto: 'Pronto', impedido: 'Impedido'
  }
  return labels[s] || s
}

function handleClose() {
  if (hasChanges.value) {
    showDiscardConfirm.value = true
  } else {
    emit('close')
  }
}

function discardAndClose() {
  showDiscardConfirm.value = false
  emit('close')
}

function getUserColor(userId: string): string {
  const colors = ['#FFB8D4', '#FFD4A3', '#FFF4B8', '#B8FFD4', '#B8D4FF', '#D4B8FF']
  const hash = userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
  return colors[hash % colors.length]
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('pt-BR', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  })
}

function getConnectedTaskTitle(conn: any): string {
  if (!props.task) return 'Tarefa'
  const otherId = conn.from_task_id === props.task.id ? conn.to_task_id : conn.from_task_id
  const otherTask = taskStore.tasks.find(t => t.id === otherId)
  return otherTask?.title || 'Tarefa'
}

watch(isEditingTitle, (editing) => {
  if (editing) {
    nextTick(() => titleInputRef.value?.focus())
  }
})

onMounted(() => {
  if (props.task) {
    taskStore.fetchComments(props.task.id)
    taskStore.fetchImages(props.task.id)
    editResp1.value = props.task.responsavel_1_id
    editResp2.value = props.task.responsavel_2_id
    editDataInicio.value = props.task.data_inicio ? props.task.data_inicio.slice(0, 10) : ''
    editDataFim.value = props.task.data_fim_prevista || ''
    editDataFinalizacao.value = props.task.data_finalizacao ? props.task.data_finalizacao.slice(0, 10) : ''
  }
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && !showDiscardConfirm.value) {
    handleClose()
  }
}

watch(() => props.task?.id, () => {
  if (props.task) {
    editTitle.value = props.task.title
    editDescription.value = props.task.description || ''
    editStatus.value = props.task.status
    editPriority.value = props.task.priority
    editResp1.value = props.task.responsavel_1_id
    editResp2.value = props.task.responsavel_2_id
    editDataInicio.value = props.task.data_inicio ? props.task.data_inicio.slice(0, 10) : ''
    editDataFim.value = props.task.data_fim_prevista || ''
    editDataFinalizacao.value = props.task.data_finalizacao ? props.task.data_finalizacao.slice(0, 10) : ''
    isEditingTitle.value = false
    taskStore.fetchComments(props.task.id)
    taskStore.fetchImages(props.task.id)
  }
})
</script>

<style scoped>
.side-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 21, 42, 0.7);
  display: flex;
  justify-content: flex-end;
  z-index: var(--z-modal);
}

.side-modal {
  width: 480px;
  max-width: 90vw;
  height: 100vh;
  background: var(--bg-panel);
  box-shadow: -4px 0 16px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
  animation: slide-in-right 0.15s ease-out;
  border-left: 1px solid var(--line-border);
}

.side-accent-bar { height: 2px; background: var(--blue-secondary); flex-shrink: 0; }

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
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.modal-type-row {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.modal-parent-link {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  cursor: pointer;
  transition: color var(--transition-fast);
}

.modal-parent-link:hover {
  color: var(--blue-primary);
}

.modal-title-row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
}

.title-display {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  cursor: text;
}

.title-text {
  font-size: var(--font-size-xl);
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
  font-size: var(--font-size-xl);
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

.status-buttons,
.priority-buttons {
  display: flex;
  gap: var(--space-sm);
  flex-wrap: wrap;
}

.status-btn,
.priority-btn {
  padding: var(--space-sm) var(--space-md);
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

.status-btn:hover,
.priority-btn:hover {
  border-color: var(--blue-soft);
  color: var(--text-primary);
}

.status-btn.active {
  border-color: var(--blue-secondary);
  color: var(--blue-soft);
}

.priority-btn.active {
  border-color: var(--blue-secondary);
  background: var(--bg-secondary);
  color: var(--blue-soft);
}

.description-input {
  width: 100%;
  resize: vertical;
}

.comments-list {
  margin-bottom: var(--space-md);
  max-height: 200px;
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
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
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

.connections-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.connection-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--bg-secondary);
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

.discard-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.discard-modal {
  background: var(--bg-elevated);
  padding: var(--space-xl);
  max-width: 320px;
  width: 90%;
  box-shadow: var(--shadow-modal);
  border: 1px solid var(--line-border);
}

.discard-modal p {
  margin: 0 0 var(--space-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.discard-question {
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.discard-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  margin-top: var(--space-lg);
}

.checklist {
  margin-bottom: var(--space-sm);
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 4px 0;
}

.checklist-status {
  width: 44px;
  padding: 2px 0;
  border: 1px solid var(--line-border);
  background: transparent;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  transition: all var(--transition-fast);
}

.checklist-status:hover {
  border-color: var(--blue-soft);
}

.checklist-status.status-pronto {
  border-color: var(--success);
  color: var(--success);
}

.checklist-title {
  flex: 1;
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
  padding: 2px 0;
}

.checklist-title.done {
  text-decoration: line-through;
  color: var(--text-muted);
}

.checklist-title:hover {
  color: var(--blue-primary);
}

.checklist-empty {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  padding: var(--space-sm) 0;
}

.checklist-input-row {
  display: flex;
  gap: var(--space-sm);
}

.checklist-input-row input {
  flex: 1;
}

/* ─── Responsaveis ─── */
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

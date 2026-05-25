<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="project-modal">
      <button class="modal-close" @click="$emit('close')">[ ESC ]</button>

      <div class="modal-header-bar"></div>

      <h2>{{ editProject ? 'EDITAR MÓDULO' : 'NOVO MÓDULO' }}</h2>

      <form @submit.prevent="saveProject">
        <div class="form-group">
          <label>NOME DO MÓDULO</label>
          <input v-model="name" type="text" placeholder="IDENTIFICADOR DO MÓDULO" required autocomplete="off" />
        </div>

        <div class="form-group">
          <label>DESCRIÇÃO</label>
          <textarea v-model="description" placeholder="DESCRIÇÃO OPERACIONAL" rows="3"></textarea>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">[ CANCELAR ]</button>
          <button type="submit" class="btn btn-primary">{{ editProject ? '[ SALVAR ]' : '[ CRIAR ]' }}</button>
        </div>
      </form>

      <hr class="sep-h">

      <div class="delete-section" v-if="editProject">
        <label>EXCLUIR MÓDULO — AUTORIZAÇÃO</label>
        <div class="delete-input-row">
          <input v-model="deleteCode" type="text" placeholder="CÓDIGO DE AUTORIZAÇÃO" autocomplete="off" @keydown.enter="deleteProject" />
          <button class="btn-delete-project" :class="{ armed: deleteCode === secretCode }" :disabled="deleteCode !== secretCode" @click="deleteProject">
            [ EXCLUIR ]
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import type { Project } from '../../services/supabase'
import { useProjectStore } from '../../stores/project'

const props = defineProps<{
  editProject?: Project | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const router = useRouter()
const projectStore = useProjectStore()

const secretCode = '@Daito#36158809'
const deleteCode = ref('')
const name = ref('')
const description = ref('')

onMounted(() => {
  if (props.editProject) {
    name.value = props.editProject.name
    description.value = props.editProject.description || ''
  }
  document.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
})

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    emit('close')
  }
}

async function saveProject() {
  if (!name.value.trim()) return

  if (props.editProject) {
    await projectStore.updateProject(props.editProject.id, {
      name: name.value,
      description: description.value || null,
      color: props.editProject.color
    })
  } else {
    await projectStore.createProject(name.value, description.value, '#FFFFFF')
  }

  emit('close')
}

async function deleteProject() {
  if (!props.editProject) return
  if (deleteCode.value !== secretCode) return
  await projectStore.deleteProject(props.editProject.id)
  emit('close')
  router.push('/home')
}
</script>

<style scoped>
.project-modal {
  width: 400px;
  max-width: 90vw;
  background: var(--bg-elevated);
  box-shadow: var(--shadow-modal);
  padding: var(--space-xl);
  position: relative;
  border: 1px solid var(--line-border);
}

.modal-header-bar {
  height: 2px;
  background: var(--blue-soft);
  margin: calc(-1 * var(--space-xl)) calc(-1 * var(--space-xl)) var(--space-lg) calc(-1 * var(--space-xl));
}

.modal-close {
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
  transition: all var(--transition-fast);
  letter-spacing: 0.5px;
}

.modal-close:hover {
  border-color: var(--danger);
  color: var(--danger);
}

h2 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--blue-soft);
  margin-bottom: var(--space-lg);
  letter-spacing: 1px;
  font-family: var(--font-mono);
}

.delete-section {
  padding-top: var(--space-sm);
}

.delete-section label {
  display: block;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--text-dim);
  letter-spacing: 1px;
  margin-bottom: var(--space-sm);
}

.delete-input-row {
  display: flex;
  gap: var(--space-sm);
}

.delete-input-row input {
  flex: 1;
  font-family: var(--font-mono);
  font-size: 11px;
}

.btn-delete-project {
  background: none;
  border: 1px solid var(--line-border);
  cursor: pointer;
  color: var(--text-dim);
  padding: var(--space-sm) var(--space-md);
  font-size: 10px;
  font-family: var(--font-mono);
  transition: all var(--transition-fast);
  letter-spacing: 0.5px;
}

.btn-delete-project.armed {
  border-color: var(--danger);
  color: var(--danger);
}

.btn-delete-project.armed:hover {
  background: rgba(185, 125, 125, 0.1);
}

.btn-delete-project:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-delete-project:disabled:hover {
  border-color: var(--line-border);
  color: var(--text-dim);
}
</style>

<template>
  <div class="terminal" tabindex="0">
    <div class="terminal-header">
      <div class="terminal-line">
        <span class="prompt">[{{ username }}]</span>
        <span class="typing-text">JOYBOARD SYSTEMS — v2.0</span>
        <span class="blink-cursor">_</span>
      </div>
      <div class="terminal-line dim">
        CONECTADO // {{ serverHost.toUpperCase() }}
      </div>
      <div class="terminal-line stats-line">
        <span class="stat-item">PROJETOS: {{ projectStore.projects.length }}</span>
        <span class="stat-sep">|</span>
        <span class="stat-item">DOCUMENTOS: {{ documentStore.documents.length }}</span>
        <span class="stat-sep">|</span>
        <span class="stat-item">MINHAS ATIVIDADES: {{ myTaskCount }}</span>
      </div>
      <div class="terminal-line dim time-line">
        <span class="live-time">{{ timeStr }}</span>
        <span class="time-sep">//</span>
        <span>{{ userRole }}</span>
      </div>
      <hr class="sep-h thick">
      <div class="terminal-line module-prompt">
        SELECIONE MÓDULO:
      </div>
    </div>

    <div class="terminal-body">
      <div v-if="loading" class="loading-state">
        <span class="loader-text">CARREGANDO...</span>
      </div>

      <div v-else class="modules-area">
        <ModuleCard
          id="01"
          title="PROJETOS"
          :count="projectStore.projects.length"
          :expanded="expandedModule === 'projects'"
          @toggle="toggleModule('projects')"
        >
          <ProjectList
            :projects="projectStore.projects"
            :completion="taskStore.projectCompletion"
          />
        </ModuleCard>

        <ModuleCard
          id="02"
          title="PASTA PESSOAL"
          :count="myTaskCount"
          :expanded="expandedModule === 'personal'"
          @toggle="toggleModule('personal')"
        >
          <div class="personal-content">
            <p class="personal-summary" v-if="myTaskCount > 0">
              VOCÊ POSSUI <span class="personal-highlight">{{ myTaskCount }}</span> ATIVIDADES ATRIBUÍDAS
            </p>
            <p class="personal-summary" v-else>
              NENHUMA ATIVIDADE ATRIBUÍDA
            </p>
            <button class="personal-access-btn" @click="goToMyTasks">
              [ ACESSAR PASTA PESSOAL ]
            </button>
          </div>
        </ModuleCard>

        <ModuleCard
          id="03"
          title="DOCUMENTAÇÃO"
          :count="documentStore.documents.length"
          :expanded="expandedModule === 'docs'"
          @toggle="toggleModule('docs')"
        >
          <UploadZone @file-selected="handleFileSelected" />

          <div v-if="uploadDoc" class="upload-confirm">
            <span class="upload-confirm-name">{{ uploadDoc.name }}</span>
            <input
              v-model="uploadDocName"
              class="upload-confirm-input"
              placeholder="NOME DO DOCUMENTO"
              @keydown.enter="confirmUpload"
            />
            <div class="upload-confirm-actions">
              <button class="footer-btn" @click="cancelUpload">[ CANCELAR ]</button>
              <button class="footer-btn" :disabled="!uploadDocName.trim()" @click="confirmUpload">[ ENVIAR ]</button>
            </div>
          </div>

          <div class="doc-section-spacer"></div>

          <DocumentationList
            :documents="documentStore.documents"
            :can-update="documentStore.isManager"
            @view="openDocumentViewer"
            @update="handleDocumentUpdate"
          />
        </ModuleCard>
      </div>
    </div>

    <hr class="sep-h thick">

    <div class="terminal-footer">
      <div class="footer-buttons">
        <button class="footer-btn" @click="showUserModal = true">[ CRIAR USUÁRIO ]</button>
        <button class="footer-btn" @click="openCreateProject">[ CRIAR PROJETO ]</button>
        <button class="footer-btn" @click="showUploadModal = true">[ NOVO DOCUMENTO ]</button>
        <button class="footer-btn" @click="openSettings">[ CONFIGURAÇÕES ]</button>
        <button class="footer-btn danger" @click="logout">[ SAIR ]</button>
      </div>
    </div>

    <ProjectFormModal
      v-if="projectStore.isProjectModalOpen"
      @close="projectStore.closeProjectModal()"
    />

    <UserFormModal
      v-if="showUserModal"
      @close="showUserModal = false"
      @created="onUserCreated"
    />

    <DocumentViewer
      v-if="viewerDoc"
      :doc="viewerDoc"
      @close="viewerDoc = null"
    />

    <div v-if="notification.show" class="toast" :class="notification.type">
      <span class="toast-icon">{{ notification.type === 'success' ? '[OK]' : '[!!]' }}</span>
      <span class="toast-msg">{{ notification.message }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project'
import { useTaskStore } from '../stores/task'
import { useAuthStore } from '../stores/auth'
import { useDocumentStore } from '../stores/document'
import { useClock } from '../composables/useClock'
import type { AppDocument } from '../services/supabase'
import ModuleCard from '../components/project/ModuleCard.vue'
import ProjectList from '../components/project/ProjectList.vue'
import ProjectFormModal from '../components/project/ProjectFormModal.vue'
import UserFormModal from '../components/auth/UserFormModal.vue'
import UploadZone from '../components/document/UploadZone.vue'
import DocumentationList from '../components/document/DocumentationList.vue'
import DocumentViewer from '../components/document/DocumentViewer.vue'

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const authStore = useAuthStore()
const documentStore = useDocumentStore()
const { timeStr } = useClock()

const showUserModal = ref(false)
const showUploadModal = ref(false)
const loading = ref(true)
const serverHost = ref(window.location.host)
const expandedModule = ref<string | null>(null)
const viewerDoc = ref<AppDocument | null>(null)

const uploadDoc = ref<File | null>(null)
const uploadDocName = ref('')

const notification = ref<{ show: boolean; message: string; type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

let notificationTimer: ReturnType<typeof setTimeout> | null = null

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  if (notificationTimer) clearTimeout(notificationTimer)
  notification.value = { show: true, message, type }
  notificationTimer = setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

const username = computed(() =>
  authStore.currentUser?.username.toUpperCase() || 'SISTEMA'
)

const userRole = computed(() => {
  const u = authStore.currentUser
  if (!u) return 'SISTEMA'
  return `${u.role} (${u.sigla})`
})

const myTaskCount = computed(() => taskStore.myTasks.length)

function goToMyTasks() {
  router.push('/minhas-atividades')
}

function toggleModule(module: string) {
  expandedModule.value = expandedModule.value === module ? null : module
  if (module === 'docs' && expandedModule.value === 'docs') {
    documentStore.fetchDocuments()
  }
  if (module === 'personal' && expandedModule.value === 'personal') {
    if (authStore.currentUser) {
      taskStore.fetchMyTasks(authStore.currentUser.id)
      taskStore.fetchMyProjectNames()
    }
  }
}

function openCreateProject() {
  projectStore.openProjectModal()
}

function openSettings() {
  projectStore.openProjectModal()
}

function logout() {
  authStore.logout()
  router.push('/')
}

function onUserCreated() {
  authStore.fetchUsers()
}

function handleFileSelected(file: File) {
  uploadDoc.value = file
  uploadDocName.value = file.name.replace(/\.[^/.]+$/, '')
}

function cancelUpload() {
  uploadDoc.value = null
  uploadDocName.value = ''
}

async function confirmUpload() {
  if (!uploadDoc.value || !uploadDocName.value.trim()) return
  const result = await documentStore.uploadDocument(uploadDoc.value, uploadDocName.value.trim())
  uploadDoc.value = null
  uploadDocName.value = ''
  if (result) {
    showNotification(`DOCUMENTO "${result.name}" ENVIADO COM SUCESSO`, 'success')
  } else {
    showNotification('ERRO AO ENVIAR DOCUMENTO', 'error')
  }
}

function openDocumentViewer(doc: AppDocument) {
  viewerDoc.value = doc
}

function handleDocumentUpdate(doc: AppDocument) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const result = await documentStore.updateDocument(doc.id, file)
      if (result) {
        showNotification(`"${doc.name}" ATUALIZADO — VERSÃO v${result.version}`, 'success')
      } else {
        showNotification('ERRO AO ATUALIZAR DOCUMENTO', 'error')
      }
    }
  }
  input.click()
}

onMounted(async () => {
  if (!authStore.authenticated) {
    router.push('/')
    return
  }
  await Promise.all([
    projectStore.fetchProjects(),
    taskStore.fetchAllProjectsCompletion(),
    authStore.fetchUsers(),
    documentStore.fetchDocuments()
  ])
  taskStore.startOverdueCheck()
  loading.value = false
})

onBeforeUnmount(() => {
  taskStore.stopOverdueCheck()
})
</script>

<style scoped>
.terminal {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: var(--font-mono);
  font-size: 13px;
  padding: var(--space-xl);
  display: flex;
  flex-direction: column;
  outline: none;
}

.terminal-header {
  flex-shrink: 0;
}

.terminal-line {
  line-height: 1.7;
}

.terminal-line.dim {
  color: var(--text-dim);
  font-size: 11px;
}

.prompt {
  color: var(--blue-soft);
  margin-right: 6px;
}

.typing-text {
  letter-spacing: 2px;
}

.blink-cursor {
  animation: blink-cursor 0.8s step-end infinite;
  color: var(--blue-soft);
  margin-left: 2px;
}

.stats-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.stat-item {
  letter-spacing: 0.5px;
}

.stat-sep {
  color: var(--line-border);
}

.time-line {
  display: flex;
  align-items: center;
  gap: 6px;
}

.live-time {
  color: var(--blue-soft);
  font-weight: var(--font-weight-semibold);
}

.time-sep {
  color: var(--line-border);
}

.module-prompt {
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 1px;
}

.terminal-body {
  flex: 1;
  padding: var(--space-lg) 0;
}

.modules-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xxl);
}

.loader-text {
  color: var(--text-dim);
  font-size: 11px;
  animation: blink-cursor 1s step-end infinite;
}

.dim {
  color: var(--text-dim);
  font-size: 11px;
}

.upload-confirm {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  margin-top: 8px;
  border: 1px solid var(--blue-soft);
  background: rgba(74, 141, 184, 0.04);
}

.upload-confirm-name {
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  letter-spacing: 0.3px;
}

.upload-confirm-input {
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 5px 8px;
  border: 1px solid var(--line-border);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.upload-confirm-input:focus {
  border-color: var(--blue-secondary);
}

.upload-confirm-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.doc-section-spacer {
  height: 8px;
}

.terminal-footer {
  flex-shrink: 0;
  padding: var(--space-md) 0;
}

.footer-buttons {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.footer-btn {
  padding: 5px var(--space-lg);
  border: 1px solid var(--line-border);
  background: transparent;
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 1.5px;
  transition: all var(--transition-fast);
  text-transform: uppercase;
}

.footer-btn:hover {
  border-color: var(--blue-soft);
  color: var(--blue-soft);
}

.footer-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.footer-btn.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}

/* ─── Pasta Pessoal ─── */
.personal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
}

.personal-summary {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 0.5px;
  margin: 0;
}

.personal-highlight {
  color: var(--blue-soft);
  font-weight: var(--font-weight-bold);
}

.personal-access-btn {
  padding: 6px 20px;
  border: 1px solid var(--blue-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--blue-soft);
  letter-spacing: 1.5px;
  transition: all var(--transition-fast);
  text-transform: uppercase;
}

.personal-access-btn:hover {
  background: rgba(29, 121, 179, 0.1);
  box-shadow: 0 0 12px rgba(29, 121, 179, 0.15);
}

/* ─── Toast Notification ─── */
.toast {
  position: fixed;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  border: 1px solid var(--blue-secondary);
  background: var(--bg-elevated);
  z-index: var(--z-toast);
  animation: toast-in 0.25s ease-out;
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.4), 0 0 2px rgba(74, 141, 184, 0.2);
}

.toast.error {
  border-color: var(--danger);
  box-shadow: 0 0 24px rgba(0, 0, 0, 0.4), 0 0 2px rgba(185, 125, 125, 0.2);
}

.toast-icon {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--blue-soft);
  letter-spacing: 0.5px;
}

.toast.error .toast-icon {
  color: var(--danger);
}

.toast-msg {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-primary);
  letter-spacing: 0.8px;
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>

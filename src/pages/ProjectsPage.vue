<template>
  <div class="terminal" tabindex="0">
    <div class="terminal-header">
      <div class="terminal-line">
        <span class="prompt">[{{ username }}]</span> JOYBOARD SYSTEMS — v1.0
      </div>
      <div class="terminal-line dim">CONECTADO A: TUTILABS CORPORATIVO // {{ serverHost }}</div>
      <div class="terminal-line dim">{{ timeStr }} // {{ userRole }}</div>
      <hr class="sep-h thick">
      <div class="terminal-line" style="margin-top: 8px;">
        SELECIONE MÓDULO:
      </div>
    </div>

    <div class="terminal-body">
      <div v-if="loading" class="loading-state">
        <span class="dim">CARREGANDO...</span>
      </div>
      <ProjectList
        v-else
        :projects="projectStore.projects"
        :completion="taskStore.projectCompletion"
        @open="openProject"
      />
    </div>

    <hr class="sep-h thick">

    <div class="terminal-footer">
      <div class="footer-buttons">
        <button class="footer-btn" @click="showUserModal = true">[ CRIAR USUÁRIO ]</button>
        <button class="footer-btn" @click="openCreateProject">[ CRIAR PROJETO ]</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../stores/project'
import { useTaskStore } from '../stores/task'
import { useAuthStore } from '../stores/auth'
import { useClock } from '../composables/useClock'
import ProjectList from '../components/project/ProjectList.vue'
import ProjectFormModal from '../components/project/ProjectFormModal.vue'
import UserFormModal from '../components/auth/UserFormModal.vue'

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const authStore = useAuthStore()
const { timeStr } = useClock()

const showUserModal = ref(false)
const loading = ref(true)
const serverHost = ref(window.location.host)

const username = computed(() =>
  authStore.currentUser?.username.toUpperCase() || 'SISTEMA'
)

const userRole = computed(() => {
  const u = authStore.currentUser
  if (!u) return 'SISTEMA'
  return `${u.role} (${u.sigla})`
})

function openCreateProject() {
  projectStore.openProjectModal()
}

function openProject(id: string) {
  const project = projectStore.projects.find(p => p.id === id)
  if (project) {
    router.push(`/project/${project.slug}`)
  }
}

function logout() {
  authStore.logout()
  router.push('/')
}

function onUserCreated() {
  authStore.fetchUsers()
}

onMounted(async () => {
  if (!authStore.authenticated) {
    router.push('/')
    return
  }
  await Promise.all([
    projectStore.fetchProjects(),
    taskStore.fetchAllProjectsCompletion(),
    authStore.fetchUsers()
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

.terminal-header { flex-shrink: 0; }

.terminal-line { line-height: 1.6; }

.terminal-line.dim { color: var(--text-dim); font-size: 11px; }

.prompt { color: var(--blue-soft); margin-right: 8px; }

.terminal-body { flex: 1; padding: var(--space-lg) 0; }

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-xxl);
}

.dim { color: var(--text-dim); font-size: 11px; }

.terminal-footer {
  flex-shrink: 0;
  padding: var(--space-md) 0;
}

.footer-buttons {
  display: flex;
  justify-content: center;
  gap: var(--space-md);
}

.footer-btn {
  padding: 5px var(--space-lg);
  border: 1px solid var(--line-border);
  background: transparent;
  cursor: pointer;
  font-size: 11px;
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

.footer-btn.danger:hover {
  border-color: var(--danger);
  color: var(--danger);
}
</style>

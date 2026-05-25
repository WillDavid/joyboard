<template>
  <header class="topbar">
    <div class="topbar-left">
      <router-link to="/home" class="logo">
        <span class="logo-bracket">[</span>
        <span class="logo-text">JOYBOARD</span>
        <span class="logo-bracket">]</span>
      </router-link>
      <span class="sep-v"></span>
      <span class="tag" v-if="title">
        {{ title }}
      </span>
      <span class="tag" v-else-if="projectStore.currentProject">
        {{ projectStore.currentProject.name.toUpperCase() }}
      </span>
      <span class="sep-v" v-if="title || projectStore.currentProject"></span>
      <div class="progress-track project-progress" v-if="projectStore.currentProject && !title" style="width: 80px;">
        <div class="progress-fill static" :style="{ width: completionPercent + '%' }"></div>
      </div>
      <span class="status-label" v-if="projectStore.currentProject && !title" style="min-width: 28px;">{{ completionPercent }}%</span>
    </div>

    <div class="topbar-right">
      <div class="view-group">
        <button v-for="v in views" :key="v.key"
          class="view-btn"
          :class="{ active: uiStore.currentView === v.key }"
          @click="uiStore.setView(v.key)">
          [ {{ v.label }} ]
        </button>
        <span class="view-sep"></span>
        <button class="view-btn" @click="openSettings">[ CONFIG ]</button>
        <span class="view-sep"></span>
        <button class="view-btn sair" @click="logout">[ SAIR ]</button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectStore } from '../../stores/project'
import { useTaskStore } from '../../stores/task'
import { useUIStore } from '../../stores/ui'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{
  title?: string
  hideVisual?: boolean
}>()

const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const uiStore = useUIStore()
const authStore = useAuthStore()

const completionPercent = computed(() => {
  const tasks = taskStore.currentProjectTasks
  if (tasks.length === 0) return 0
  const done = tasks.filter(t => t.status === 'pronto').length
  return Math.round((done / tasks.length) * 100)
})

const views = computed(() => {
  const all = [
    { key: 'visual' as const, label: 'PAINEL' },
    { key: 'list' as const, label: 'LISTA' },
    { key: 'kanban' as const, label: 'KANBAN' }
  ]
  return props.hideVisual ? all.filter(v => v.key !== 'visual') : all
})

function openSettings() {
  projectStore.openProjectModal()
}

function logout() {
  authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.topbar {
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-md);
  background: var(--bg-panel);
  border-bottom: 1px solid var(--line-border);
  z-index: var(--z-topbar);
}

.topbar-left, .topbar-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.topbar-center {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.logo {
  display: flex;
  align-items: center;
  gap: 2px;
  color: var(--blue-soft);
  text-decoration: none;
}

.logo-bracket {
  font-size: 11px;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.logo-text {
  font-size: 14px;
  font-weight: var(--font-weight-bold);
  letter-spacing: 2px;
  color: var(--blue-soft);
}

.project-name {
  font-size: var(--font-size-xs);
  color: var(--text-primary);
  font-weight: var(--font-weight-semibold);
}

.view-group {
  display: flex;
  gap: 1px;
  background: var(--bg-secondary);
  border: 1px solid var(--line-border);
  padding: 2px;
}

.view-btn {
  padding: 3px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-dim);
  transition: all var(--transition-fast);
  letter-spacing: 0.8px;
  font-family: var(--font-mono);
}

.view-btn:hover { color: var(--text-primary); }

.view-btn.active {
  background: var(--bg-elevated);
  color: var(--blue-soft);
}

.view-sep {
  width: 1px;
  height: 18px;
  background: var(--line-border);
  align-self: center;
}

.view-btn.sair:hover {
  color: var(--danger);
}

.status-track {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-label {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 1px;
  text-transform: uppercase;
}

.status-label.active {
  color: var(--blue-soft);
}

</style>

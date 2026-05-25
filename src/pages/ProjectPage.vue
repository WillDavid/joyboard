<template>
  <div class="project-page" :class="`view-${uiStore.currentView}`">
    <AppTopbar :title="isGlobal ? 'GLOBAL' : undefined" :hide-visual="isGlobal" />

    <div v-if="isGlobal || uiStore.currentView !== 'visual'" class="filter-bar">
      <div class="filter-row">
        <div class="filter-search">
          <span class="filter-icon">🔍</span>
          <input
            v-model="searchText"
            class="filter-input"
            placeholder="BUSCAR ATIVIDADE..."
          />
        </div>

        <div class="filter-group">
          <button
            v-for="s in filterStatuses"
            :key="s.value"
            class="filter-chip"
            :class="{ active: filterStatus === s.value }"
            @click="filterStatus = s.value"
          >
            {{ s.label }}
          </button>
        </div>

        <div class="filter-group">
          <button
            v-for="p in filterPriorities"
            :key="p.value"
            class="filter-chip"
            :class="{ active: filterPriority === p.value }"
            @click="filterPriority = p.value"
          >
            {{ p.label }}
          </button>
        </div>

        <select v-if="isGlobal" v-model="filterProject" class="filter-select">
          <option value="">TODOS PROJETOS</option>
          <option v-for="p in allProjectOptions" :key="p.id" :value="p.id">
            {{ p.name }}
          </option>
        </select>

        <select v-model="filterResponsavel" class="filter-select">
          <option value="">TODOS RESPONSÁVEIS</option>
          <option v-for="u in authStore.users" :key="u.id" :value="u.id">
            {{ u.username.toUpperCase() }} ({{ u.sigla }})
          </option>
        </select>
      </div>
    </div>

    <template v-if="uiStore.currentView === 'visual'">
      <div class="canvas-container">
      <VueFlow
        :nodes="flowNodes"
        :edges="flowEdges"
        :zoom="uiStore.viewport.zoom"
        :pan="uiStore.viewport"
        :default-viewport="{ x: 0, y: 0, zoom: 1 }"
        :min-zoom="0.5"
        :max-zoom="2"
        snap-to-grid
        :snap-grid="[24, 24]"
        @node-drag="handleNodeDrag"
        @node-drag-stop="handleNodeDragStop"
        @pane-click="handlePaneClick"
        @move="handleMove"
        class="project-canvas"
      >
          <Background variant="dots" pattern-color="#FFFFFF" :gap="24" :size="1.5" :opacity="0.15" />

          <template #node-task=" { data } ">
            <TaskCard
              :task="data.task"
              :is-selected="uiStore.selectedTaskId === data.task.id"
              :is-connection-source="uiStore.connectionSourceId === data.task.id"
              :is-connection-mode="uiStore.isConnectionMode"
              :show-project="isGlobal"
              @click="handleTaskClick(data.task)"
              @start-connection="handleStartConnection(data.task.id)"
            />
          </template>
        </VueFlow>

        <div class="system-bar">
          <span class="sys-coord">X:{{ Math.round(uiStore.viewport.x) }}</span>
          <span class="sys-coord">Y:{{ Math.round(uiStore.viewport.y) }}</span>
          <span class="sep-v"></span>
          <span class="tag">ZOOM</span>
          <div class="zoom-controls">
            <button class="ctrl-btn" @click="handleCentralize" title="Centralizar">[CENT]</button>
            <button class="ctrl-btn" @click="uiStore.zoomOut()" title="Reduzir zoom">[-]</button>
            <span class="zoom-level">{{ Math.round(uiStore.viewport.zoom * 100) }}%</span>
            <button class="ctrl-btn" @click="uiStore.zoomIn()" title="Aumentar zoom">[+]</button>
            <button class="ctrl-btn" @click="uiStore.resetZoom()" title="Redefinir">[RESET]</button>
          </div>
        </div>

        <button
          class="fab-add-task"
          @click="handleAddTask"
          title="Adicionar nova tarefa"
        >
          [ NOVA ATIVIDADE ]
        </button>
      </div>
    </template>

    <ListView
      v-else-if="uiStore.currentView === 'list'"
      :tasks="filteredProjectTasks"
      :show-project="isGlobal"
    />

    <KanbanView
      v-else-if="uiStore.currentView === 'kanban'"
      :tasks="filteredProjectTasks"
      :show-project="isGlobal"
    />

      <TaskDetailModal
        v-if="uiStore.isTaskModalOpen && !uiStore.isCreatingTask && selectedTask && !selectedTask.parent_id"
        :task="selectedTask"
        :is-creating="false"
        @close="handleModalClose"
      />

      <SubtaskDetailModal
        v-if="uiStore.isTaskModalOpen && selectedTask && selectedTask.parent_id"
        :task="selectedTask"
        @close="handleModalClose"
      />

      <TaskDetailModal
        v-if="uiStore.isTaskModalOpen && uiStore.isCreatingTask"
        :task="null"
        :is-creating="true"
        :position-x="newTaskPosition.x"
        :position-y="newTaskPosition.y"
        @close="handleModalClose"
      />

    <ProjectFormModal
      v-if="projectStore.isProjectModalOpen"
      :edit-project="projectStore.currentProject"
      @close="projectStore.closeProjectModal()"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, markRaw, reactive, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { VueFlow, useVueFlow, type Node, type Edge } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { useProjectStore } from '../stores/project'
import { useTaskStore } from '../stores/task'
import { useUIStore } from '../stores/ui'
import { useAuthStore } from '../stores/auth'
import { useRealtime } from '../composables/useRealtime'
import AppTopbar from '../components/layout/AppTopbar.vue'
import TaskCard from '../components/task/TaskCard.vue'
import ListView from '../components/task/ListView.vue'
import KanbanView from '../components/task/KanbanView.vue'
import TaskDetailModal from '../components/task/TaskDetailModal.vue'
import SubtaskDetailModal from '../components/task/SubtaskDetailModal.vue'
import ProjectFormModal from '../components/project/ProjectFormModal.vue'
import type { Task } from '../services/supabase'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const uiStore = useUIStore()
const authStore = useAuthStore()
const { subscribeToProject } = useRealtime()

const { setViewport, fitView, setEdges } = useVueFlow()

const isGlobal = computed(() => route.params.slug === 'global')

const flowNodes = computed<Node[]>(() => {
  const base = isGlobal.value ? taskStore.allTasks : taskStore.currentProjectTasks
  return base
    .filter(t => !t.parent_id)
    .map(task => ({
      id: task.id,
      type: 'task',
      position: { x: task.position_x, y: task.position_y },
      data: { task: markRaw(task) },
      draggable: true,
      selectable: true
    }))
})

const flowEdges = computed<Edge[]>(() => {
  return taskStore.connections.map(conn => ({
    id: conn.id,
    source: conn.from_task_id,
    target: conn.to_task_id,
    type: 'smoothstep',
    style: { stroke: '#FFFFFF', strokeWidth: 1, opacity: 0.5, strokeDasharray: '3 2' },
    animated: true
  }))
})

watch(flowEdges, (edges) => {
  if (edges.length > 0) setEdges(edges)
}, { immediate: true })

watch(flowNodes, (nodes) => {
  if (nodes.length > 0 && flowEdges.value.length > 0) {
    setEdges(flowEdges.value)
  }
}, { immediate: true })

const selectedTask = computed(() => {
  if (!uiStore.selectedTaskId) return null
  return taskStore.tasks.find(t => t.id === uiStore.selectedTaskId) || null
})

const newTaskPosition = reactive({ x: 0, y: 0 })

const searchText = ref('')
const filterStatus = ref('')
const filterPriority = ref('')
const filterResponsavel = ref('')
const filterProject = ref('')

const allProjectOptions = computed(() => {
  const result: { id: string; name: string }[] = []
  for (const [id, name] of taskStore.allProjectNames) {
    result.push({ id, name })
  }
  return result
})

const filterStatuses = [
  { value: '', label: 'TODOS' },
  { value: 'criado', label: 'CRIADO' },
  { value: 'fazendo', label: 'FAZENDO' },
  { value: 'pronto', label: 'PRONTO' },
  { value: 'impedido', label: 'IMPEDIDO' }
]

const filterPriorities = [
  { value: '', label: 'TODAS' },
  { value: 'low', label: 'BAIXA' },
  { value: 'medium', label: 'MÉDIA' },
  { value: 'high', label: 'ALTA' }
]

function matchesSearch(task: Task, q: string): boolean {
  if (!q) return true
  const lower = q.toLowerCase()
  return task.title.toLowerCase().includes(lower) || (task.description || '').toLowerCase().includes(lower)
}

function matchesStatus(task: Task, s: string): boolean {
  return !s || task.status === s
}

function matchesPriority(task: Task, p: string): boolean {
  return !p || task.priority === p
}

function matchesResponsavel(task: Task, r: string): boolean {
  return !r || task.responsavel_1_id === r || task.responsavel_2_id === r
}

function matchesProject(task: Task, p: string): boolean {
  return !p || task.project_id === p
}

const filteredProjectTasks = computed(() => {
  const tasks = isGlobal.value ? taskStore.allTasks : taskStore.currentProjectTasks
  const s = searchText.value
  const st = filterStatus.value
  const pr = filterPriority.value
  const r = filterResponsavel.value
  const pj = filterProject.value

  if (!s && !st && !pr && !r && !pj) return tasks

  return tasks.filter(task =>
    matchesSearch(task, s) &&
    matchesStatus(task, st) &&
    matchesPriority(task, pr) &&
    matchesResponsavel(task, r) &&
    matchesProject(task, pj)
  )
})

async function loadProject() {
  const slug = route.params.slug as string

  if (slug === 'global') {
    if (uiStore.currentView === 'visual') uiStore.setView('list')
    await Promise.all([
      taskStore.fetchAllTasks(),
      authStore.fetchUsers()
    ])
    return
  }

  await projectStore.fetchProjects()
  const project = projectStore.projects.find(p => p.slug === slug)
  if (!project) {
    router.push('/home')
    return
  }
  projectStore.setCurrentProject(project.id)
  await Promise.all([
    taskStore.fetchTasks(project.id),
    taskStore.fetchConnections(project.id),
    authStore.fetchUsers()
  ])
  subscribeToProject()
}

function handleTaskClick(task: Task) {
  if (uiStore.isConnectionMode) {
    if (uiStore.connectionSourceId && uiStore.connectionSourceId !== task.id) {
      taskStore.createConnection(uiStore.connectionSourceId, task.id)
      uiStore.cancelConnectionMode()
    }
  } else {
    uiStore.selectTask(task.id)
  }
}

function handleStartConnection(taskId: string) {
  uiStore.startConnectionMode(taskId)
}

function handleNodeDrag(_event: any) {
  // Visual feedback during drag
}

async function handleNodeDragStop(event: any) {
  const taskId = event.node.id
  const x = event.node.position.x
  const y = event.node.position.y
  await taskStore.updateTaskPosition(taskId, x, y)
}

function handlePaneClick() {
  if (uiStore.isConnectionMode) {
    uiStore.cancelConnectionMode()
  }
  uiStore.selectTask(null)
}

function handleMove(event: any) {
  uiStore.setViewport(event.transform.x, event.transform.y, event.transform.zoom)
}

function handleAddTask() {
  newTaskPosition.x = (window.innerWidth / 2 - uiStore.viewport.x) / uiStore.viewport.zoom - 100
  newTaskPosition.y = (window.innerHeight / 2 - uiStore.viewport.y) / uiStore.viewport.zoom - 50
  uiStore.openCreateTaskModal()
}

async function handleCentralize() {
  await nextTick()
  fitView({ padding: 0.2, duration: 200 })
}

function handleModalClose() {
  uiStore.closeTaskModal()
}

watch(() => uiStore.viewport.zoom, (zoom) => {
  setViewport({ x: uiStore.viewport.x, y: uiStore.viewport.y, zoom })
})

function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()
    taskStore.undoLast()
  }
}

onMounted(() => {
  loadProject().then(() => {
    setTimeout(() => fitView({ padding: 0.4, duration: 0 }), 300)
  })
  taskStore.startOverdueCheck()
  document.addEventListener('keydown', handleKeydown)
})

watch(flowNodes, async (nodes) => {
  if (nodes.length > 0) {
    await nextTick()
    setTimeout(() => fitView({ padding: 0.4, duration: 200 }), 100)
  }
})

watch(() => uiStore.currentView, async (view) => {
  if (view === 'visual' && flowNodes.value.length > 0) {
    await nextTick()
    setTimeout(() => fitView({ padding: 0.4, duration: 200 }), 150)
  }
})

onBeforeUnmount(() => {
  taskStore.stopOverdueCheck()
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.project-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}
.canvas-container { flex: 1; position: relative; }

.project-canvas {
  width: 100%;
  height: 100%;
  background: var(--bg-primary);
}

.system-bar {
  position: fixed;
  bottom: var(--space-lg);
  left: var(--space-lg);
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--line-border);
  padding: 2px 6px;
  z-index: var(--z-card);
}

.sys-coord {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.3px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 2px;
}

.ctrl-btn {
  padding: 2px 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  transition: all var(--transition-fast);
  letter-spacing: 0.3px;
}

.ctrl-btn:hover { color: var(--blue-soft); background: var(--bg-secondary); }

.zoom-level {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  min-width: 32px;
  text-align: center;
}

.fab-add-task {
  position: fixed;
  bottom: var(--space-lg);
  right: var(--space-lg);
  padding: 3px 8px;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg-elevated);
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  cursor: pointer;
  font-size: 11px;
  font-family: var(--font-mono);
  letter-spacing: 0.5px;
  transition: all var(--transition-fast);
  z-index: var(--z-card);
}

.fab-add-task:hover { border-color: var(--blue-soft); color: var(--blue-soft); }

/* ─── Filter Bar ─── */
.filter-bar {
  flex-shrink: 0;
  padding: 6px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--line-border);
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-search {
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--line-border);
  background: var(--bg-input);
  padding: 2px 6px;
}

.filter-icon {
  font-size: 10px;
  opacity: 0.5;
}

.filter-input {
  border: none;
  background: transparent;
  padding: 3px 0;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-primary);
  outline: none;
  width: 140px;
}

.filter-input::placeholder { color: var(--text-dim); }

.filter-group {
  display: flex;
  gap: 2px;
}

.filter-chip {
  padding: 3px 8px;
  border: 1px solid var(--line-border);
  background: transparent;
  cursor: pointer;
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.5px;
  transition: all var(--transition-fast);
}

.filter-chip:hover {
  border-color: var(--blue-soft);
  color: var(--text-primary);
}

.filter-chip.active {
  border-color: var(--blue-secondary);
  color: var(--blue-soft);
  background: rgba(29, 121, 179, 0.08);
}

.filter-select {
  padding: 3px 6px;
  border: 1px solid var(--line-border);
  background: var(--bg-input);
  color: var(--text-primary);
  font-size: 9px;
  font-family: var(--font-mono);
  outline: none;
  cursor: pointer;
}

.filter-select:focus { border-color: var(--blue-secondary); }
</style>

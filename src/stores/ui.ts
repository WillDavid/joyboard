import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const selectedTaskId = ref<string | null>(null)
  const isTaskModalOpen = ref(false)
  const isProjectModalOpen = ref(false)
  const isConnectionMode = ref(false)
  const connectionSourceId = ref<string | null>(null)
  const isCreatingTask = ref(false)
  const currentView = ref<'visual' | 'list' | 'kanban'>('visual')

  const viewport = ref({
    x: 0,
    y: 0,
    zoom: 1
  })

  function selectTask(id: string | null) {
    selectedTaskId.value = id
    isTaskModalOpen.value = id !== null
    isCreatingTask.value = false
  }

  function openCreateTaskModal() {
    isCreatingTask.value = true
    isTaskModalOpen.value = true
    selectedTaskId.value = null
  }

  function closeTaskModal() {
    selectedTaskId.value = null
    isTaskModalOpen.value = false
    isCreatingTask.value = false
  }

  function openProjectModal() {
    isProjectModalOpen.value = true
  }

  function closeProjectModal() {
    isProjectModalOpen.value = false
  }

  function startConnectionMode(taskId: string) {
    isConnectionMode.value = true
    connectionSourceId.value = taskId
  }

  function cancelConnectionMode() {
    isConnectionMode.value = false
    connectionSourceId.value = null
  }

  function setViewport(x: number, y: number, zoom?: number) {
    viewport.value.x = x
    viewport.value.y = y
    if (zoom !== undefined) {
      viewport.value.zoom = zoom
    }
  }

  function setView(view: 'visual' | 'list' | 'kanban') {
    currentView.value = view
  }

  function zoomIn() {
    viewport.value.zoom = Math.min(viewport.value.zoom + 0.1, 2)
  }

  function zoomOut() {
    viewport.value.zoom = Math.max(viewport.value.zoom - 0.1, 0.5)
  }

  function resetZoom() {
    viewport.value.zoom = 1
  }

  return {
    selectedTaskId,
    isTaskModalOpen,
    isProjectModalOpen,
    isConnectionMode,
    connectionSourceId,
    isCreatingTask,
    currentView,
    viewport,
    selectTask,
    setView,
    openCreateTaskModal,
    closeTaskModal,
    openProjectModal,
    closeProjectModal,
    startConnectionMode,
    cancelConnectionMode,
    setViewport,
    zoomIn,
    zoomOut,
    resetZoom
  }
})
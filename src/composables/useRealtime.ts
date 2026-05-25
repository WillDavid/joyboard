import { ref, onUnmounted } from 'vue'
import { supabase } from '../services/supabase'
import { useTaskStore } from '../stores/task'
import { useProjectStore } from '../stores/project'

export function useRealtime() {
  const taskStore = useTaskStore()
  const projectStore = useProjectStore()

  const taskSubscription = ref<any>(null)
  const connectionSubscription = ref<any>(null)

  function subscribeToTasks() {
    if (taskSubscription.value) {
      taskSubscription.value.unsubscribe()
    }

    if (!projectStore.currentProjectId) return

    taskSubscription.value = supabase
      .channel(`tasks:${projectStore.currentProjectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `project_id=eq.${projectStore.currentProjectId}`
        },
        (payload) => {
          taskStore.handleRealtimeTask(payload)
        }
      )
      .subscribe()
  }

  function subscribeToConnections() {
    if (connectionSubscription.value) {
      connectionSubscription.value.unsubscribe()
    }

    if (!projectStore.currentProjectId) return

    connectionSubscription.value = supabase
      .channel(`connections:${projectStore.currentProjectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connections',
          filter: `project_id=eq.${projectStore.currentProjectId}`
        },
        (payload) => {
          taskStore.handleRealtimeConnection(payload)
        }
      )
      .subscribe()
  }

  function subscribeToProject() {
    subscribeToTasks()
    subscribeToConnections()
  }

  function unsubscribeAll() {
    if (taskSubscription.value) {
      taskSubscription.value.unsubscribe()
      taskSubscription.value = null
    }
    if (connectionSubscription.value) {
      connectionSubscription.value.unsubscribe()
      connectionSubscription.value = null
    }
  }

  onUnmounted(() => {
    unsubscribeAll()
  })

  return {
    subscribeToProject,
    unsubscribeAll
  }
}
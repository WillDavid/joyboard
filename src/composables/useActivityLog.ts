import { ref } from 'vue'

export interface Activity {
  id: string
  action: string
  taskId?: string
  data?: any
  userId: string
  timestamp: string
}

export function useActivityLog() {
  const activities = ref<Activity[]>([])

  function loadActivities() {
    const stored = localStorage.getItem('joyboard_activities')
    if (stored) {
      activities.value = JSON.parse(stored)
    }
  }

  function addActivity(action: string, taskId?: string, data?: any) {
    const userId = localStorage.getItem('joyboard_user_id') || 'anonymous'
    const activity: Activity = {
      id: Date.now().toString(),
      action,
      taskId,
      data,
      userId,
      timestamp: new Date().toISOString()
    }

    activities.value.unshift(activity)

    const stored = JSON.parse(localStorage.getItem('joyboard_activities') || '[]')
    stored.unshift(activity)
    localStorage.setItem('joyboard_activities', JSON.stringify(stored.slice(0, 100)))
  }

  function getRecentActivities(limit: number = 20): Activity[] {
    return activities.value.slice(0, limit)
  }

  function clearActivities() {
    activities.value = []
    localStorage.removeItem('joyboard_activities')
  }

  loadActivities()

  return {
    activities,
    addActivity,
    getRecentActivities,
    clearActivities
  }
}
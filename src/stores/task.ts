import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Task, type Comment, type Connection, type TaskImage, TASK_TABLE, COMMENT_TABLE, CONNECTION_TABLE, IMAGE_TABLE } from '../services/supabase'
import { useProjectStore } from './project'
import { useUserStore } from './user'
import { sanitize } from '../utils/security'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const comments = ref<Map<string, Comment[]>>(new Map())
  const connections = ref<Connection[]>([])
  const taskImages = ref<Map<string, TaskImage[]>>(new Map())
  const loading = ref(false)

  const projectStore = useProjectStore()
  const userStore = useUserStore()

  const currentProjectTasks = computed(() =>
    tasks.value.filter(t => t.project_id === projectStore.currentProjectId)
  )

  const undoStack = ref<{undo: () => void}[]>([])
  const maxUndo = 30

  function pushUndo(action: {undo: () => void}) {
    undoStack.value.push(action)
    if (undoStack.value.length > maxUndo) {
      undoStack.value.shift()
    }
  }

  async function undoLast() {
    const action = undoStack.value.pop()
    if (action) {
      action.undo()
    }
  }

  async function fetchTasks(projectId: string) {
    loading.value = true
    const { data, error } = await supabase
      .from(TASK_TABLE)
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching tasks:', error)
    } else {
      tasks.value = data || []
    }
    loading.value = false
  }

  async function createTask(title: string, positionX: number, positionY: number, overrides?: { description?: string | null; status?: Task['status']; priority?: Task['priority']; parent_id?: string | null; data_inicio?: string | null; data_fim_prevista?: string | null; data_finalizacao?: string | null; responsavel_1_id?: string | null; responsavel_2_id?: string | null }) {
    if (!projectStore.currentProjectId) return null

    const safeTitle = sanitize(title, 200)
    if (!safeTitle) return null
    const safeDesc = overrides?.description ? sanitize(overrides.description, 1000) : null

    const newTask: Partial<Task> = {
      project_id: projectStore.currentProjectId,
      parent_id: overrides?.parent_id ?? null,
      title: safeTitle,
      description: safeDesc,
      status: overrides?.status ?? 'criado',
      priority: overrides?.priority ?? 'medium',
      position_x: positionX,
      position_y: positionY,
      due_date: null,
      data_inicio: overrides?.data_inicio ?? null,
      responsavel_1_id: overrides?.responsavel_1_id ?? null,
      responsavel_2_id: overrides?.responsavel_2_id ?? null,
      data_fim_prevista: overrides?.data_fim_prevista ?? null,
      data_finalizacao: overrides?.data_finalizacao ?? null
    }

    const { data, error } = await supabase
      .from(TASK_TABLE)
      .insert([newTask])
      .select()
      .single()

    if (error) {
      console.error('Error creating task:', error)
      return null
    }

    if (data) {
      tasks.value.push(data)
      pushUndo({ undo: () => { deleteTask(data.id) } })
      logActivity('create', data.id)
      return data
    }
    return null
  }

  async function updateTask(id: string, updates: Partial<Task>) {
    const safe: Partial<Task> = {}
    if (updates.title !== undefined) {
      const s = sanitize(updates.title, 200)
      if (s) safe.title = s
    }
    if (updates.description !== undefined) {
      safe.description = updates.description ? sanitize(updates.description, 1000) : null
    }
    if (updates.status !== undefined) safe.status = updates.status
    if (updates.priority !== undefined) safe.priority = updates.priority
    if (updates.position_x !== undefined) safe.position_x = updates.position_x
    if (updates.position_y !== undefined) safe.position_y = updates.position_y
    if (updates.responsavel_1_id !== undefined) safe.responsavel_1_id = updates.responsavel_1_id
    if (updates.responsavel_2_id !== undefined) safe.responsavel_2_id = updates.responsavel_2_id
    if (updates.data_inicio !== undefined) safe.data_inicio = updates.data_inicio
    if (updates.data_fim_prevista !== undefined) safe.data_fim_prevista = updates.data_fim_prevista
    if (updates.data_finalizacao !== undefined) safe.data_finalizacao = updates.data_finalizacao

    // Auto-start data_inicio when status changes to 'fazendo' (first time only)
    if (updates.status === 'fazendo') {
      const existing = tasks.value.find(t => t.id === id)
      if (existing && !existing.data_inicio) {
        const d = new Date()
        d.setHours(d.getHours() - 4)
        safe.data_inicio = d.toISOString()
      }
    }

    // Auto-set data_finalizacao when status changes to 'pronto'
    if (updates.status === 'pronto') {
      const d = new Date()
      d.setHours(d.getHours() - 4)
      safe.data_finalizacao = d.toISOString()
    }

    // Clear data_finalizacao when status leaves 'pronto'
    if (updates.status && updates.status !== 'pronto') {
      const existing = tasks.value.find(t => t.id === id)
      if (existing && existing.status === 'pronto') {
        safe.data_finalizacao = null
      }
    }

    if (Object.keys(safe).length === 0) return null

    const { data, error } = await supabase
      .from(TASK_TABLE)
      .update(safe)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating task:', error)
      return null
    }

    if (data) {
      const index = tasks.value.findIndex(t => t.id === id)
      if (index !== -1) {
        const oldStatus = tasks.value[index].status
        tasks.value[index] = data
        if (updates.status && updates.status !== oldStatus) {
          logActivity('status_change', id, { from: oldStatus, to: updates.status })
        }
      }

      // Cascade impedido to connected successors
      if (updates.status === 'impedido' && data.status === 'impedido') {
        blockSuccessors(id, new Set())
      }

      return data
    }
    return null
  }

  async function updateTaskPosition(id: string, x: number, y: number) {
    const task = tasks.value.find(t => t.id === id)
    const oldX = task?.position_x ?? x
    const oldY = task?.position_y ?? y

    const { error } = await supabase
      .from(TASK_TABLE)
      .update({ position_x: x, position_y: y })
      .eq('id', id)

    if (error) {
      console.error('Error updating task position:', error)
      return false
    }

    if (task) {
      task.position_x = x
      task.position_y = y
    }

    pushUndo({ undo: () => { updateTaskPosition(id, oldX, oldY) } })
    return true
  }

  async function deleteTask(id: string) {
    const deleted = tasks.value.find(t => t.id === id)
    const relatedConns = connections.value.filter(
      c => c.from_task_id === id || c.to_task_id === id
    )

    const { error } = await supabase
      .from(TASK_TABLE)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting task:', error)
      return false
    }

    tasks.value = tasks.value.filter(t => t.id !== id)
    connections.value = connections.value.filter(
      c => c.from_task_id !== id && c.to_task_id !== id
    )

    if (deleted) {
      pushUndo({ undo: () => {
        tasks.value.push(deleted)
        relatedConns.forEach(c => connections.value.push(c))
      }})
    }

    logActivity('delete', id)
    return true
  }

  function getSubtasks(parentId: string): Task[] {
    return tasks.value.filter(t => t.parent_id === parentId)
  }

  async function createSubtask(parentId: string, title: string) {
    const safeTitle = sanitize(title, 200)
    if (!safeTitle) return null
    return createTask(safeTitle, 0, 0, { parent_id: parentId })
  }

  async function fetchImages(taskId: string) {
    const { data, error } = await supabase
      .from(IMAGE_TABLE)
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      taskImages.value.set(taskId, data)
    }
    return data || []
  }

  async function uploadImage(taskId: string, file: File) {
    const ext = file.name.split('.').pop()
    const path = `${taskId}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('task-images')
      .upload(path, file)

    if (uploadError) {
      console.error('Error uploading image:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('task-images')
      .getPublicUrl(path)

    const { data, error } = await supabase
      .from(IMAGE_TABLE)
      .insert([{ task_id: taskId, url: publicUrl }])
      .select()
      .single()

    if (!error && data) {
      const current = taskImages.value.get(taskId) || []
      taskImages.value.set(taskId, [data, ...current])
      return data
    }
    return null
  }

  async function deleteImage(imageId: string) {
    const { error } = await supabase
      .from(IMAGE_TABLE)
      .delete()
      .eq('id', imageId)

    if (!error) {
      for (const [taskId, images] of taskImages.value.entries()) {
        taskImages.value.set(taskId, images.filter(i => i.id !== imageId))
      }
    }
  }

  async function fetchComments(taskId: string) {
    const { data, error } = await supabase
      .from(COMMENT_TABLE)
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return []
    }

    const commentList = data || []
    comments.value.set(taskId, commentList)
    return commentList
  }

  async function addComment(taskId: string, content: string) {
    const safeContent = sanitize(content, 1000)
    if (!safeContent) return null

    const newComment: Partial<Comment> = {
      task_id: taskId,
      content: safeContent,
      user_id: userStore.getUserId()
    }

    const { data, error } = await supabase
      .from(COMMENT_TABLE)
      .insert([newComment])
      .select()
      .single()

    if (error) {
      console.error('Error adding comment:', error)
      return null
    }

    if (data) {
      const taskComments = comments.value.get(taskId) || []
      taskComments.push(data)
      comments.value.set(taskId, taskComments)
      logActivity('comment', taskId)
      return data
    }
    return null
  }

  async function fetchConnections(projectId: string) {
    const { data, error } = await supabase
      .from(CONNECTION_TABLE)
      .select('*')
      .eq('project_id', projectId)

    if (error) {
      console.error('Error fetching connections:', error)
      return []
    }

    connections.value = data || []
    return connections.value
  }

  async function createConnection(fromTaskId: string, toTaskId: string) {
    if (!projectStore.currentProjectId) return null

    const newConnection: Partial<Connection> = {
      project_id: projectStore.currentProjectId,
      from_task_id: fromTaskId,
      to_task_id: toTaskId
    }

    const { data, error } = await supabase
      .from(CONNECTION_TABLE)
      .insert([newConnection])
      .select()
      .single()

    if (error) {
      console.error('Error creating connection:', error)
      return null
    }

    if (data) {
      connections.value.push(data)
      pushUndo({ undo: () => { deleteConnection(data.id) } })
      logActivity('connect', fromTaskId, { to: toTaskId })
      return data
    }
    return null
  }

  async function deleteConnection(id: string) {
    const deleted = connections.value.find(c => c.id === id)

    const { error } = await supabase
      .from(CONNECTION_TABLE)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting connection:', error)
      return false
    }

    connections.value = connections.value.filter(c => c.id !== id)

    if (deleted) {
      pushUndo({ undo: () => { connections.value.push(deleted) } })
    }
    return true
  }

  function logActivity(action: string, taskId: string, data?: any) {
    const activities = JSON.parse(localStorage.getItem('joyboard_activities') || '[]')
    activities.push({
      action,
      taskId,
      data,
      userId: userStore.getUserId(),
      timestamp: new Date().toISOString()
    })
    localStorage.setItem('joyboard_activities', JSON.stringify(activities.slice(-100)))
  }

  function handleRealtimeTask(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        if (newRecord.project_id === projectStore.currentProjectId) {
          const exists = tasks.value.find(t => t.id === newRecord.id)
          if (!exists) {
            tasks.value.push(newRecord)
          }
        }
        break
      case 'UPDATE':
        const index = tasks.value.findIndex(t => t.id === newRecord.id)
        if (index !== -1) {
          tasks.value[index] = newRecord
        }
        break
      case 'DELETE':
        tasks.value = tasks.value.filter(t => t.id !== oldRecord.id)
        break
    }
  }

  const projectCompletion = ref<Map<string, number>>(new Map())

  async function fetchAllProjectsCompletion() {
    const { data, error } = await supabase
      .from(TASK_TABLE)
      .select('project_id, status')

    if (error) {
      console.error('Error fetching completion stats:', error)
      return
    }

    const stats = new Map<string, [number, number]>()
    for (const task of data || []) {
      const counts = stats.get(task.project_id) || [0, 0]
      counts[0]++
      if (task.status === 'pronto') counts[1]++
      stats.set(task.project_id, counts)
    }

    const completion = new Map<string, number>()
    for (const [pid, [total, done]] of stats) {
      completion.set(pid, total > 0 ? Math.round((done / total) * 100) : 0)
    }
    projectCompletion.value = completion
  }

  let overdueTimer: ReturnType<typeof setInterval> | null = null

  function checkOverdueTasks() {
    const now = new Date()
    for (const task of tasks.value) {
      if (!task.data_fim_prevista) continue
      if (task.status === 'pronto') continue
      const fim = new Date(task.data_fim_prevista + 'T23:59:59')
      if (now > fim && task.status !== 'impedido') {
        updateTask(task.id, { status: 'impedido' as Task['status'] })
      }
    }
  }

  function startOverdueCheck() {
    stopOverdueCheck()
    checkOverdueTasks()
    overdueTimer = setInterval(checkOverdueTasks, 30000)
  }

  function stopOverdueCheck() {
    if (overdueTimer) {
      clearInterval(overdueTimer)
      overdueTimer = null
    }
  }

  async function blockSuccessors(taskId: string, visited: Set<string>) {
    if (visited.has(taskId)) return
    visited.add(taskId)

    for (const conn of connections.value) {
      if (conn.from_task_id === taskId) {
        const target = tasks.value.find(t => t.id === conn.to_task_id)
        if (target && target.status !== 'pronto' && target.status !== 'impedido') {
          await updateTask(target.id, { status: 'impedido' as Task['status'] })
        }
      }
    }
  }

  function handleRealtimeConnection(payload: any) {
    const { eventType, new: newRecord, old: oldRecord } = payload

    switch (eventType) {
      case 'INSERT':
        if (newRecord.project_id === projectStore.currentProjectId) {
          const exists = connections.value.find(c => c.id === newRecord.id)
          if (!exists) {
            connections.value.push(newRecord)
          }
        }
        break
      case 'DELETE':
        connections.value = connections.value.filter(c => c.id !== oldRecord.id)
        break
    }
  }

  return {
    tasks,
    comments,
    connections,
    taskImages,
    loading,
    undoStack,
    undoLast,
    currentProjectTasks,
    projectCompletion,
    fetchAllProjectsCompletion,
    fetchTasks,
    createTask,
    updateTask,
    updateTaskPosition,
    deleteTask,
    getSubtasks,
    createSubtask,
    fetchImages,
    uploadImage,
    deleteImage,
    fetchComments,
    addComment,
    fetchConnections,
    createConnection,
    deleteConnection,
    handleRealtimeTask,
    handleRealtimeConnection,
    startOverdueCheck,
    stopOverdueCheck
  }
})
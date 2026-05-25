import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Project, PROJECT_TABLE } from '../services/supabase'
import { sanitize, slugify } from '../utils/security'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const currentProjectId = ref<string | null>(null)
  const loading = ref(false)
  const isProjectModalOpen = ref(false)

  const currentProject = computed(() =>
    projects.value.find(p => p.id === currentProjectId.value) || null
  )

  async function fetchProjects() {
    loading.value = true
    const { data, error } = await supabase
      .from(PROJECT_TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[PROJECT] Error fetching:', error.message)
    } else {
      projects.value = data || []
    }
    loading.value = false
  }

  async function createProject(name: string, description: string = '', color: string = '#FFFFFF') {
    const safeName = sanitize(name, 100)
    if (!safeName) return null

    const safeDesc = sanitize(description, 500)
    const slug = slugify(safeName)

    const { data, error } = await supabase
      .from(PROJECT_TABLE)
      .insert([{ name: safeName, slug, description: safeDesc, color }])
      .select()
      .single()

    // If slug collision, append random suffix
    if (error && error.code === '23505') {
      const retry = slug + '-' + Math.random().toString(36).substring(2, 6)
      const { data: retryData, error: retryError } = await supabase
        .from(PROJECT_TABLE)
        .insert([{ name: safeName, slug: retry, description: safeDesc, color }])
        .select()
        .single()
      if (retryError || !retryData) return null
      if (retryData) {
        projects.value.unshift(retryData)
        currentProjectId.value = retryData.id
        return retryData
      }
      return null
    }

    if (error) {
      console.error('[PROJECT] Error creating:', error.message)
      return null
    }

    if (data) {
      projects.value.unshift(data)
      currentProjectId.value = data.id
      return data
    }
    return null
  }

  async function updateProject(id: string, updates: Partial<Project>) {
    const safe: Partial<Project> = {}
    if (updates.name !== undefined) safe.name = sanitize(updates.name, 100)
    if (updates.description !== undefined) safe.description = sanitize(updates.description || '', 500)
    if (updates.color !== undefined) safe.color = updates.color

    if (Object.keys(safe).length === 0) return null

    const { data, error } = await supabase
      .from(PROJECT_TABLE)
      .update(safe)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PROJECT] Error updating:', error.message)
      return null
    }

    if (data) {
      const index = projects.value.findIndex(p => p.id === id)
      if (index !== -1) projects.value[index] = data
      return data
    }
    return null
  }

  async function deleteProject(id: string) {
    const { error } = await supabase
      .from(PROJECT_TABLE)
      .delete()
      .eq('id', id)

    if (error) {
      console.error('[PROJECT] Error deleting:', error.message)
      return false
    }

    projects.value = projects.value.filter(p => p.id !== id)
    if (currentProjectId.value === id) {
      currentProjectId.value = projects.value[0]?.id || null
    }
    return true
  }

  function setCurrentProject(id: string | null) {
    currentProjectId.value = id
  }

  function openProjectModal() {
    isProjectModalOpen.value = true
  }

  function closeProjectModal() {
    isProjectModalOpen.value = false
  }

  return {
    projects,
    currentProjectId,
    currentProject,
    loading,
    isProjectModalOpen,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    openProjectModal,
    closeProjectModal
  }
})
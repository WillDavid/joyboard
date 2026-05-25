import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type AppDocument, type DocumentVersion, DOCUMENT_TABLE, DOCUMENT_VERSION_TABLE } from '../services/supabase'
import { useAuthStore } from './auth'
import { sanitize } from '../utils/security'

export const useDocumentStore = defineStore('document', () => {
  const documents = ref<AppDocument[]>([])
  const versions = ref<Map<string, DocumentVersion[]>>(new Map())
  const loading = ref(false)

  const authStore = useAuthStore()

  const isManager = computed(() =>
    authStore.currentUser?.role?.toLowerCase().includes('lider') ||
    authStore.currentUser?.role?.toLowerCase().includes('gerente') ||
    authStore.currentUser?.sigla === 'L&R'
  )

  async function fetchDocuments(projectId?: string) {
    loading.value = true
    let query = supabase.from(DOCUMENT_TABLE).select('*').order('created_at', { ascending: false })
    if (projectId) query = query.eq('project_id', projectId)
    const { data, error } = await query
    if (error) {
      console.error('[DOCUMENT] Error fetching:', error.message)
    } else {
      documents.value = data || []
    }
    loading.value = false
  }

  async function uploadDocument(file: File, name: string, projectId?: string): Promise<AppDocument | null> {
    if (!authStore.currentUser) return null
    const safeName = sanitize(name, 200)
    if (!safeName) return null

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['pdf', 'doc', 'docx'].includes(ext)) return null

    const path = `documents/${Date.now()}_${safeName.replace(/[^a-zA-Z0-9-]/g, '_')}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('corporate-documents')
      .upload(path, file)

    if (uploadError) {
      console.error('[DOCUMENT] Upload error:', uploadError.message)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('corporate-documents')
      .getPublicUrl(path)

    const { data, error } = await supabase
      .from(DOCUMENT_TABLE)
      .insert([{
        name: safeName,
        file_url: publicUrl,
        file_type: ext,
        version: 1,
        uploaded_by: authStore.currentUser.id,
        project_id: projectId || null
      }])
      .select()
      .single()

    if (error) {
      console.error('[DOCUMENT] Insert error:', error.message)
      return null
    }

    if (data) {
      documents.value.unshift(data)
      await saveVersion(data.id, publicUrl, 1)
    }

    return data
  }

  async function updateDocument(docId: string, file: File): Promise<AppDocument | null> {
    if (!authStore.currentUser) return null
    const doc = documents.value.find(d => d.id === docId)
    if (!doc) return null

    const ext = file.name.split('.').pop()?.toLowerCase()
    if (!ext || !['pdf', 'doc', 'docx'].includes(ext)) return null

    const newVersion = doc.version + 1
    const path = `documents/${Date.now()}_${doc.name.replace(/[^a-zA-Z0-9-]/g, '_')}_v${newVersion}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('corporate-documents')
      .upload(path, file)

    if (uploadError) {
      console.error('[DOCUMENT] Update upload error:', uploadError.message)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('corporate-documents')
      .getPublicUrl(path)

    const { data, error } = await supabase
      .from(DOCUMENT_TABLE)
      .update({
        file_url: publicUrl,
        file_type: ext,
        version: newVersion,
        updated_at: new Date().toISOString()
      })
      .eq('id', docId)
      .select()
      .single()

    if (error) {
      console.error('[DOCUMENT] Update error:', error.message)
      return null
    }

    if (data) {
      const idx = documents.value.findIndex(d => d.id === docId)
      if (idx !== -1) documents.value[idx] = data
      await saveVersion(docId, publicUrl, newVersion)
    }

    return data
  }

  async function saveVersion(docId: string, fileUrl: string, version: number) {
    if (!authStore.currentUser) return
    const { error } = await supabase
      .from(DOCUMENT_VERSION_TABLE)
      .insert([{
        document_id: docId,
        file_url: fileUrl,
        version,
        uploaded_by: authStore.currentUser.id
      }])
    if (error) console.error('[DOCUMENT] Version save error:', error.message)
  }

  async function fetchVersions(docId: string) {
    const { data, error } = await supabase
      .from(DOCUMENT_VERSION_TABLE)
      .select('*')
      .eq('document_id', docId)
      .order('version', { ascending: false })
    if (!error && data) {
      versions.value.set(docId, data)
    }
  }

  async function deleteDocument(docId: string) {
    const { error } = await supabase.from(DOCUMENT_TABLE).delete().eq('id', docId)
    if (error) {
      console.error('[DOCUMENT] Delete error:', error.message)
      return false
    }
    documents.value = documents.value.filter(d => d.id !== docId)
    return true
  }

  return {
    documents,
    versions,
    loading,
    isManager,
    fetchDocuments,
    uploadDocument,
    updateDocument,
    fetchVersions,
    deleteDocument
  }
})

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase, type AppUser, USER_TABLE } from '../services/supabase'

export const useAuthStore = defineStore('auth', () => {
  const users = ref<AppUser[]>([])
  const currentUser = ref<AppUser | null>(null)
  const authenticated = ref(false)

  async function fetchUsers(): Promise<AppUser[]> {
    const { data, error } = await supabase
      .from(USER_TABLE)
      .select('id, username, role, sigla, created_at')

    if (error) {
      console.error('[AUTH] Error fetching users:', error.message)
      return []
    }

    users.value = (data || []).map(u => ({
      ...u,
      password: '',
      role: u.role || 'Desenvolvimento e Novos Projetos',
      sigla: u.sigla || 'DNP'
    }))
    return users.value
  }

  async function login(code: string): Promise<boolean> {
    const safeCode = code.trim()
    if (!safeCode) return false

    const { data, error } = await supabase
      .from(USER_TABLE)
      .select('id, username, role, sigla, created_at')
      .eq('password', safeCode)
      .maybeSingle()

    if (error || !data) {
      return false
    }

    currentUser.value = { ...data, password: '' }
    authenticated.value = true
    return true
  }

  function logout() {
    currentUser.value = null
    authenticated.value = false
    localStorage.removeItem('joyboard_session')
  }

  return {
    users,
    currentUser,
    authenticated,
    fetchUsers,
    login,
    logout
  }
})

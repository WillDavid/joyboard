<template>
  <div class="terminal" tabindex="0">
    <LoginScreen
      ref="loginRef"
      @login="handleLogin"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import LoginScreen from '../components/auth/LoginScreen.vue'

const STORAGE_KEY = 'joyboard_session'
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 * 1000

const router = useRouter()
const authStore = useAuthStore()
const loginRef = ref<InstanceType<typeof LoginScreen> | null>(null)

function restoreSession(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (!data.user || !data.timestamp) return false
    if (Date.now() - data.timestamp > SESSION_MAX_AGE) {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
    authStore.currentUser = data.user
    authStore.authenticated = true
    return true
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return false
  }
}

async function handleLogin(code: string) {
  const ok = await authStore.login(code)
  if (ok) {
    try {
      const data = { user: authStore.currentUser, timestamp: Date.now() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {}
    router.push('/home')
  } else {
    loginRef.value?.setError('[ ACESSO NEGADO ]')
  }
}

onMounted(async () => {
  await authStore.fetchUsers()
  if (restoreSession()) {
    router.push('/home')
  }
})
</script>

<style scoped>
.terminal {
  min-height: 100vh;
  background: var(--bg-primary);
  display: flex;
  outline: none;
}
</style>

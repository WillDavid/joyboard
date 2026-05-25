<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="user-modal">
      <div class="modal-bar"></div>
      <h2>NOVO OPERADOR</h2>
      <form @submit.prevent="saveUser">
        <div class="form-group">
          <label>NOME DE USUÁRIO</label>
          <input v-model="username" type="text" placeholder="IDENTIFICADOR" required maxlength="32" autocomplete="off" />
        </div>
        <div class="form-group">
          <label>FUNÇÃO</label>
          <div class="role-list">
            <button
              v-for="r in roles"
              :key="r.sigla"
              class="role-opt"
              :class="{ active: selectedRole === r.sigla }"
              @click="selectedRole = r.sigla"
            >
              <span class="role-name">{{ r.name }}</span>
              <span class="role-sigla">({{ r.sigla }})</span>
            </button>
          </div>
        </div>
        <div class="form-group">
          <label>SENHA</label>
          <input v-model="password" type="password" placeholder="********" required minlength="4" autocomplete="new-password" />
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" @click="$emit('close')">[ CANCELAR ]</button>
          <button type="submit" class="btn btn-primary" :disabled="!canSave">[ CRIAR ]</button>
        </div>
      </form>
      <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { supabase, USER_TABLE } from '../../services/supabase'
import { sanitize } from '../../utils/security'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'created'): void
}>()

const roles = [
  { name: 'Desenvolvimento e Novos Projetos', sigla: 'DNP' },
  { name: 'Documentacao e Apresentacao', sigla: 'D&A' },
  { name: 'Lider e Responsavel', sigla: 'L&R' },
  { name: 'Sustentacao e Suporte', sigla: 'S&S' }
]

const username = ref('')
const password = ref('')
const selectedRole = ref('DNP')
const errorMsg = ref('')

const canSave = computed(() =>
  username.value.trim().length >= 2 && password.value.trim().length >= 4
)

async function saveUser() {
  const safeUser = sanitize(username.value, 32)
  const safePass = password.value.trim()
  if (!safeUser || safePass.length < 4) return

  const role = roles.find(r => r.sigla === selectedRole.value)
  if (!role) return

  const { error } = await supabase
    .from(USER_TABLE)
    .insert([{
      username: safeUser,
      password: safePass,
      role: role.name,
      sigla: role.sigla
    }])

  if (error) {
    if (error.code === '23505') {
      errorMsg.value = '[ USUÁRIO JÁ EXISTE ]'
    } else {
      errorMsg.value = '[ ERRO AO CRIAR ]'
    }
    return
  }

  emit('created')
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 21, 42, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.user-modal {
  width: 400px;
  max-width: 90vw;
  background: var(--bg-elevated);
  padding: var(--space-xl);
  border: 1px solid var(--line-border);
}

.modal-bar {
  height: 2px;
  background: var(--blue-soft);
  margin: calc(-1 * var(--space-xl)) calc(-1 * var(--space-xl)) var(--space-lg) calc(-1 * var(--space-xl));
}

h2 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--blue-soft);
  margin-bottom: var(--space-lg);
  letter-spacing: 2px;
  font-family: var(--font-mono);
}

.form-group {
  margin-bottom: var(--space-md);
}

.form-group label {
  display: block;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--text-dim);
  letter-spacing: 1px;
  margin-bottom: var(--space-sm);
  text-transform: uppercase;
}

.form-group input {
  width: 100%;
  font-family: var(--font-mono);
  font-size: 11px;
  padding: 6px 8px;
  border: 1px solid var(--line-border);
  background: var(--bg-input);
  color: var(--text-primary);
  outline: none;
}

.form-group input:focus {
  border-color: var(--blue-secondary);
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.role-opt {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  border: 1px solid var(--line-border);
  background: transparent;
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 0.5px;
  transition: all var(--transition-fast);
  text-align: left;
}

.role-opt:hover {
  border-color: var(--blue-soft);
  color: var(--text-primary);
}

.role-opt.active {
  border-color: var(--blue-soft);
  color: var(--blue-soft);
  background: rgba(74, 141, 184, 0.05);
}

.role-name { flex: 1; letter-spacing: 0.8px; }
.role-sigla { color: var(--text-dim); font-size: 11px; letter-spacing: 0.5px; }

.form-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  margin-top: var(--space-lg);
}

.error-msg {
  color: var(--danger);
  font-size: 10px;
  font-family: var(--font-mono);
  letter-spacing: 1px;
  text-align: center;
  margin-top: var(--space-md);
}
</style>

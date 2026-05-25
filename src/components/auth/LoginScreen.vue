<template>
  <div class="login-screen">
    <div class="login-logo">
      <span class="logo-bracket">[</span>
      <span class="logo-name">JOYBOARD</span>
      <span class="logo-bracket">]</span>
    </div>
    <div class="login-sub">SYSTEMS v1.0</div>

    <hr class="sep-h thick" style="width: 320px; margin: var(--space-lg) auto;">

    <div class="form-group">
      <label>CÓDIGO DE ACESSO</label>
      <input
        ref="codeRef"
        v-model="code"
        type="password"
        placeholder="********"
        autocomplete="off"
        @keydown.enter="submit"
      />
    </div>

    <div class="login-error" v-if="errorMsg">
      {{ errorMsg }}
    </div>

    <button
      class="login-btn"
      :disabled="!code.trim()"
      @click="submit"
    >
      [ ENTRAR ]
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const emit = defineEmits<{
  (e: 'login', code: string): void
}>()

const code = ref('')
const errorMsg = ref('')
const codeRef = ref<HTMLInputElement | null>(null)

function submit() {
  if (!code.value.trim()) return
  emit('login', code.value)
}

function setError(msg: string) {
  errorMsg.value = msg
  code.value = ''
  nextTick(() => codeRef.value?.focus())
}

function reset() {
  code.value = ''
  errorMsg.value = ''
  nextTick(() => codeRef.value?.focus())
}

defineExpose({ setError, reset })
</script>

<style scoped>
.login-screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  max-width: 360px;
  margin: 0 auto;
  width: 100%;
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 4px;
}

.logo-bracket {
  font-size: 24px;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.logo-name {
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  color: var(--blue-soft);
  letter-spacing: 6px;
}

.login-sub {
  font-size: 11px;
  color: var(--text-dim);
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-top: var(--space-sm);
}

.form-group {
  width: 100%;
  margin-bottom: var(--space-md);
}

.form-group label {
  display: block;
  font-size: 11px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--text-dim);
  letter-spacing: 1.5px;
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
  transition: border-color var(--transition-fast);
}

.form-group input:focus {
  border-color: var(--blue-secondary);
}

.login-error {
  color: var(--danger);
  font-size: 10px;
  font-family: var(--font-mono);
  letter-spacing: 1px;
  margin-bottom: var(--space-sm);
  width: 100%;
  text-align: center;
}

.login-btn {
  width: 100%;
  padding: 6px;
  border: 1px solid var(--line-border);
  background: transparent;
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 2px;
  transition: all var(--transition-fast);
  text-transform: uppercase;
}

.login-btn:hover:not(:disabled) {
  border-color: var(--blue-soft);
  color: var(--blue-soft);
}

.login-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>

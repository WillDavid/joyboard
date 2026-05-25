<template>
  <div class="viewer-overlay" @click.self="emit('close')">
    <div class="viewer-modal">
      <div class="viewer-bar"></div>
      <button class="viewer-close" @click="emit('close')">[ ESC ]</button>

      <div class="viewer-header">
        <span class="tag">{{ typeLabel(doc.file_type) }}</span>
        <span class="viewer-name">{{ doc.name }}</span>
        <span class="viewer-version">v{{ doc.version }}</span>
      </div>

      <div class="viewer-body">
        <iframe
          v-if="doc.file_type === 'pdf'"
          :src="doc.file_url"
          class="pdf-iframe"
        ></iframe>

        <div v-else class="doc-info">
          <div class="info-row">
            <span class="info-label">NOME</span>
            <span class="info-value">{{ doc.name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">TIPO</span>
            <span class="info-value">{{ typeLabel(doc.file_type) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">VERSÃO</span>
            <span class="info-value">v{{ doc.version }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">UPLOAD</span>
            <span class="info-value">{{ formatDate(doc.created_at) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">ATUALIZAÇÃO</span>
            <span class="info-value">{{ formatDate(doc.updated_at) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">RESPONSÁVEL</span>
            <span class="info-value">{{ responsibleName }}</span>
          </div>

          <a :href="doc.file_url" class="btn btn-primary download-btn" download>
            [ BAIXAR ARQUIVO ]
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { AppDocument } from '../../services/supabase'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{
  doc: AppDocument
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const authStore = useAuthStore()

function typeLabel(type: string): string {
  const labels: Record<string, string> = { pdf: 'PDF', doc: 'DOC', docx: 'DOCX' }
  return labels[type] || type.toUpperCase()
}

function formatDate(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const responsibleName = computed(() => {
  const u = authStore.users.find(u => u.id === props.doc.uploaded_by)
  return u ? u.username.toUpperCase() : '—'
})
</script>

<style scoped>
.viewer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 21, 42, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
}

.viewer-modal {
  width: 800px;
  max-width: 90vw;
  max-height: 90vh;
  background: var(--bg-panel);
  border: 1px solid var(--line-border);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 0 32px rgba(0, 0, 0, 0.5);
}

.viewer-bar {
  height: 2px;
  background: var(--blue-secondary);
  flex-shrink: 0;
}

.viewer-close {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 6px;
  border: 1px solid var(--line-border);
  background: var(--bg-elevated);
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  z-index: 1;
  transition: all var(--transition-fast);
}

.viewer-close:hover {
  border-color: var(--danger);
  color: var(--danger);
}

.viewer-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid var(--line-divider);
}

.viewer-name {
  flex: 1;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.viewer-version {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  padding: 1px 4px;
}

.viewer-body {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.pdf-iframe {
  width: 100%;
  height: 70vh;
  border: 1px solid var(--line-border);
  background: white;
}

.doc-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 0;
}

.info-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--line-divider);
}

.info-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 100px;
}

.info-value {
  color: var(--text-primary);
  font-size: 13px;
}

.download-btn {
  margin-top: 16px;
  align-self: flex-start;
}
</style>

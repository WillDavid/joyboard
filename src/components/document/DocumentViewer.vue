<template>
  <div class="viewer-overlay" @click.self="emit('close')">
    <div class="viewer-modal">
      <div class="viewer-top-bar">
        <div class="viewer-top-left">
          <span class="vt-bracket">[</span>
          <span class="viewer-type-tag" :class="doc.file_type">{{ typeLabel(doc.file_type) }}</span>
          <span class="vt-bracket">]</span>
          <span class="viewer-name">{{ doc.name }}</span>
        </div>
        <div class="viewer-top-right">
          <span class="viewer-version-badge">v{{ doc.version }}</span>
          <div class="viewer-top-actions">
            <a :href="doc.file_url" target="_blank" class="v-btn" title="Baixar">[ BAIXAR ]</a>
            <button class="v-btn close-btn" @click="emit('close')">[ FECHAR ]</button>
          </div>
        </div>
      </div>

      <div class="viewer-body">
        <iframe
          v-if="doc.file_type === 'pdf'"
          :src="doc.file_url"
          class="pdf-iframe"
          title="Visualizador de PDF"
        ></iframe>

        <div v-else class="doc-info-panel">
          <div class="dip-header">
            <span class="dip-icon">[{{ typeLabel(doc.file_type) }}]</span>
            <span class="dip-title">{{ doc.name }}</span>
          </div>
          <div class="dip-grid">
            <div class="dip-row">
              <span class="dip-label">VERSÃO</span>
              <span class="dip-value">v{{ doc.version }}</span>
            </div>
            <div class="dip-row">
              <span class="dip-label">TIPO</span>
              <span class="dip-value">{{ typeLabel(doc.file_type) }}</span>
            </div>
            <div class="dip-row">
              <span class="dip-label">UPLOAD</span>
              <span class="dip-value">{{ formatDate(doc.created_at) }}</span>
            </div>
            <div class="dip-row">
              <span class="dip-label">ATUALIZAÇÃO</span>
              <span class="dip-value">{{ formatDate(doc.updated_at) }}</span>
            </div>
            <div class="dip-row">
              <span class="dip-label">RESPONSÁVEL</span>
              <span class="dip-value">{{ responsibleName }}</span>
            </div>
          </div>
          <div class="dip-actions">
            <a :href="doc.file_url" target="_blank" class="dip-btn">
              [ BAIXAR ARQUIVO ]
              <span class="dip-btn-hint">→</span>
            </a>
          </div>
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
  background: rgba(2, 10, 24, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  backdrop-filter: blur(4px);
}

.viewer-modal {
  width: 94vw;
  max-width: 1400px;
  height: 92vh;
  max-height: 92vh;
  background: var(--bg-panel);
  border: 1px solid var(--line-border);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 0 48px rgba(0, 0, 0, 0.6), 0 0 2px rgba(74, 141, 184, 0.15);
}

/* ─── Top Bar ─── */
.viewer-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--line-border);
  flex-shrink: 0;
  gap: 12px;
}

.viewer-top-left {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  flex: 1;
}

.vt-bracket {
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 11px;
}

.viewer-type-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 5px;
  border: 1px solid var(--line-border);
  letter-spacing: 0.5px;
  font-weight: var(--font-weight-semibold);
}

.viewer-type-tag.pdf { color: var(--danger); border-color: var(--danger); }
.viewer-type-tag.doc { color: var(--blue-soft); border-color: var(--blue-soft); }
.viewer-type-tag.docx { color: var(--blue-secondary); border-color: var(--blue-secondary); }

.viewer-name {
  font-size: 13px;
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: 4px;
}

.viewer-top-right {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.viewer-version-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  padding: 1px 6px;
  letter-spacing: 0.3px;
}

.viewer-top-actions {
  display: flex;
  gap: 4px;
}

.v-btn {
  padding: 4px 10px;
  border: 1px solid var(--line-border);
  background: var(--bg-elevated);
  cursor: pointer;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  letter-spacing: 1px;
  transition: all var(--transition-fast);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
}

.v-btn:hover {
  border-color: var(--blue-soft);
  color: var(--blue-soft);
  background: rgba(74, 141, 184, 0.06);
}

.close-btn:hover {
  border-color: var(--danger);
  color: var(--danger);
}

/* ─── Body ─── */
.viewer-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  padding: 0;
}

.pdf-iframe {
  width: 100%;
  height: 100%;
  border: none;
  background: #fff;
}

/* ─── DOC/DOCX info panel ─── */
.doc-info-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 40px;
  gap: 24px;
}

.dip-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dip-icon {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  padding: 3px 8px;
}

.dip-title {
  font-size: 16px;
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  letter-spacing: 0.5px;
}

.dip-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
  max-width: 480px;
}

.dip-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border: 1px solid var(--line-divider);
  background: var(--bg-secondary);
}

.dip-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  min-width: 120px;
}

.dip-value {
  color: var(--text-primary);
  font-size: 12px;
  font-family: var(--font-mono);
}

.dip-actions {
  margin-top: 8px;
}

.dip-btn {
  padding: 6px 20px;
  border: 1px solid var(--blue-secondary);
  background: transparent;
  cursor: pointer;
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--blue-soft);
  letter-spacing: 1.5px;
  transition: all var(--transition-fast);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dip-btn:hover {
  background: rgba(29, 121, 179, 0.1);
  box-shadow: 0 0 12px rgba(29, 121, 179, 0.15);
}

.dip-btn-hint {
  font-size: 14px;
  transition: transform var(--transition-fast);
}

.dip-btn:hover .dip-btn-hint {
  transform: translateX(3px);
}
</style>

<template>
  <div class="doc-list">
    <div class="doc-header">
      <span class="col-name">DOCUMENTO</span>
      <span class="col-type">TIPO</span>
      <span class="col-version">VERSÃO</span>
      <span class="col-date">UPLOAD</span>
      <span class="col-update">ATUALIZAÇÃO</span>
      <span class="col-user">RESPONSÁVEL</span>
      <span class="col-actions">AÇÕES</span>
    </div>

    <div v-if="documents.length === 0" class="doc-empty">
      NENHUM DOCUMENTO CADASTRADO
    </div>

    <div
      v-for="doc in documents"
      :key="doc.id"
      class="doc-row"
    >
      <span class="col-name">
        <span class="doc-icon" :class="doc.file_type">[{{ typeLabel(doc.file_type) }}]</span>
        <span class="doc-name">{{ doc.name }}</span>
      </span>
      <span class="col-type">{{ typeLabel(doc.file_type) }}</span>
      <span class="col-version">v{{ doc.version }}</span>
      <span class="col-date">{{ formatDate(doc.created_at) }}</span>
      <span class="col-update">{{ formatDate(doc.updated_at) }}</span>
      <span class="col-user">{{ getResponsibleName(doc.uploaded_by) }}</span>
      <span class="col-actions">
        <button class="action-btn" @click="handleView(doc)" title="Visualizar">[VER]</button>
        <a :href="doc.file_url" class="action-btn" download title="Download">[DL]</a>
        <button v-if="canUpdate" class="action-btn" @click="handleUpdate(doc)" title="Atualizar">[UP]</button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { AppDocument } from '../../services/supabase'
import { useAuthStore } from '../../stores/auth'

const props = defineProps<{
  documents: AppDocument[]
  canUpdate: boolean
}>()

const emit = defineEmits<{
  (e: 'view', doc: AppDocument): void
  (e: 'update', doc: AppDocument): void
}>()

const authStore = useAuthStore()

function typeLabel(type: string): string {
  const labels: Record<string, string> = { pdf: 'PDF', doc: 'DOC', docx: 'DOCX' }
  return labels[type] || type.toUpperCase()
}

function formatDate(d: string): string {
  if (!d) return '—'
  const date = new Date(d)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function getResponsibleName(userId: string): string {
  if (!userId) return '—'
  const u = authStore.users.find(u => u.id === userId)
  return u ? u.username.toUpperCase() : userId.slice(0, 6)
}

function handleView(doc: AppDocument) {
  emit('view', doc)
}

function handleUpdate(doc: AppDocument) {
  emit('update', doc)
}
</script>

<style scoped>
.doc-list {
  width: 100%;
}

.doc-header {
  display: grid;
  grid-template-columns: 2fr 0.6fr 0.5fr 0.8fr 0.8fr 0.8fr 0.8fr;
  gap: 6px;
  padding: 6px 8px;
  background: var(--bg-panel);
  font-size: 9px;
  font-family: var(--font-mono);
  font-weight: var(--font-weight-semibold);
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 1px solid var(--line-border);
}

.doc-row {
  display: grid;
  grid-template-columns: 2fr 0.6fr 0.5fr 0.8fr 0.8fr 0.8fr 0.8fr;
  gap: 6px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--line-divider);
  align-items: center;
  transition: background var(--transition-fast);
  font-size: 11px;
}

.doc-row:hover {
  background: rgba(74, 141, 184, 0.03);
}

.doc-row:last-child { border-bottom: none; }

.doc-empty {
  padding: 20px;
  text-align: center;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 1px;
}

.doc-icon {
  font-family: var(--font-mono);
  font-size: 9px;
  padding: 1px 3px;
  border: 1px solid var(--line-border);
  letter-spacing: 0.3px;
}

.doc-icon.pdf { color: var(--danger); border-color: var(--danger); }
.doc-icon.doc { color: var(--blue-soft); border-color: var(--blue-soft); }
.doc-icon.docx { color: var(--blue-secondary); border-color: var(--blue-secondary); }

.col-name {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
}

.doc-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--text-primary);
}

.col-type, .col-version, .col-date, .col-update, .col-user {
  color: var(--text-secondary);
  font-family: var(--font-mono);
  font-size: 10px;
}

.action-btn {
  padding: 1px 4px;
  border: 1px solid var(--line-border);
  background: transparent;
  cursor: pointer;
  font-size: 9px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  transition: all var(--transition-fast);
  text-decoration: none;
  display: inline-flex;
  letter-spacing: 0.5px;
}

.action-btn:hover {
  border-color: var(--blue-soft);
  color: var(--blue-soft);
}

.col-actions {
  display: flex;
  gap: 2px;
}
</style>

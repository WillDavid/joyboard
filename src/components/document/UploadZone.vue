<template>
  <div
    class="upload-zone"
    :class="{ 'drag-over': isDragging }"
    @dragenter.prevent="isDragging = true"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
  >
    <input
      ref="fileInputRef"
      type="file"
      accept=".pdf,.doc,.docx"
      hidden
      @change="handleFileSelect"
    />
    <div class="upload-icon">
      <span class="upload-bracket">[</span>
      <span class="upload-arrow">↑</span>
      <span class="upload-bracket">]</span>
    </div>
    <p class="upload-text" v-if="!isDragging">
      SOLTE O ARQUIVO AQUI
    </p>
    <p class="upload-text active" v-else>
      SOLTE PARA ENVIAR
    </p>
    <p class="upload-sub">
      ou <span class="upload-link" @click="openFilePicker">clique para selecionar</span>
      — PDF, DOC, DOCX
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'file-selected', file: File): void
}>()

const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)

function openFilePicker() {
  fileInputRef.value?.click()
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
    emit('file-selected', file)
  }
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) emit('file-selected', file)
  target.value = ''
}
</script>

<style scoped>
.upload-zone {
  border: 1px dashed var(--line-border);
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  background: var(--bg-secondary);
}

.upload-zone:hover {
  border-color: var(--blue-soft);
  background: rgba(74, 141, 184, 0.03);
}

.upload-zone.drag-over {
  border-color: var(--blue-secondary);
  border-style: solid;
  background: rgba(29, 121, 179, 0.08);
  box-shadow: 0 0 16px rgba(29, 121, 179, 0.15), inset 0 0 16px rgba(29, 121, 179, 0.05);
}

.upload-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  margin-bottom: 8px;
}

.upload-bracket {
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 14px;
}

.upload-arrow {
  color: var(--blue-soft);
  font-family: var(--font-mono);
  font-size: 16px;
  animation: upload-bounce 1.5s ease-in-out infinite;
}

@keyframes upload-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

.upload-text {
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 2px;
  margin: 0 0 6px;
}

.upload-text.active {
  color: var(--blue-soft);
  animation: text-glow 0.8s ease-in-out infinite alternate;
}

@keyframes text-glow {
  from { text-shadow: 0 0 4px rgba(74, 141, 184, 0.3); }
  to { text-shadow: 0 0 12px rgba(74, 141, 184, 0.6); }
}

.upload-sub {
  font-size: 10px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  margin: 0;
  letter-spacing: 0.5px;
}

.upload-link {
  color: var(--blue-soft);
  text-decoration: underline;
  cursor: pointer;
}
</style>

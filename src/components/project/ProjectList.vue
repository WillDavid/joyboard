<template>
  <div class="project-list">
    <div
      v-for="(project, i) in projects"
      :key="project.id"
      class="project-entry"
      @click="openProject(project.id)"
    >
      <span class="entry-id">{{ String(i + 1).padStart(2, '0') }}</span>
      <span class="entry-sep">|</span>
      <span class="entry-name">{{ project.name.toUpperCase() }}</span>
      <span class="entry-pct">{{ getPercent(project.id) }}%</span>
      <div class="progress-track" style="width: 60px;">
        <div class="progress-fill static" :style="{ width: getPercent(project.id) + '%' }"></div>
      </div>
    </div>

    <div v-if="projects.length === 0" class="empty-state">
      <div class="dim">NENHUM MÓDULO REGISTRADO</div>
      <div class="dim" style="margin-top: 4px;">USE O COMANDO ABAIXO PARA CRIAR</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '../../services/supabase'

const props = defineProps<{
  projects: Project[]
  completion: Map<string, number>
}>()

const emit = defineEmits<{
  (e: 'open', id: string): void
}>()

function getPercent(id: string): number {
  return props.completion.get(id) ?? 0
}

function openProject(id: string) {
  emit('open', id)
}
</script>

<style scoped>
.project-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.project-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  cursor: pointer;
  transition: background 0.1s;
}

.project-entry:hover {
  background: rgba(142, 183, 214, 0.05);
}

.entry-id {
  color: var(--text-dim);
  font-size: 11px;
  min-width: 20px;
  font-family: var(--font-mono);
}

.entry-sep {
  color: var(--line-border);
  font-size: 11px;
}

.entry-name {
  flex: 1;
  letter-spacing: 1px;
}

.entry-pct {
  font-size: 11px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  min-width: 28px;
  text-align: right;
  letter-spacing: 0.3px;
}

.empty-state {
  padding: var(--space-xl) 8px;
  text-align: center;
}

.dim {
  color: var(--text-dim);
  font-size: 11px;
}
</style>

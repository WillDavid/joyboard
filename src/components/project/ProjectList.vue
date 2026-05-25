<template>
  <div class="project-list">
    <div
      v-for="project in projects"
      :key="project.id"
      class="project-entry"
      @click="openProject(project)"
    >
      <span class="tree-conn">├─</span>
      <span class="entry-name">{{ project.name.toUpperCase() }}</span>
      <span class="entry-pct">{{ getPercent(project.id) }}%</span>
      <div class="progress-track" style="width: 60px;">
        <div class="progress-fill static" :style="{ width: getPercent(project.id) + '%' }"></div>
      </div>
    </div>

    <div v-if="projects.length === 0" class="empty-state">
      <span class="dim">NENHUM PROJETO REGISTRADO</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { Project } from '../../services/supabase'

const props = defineProps<{
  projects: Project[]
  completion: Map<string, number>
}>()

const router = useRouter()

function getPercent(id: string): number {
  return props.completion.get(id) ?? 0
}

function openProject(project: Project) {
  router.push(`/project/${project.slug}`)
}
</script>

<style scoped>
.project-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.project-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  cursor: pointer;
  transition: all var(--transition-fast);
  border-left: 1px solid transparent;
}

.project-entry:hover {
  background: rgba(74, 141, 184, 0.05);
  border-left-color: var(--blue-soft);
}

.tree-conn {
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 11px;
  min-width: 22px;
}

.entry-name {
  flex: 1;
  letter-spacing: 1px;
  font-size: 12px;
  color: var(--text-primary);
}

.entry-pct {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  min-width: 28px;
  text-align: right;
  letter-spacing: 0.3px;
}

.empty-state {
  padding: 16px 8px;
  text-align: center;
}

.dim {
  color: var(--text-dim);
  font-size: 11px;
  font-family: var(--font-mono);
}
</style>

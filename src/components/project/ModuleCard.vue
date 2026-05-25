<template>
  <div class="module-card" :class="{ expanded }">
    <div class="module-header" @click="toggle">
      <span class="module-id">{{ id }}</span>
      <span class="module-sep">|</span>
      <span class="module-title">{{ title }}</span>
      <span class="module-count">{{ count }}</span>
      <span class="module-arrow" :class="{ open: expanded }">{{ expanded ? '▼' : '▶' }}</span>
    </div>
    <div class="module-body" :class="{ open: expanded }">
      <div class="module-content">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  id: string
  title: string
  count: number
  expanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
}>()

function toggle() {
  emit('toggle')
}
</script>

<style scoped>
.module-card {
  border: 1px solid var(--line-border);
  background: var(--bg-secondary);
  transition: all var(--transition-normal);
}

.module-card:hover {
  border-color: var(--blue-soft);
  box-shadow: 0 0 8px rgba(74, 141, 184, 0.08);
}

.module-card.expanded {
  border-color: var(--blue-secondary);
  box-shadow: 0 0 12px rgba(29, 121, 179, 0.12);
}

.module-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  user-select: none;
  transition: background var(--transition-fast);
}

.module-header:hover {
  background: rgba(74, 141, 184, 0.04);
}

.module-id {
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 11px;
  min-width: 20px;
}

.module-sep {
  color: var(--line-border);
  font-size: 11px;
}

.module-title {
  flex: 1;
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  letter-spacing: 1.5px;
  color: var(--text-primary);
  text-transform: uppercase;
}

.module-count {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-dim);
  border: 1px solid var(--line-border);
  padding: 0 6px;
  line-height: 18px;
}

.module-arrow {
  font-size: 8px;
  color: var(--text-dim);
  transition: transform var(--transition-normal);
  width: 12px;
  text-align: center;
}

.module-body {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out, opacity 0.25s ease-out;
  opacity: 0;
}

.module-body.open {
  max-height: 600px;
  opacity: 1;
}

.module-content {
  padding: 4px 12px 12px;
  border-top: 1px solid var(--line-divider);
}
</style>

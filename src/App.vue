<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useProjectStore } from './stores/project'

const authStore = useAuthStore()
const projectStore = useProjectStore()

onMounted(() => {
  authStore.restoreSession()
  projectStore.fetchProjects()
})
</script>

<template>
  <router-view />
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
@import '@vue-flow/controls/dist/style.css';
</style>
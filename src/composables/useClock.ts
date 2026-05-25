import { ref, onMounted, onBeforeUnmount } from 'vue'

export function useClock() {
  const now = ref(new Date())

  const timeStr = ref('')
  const dateStr = ref('')

  let timer: ReturnType<typeof setInterval> | null = null

  function update() {
    now.value = new Date()
    timeStr.value = now.value.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    dateStr.value = now.value.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  onMounted(() => {
    update()
    timer = setInterval(update, 1000)
  })

  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
  })

  return { now, timeStr, dateStr }
}

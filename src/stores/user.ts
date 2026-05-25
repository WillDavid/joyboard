import { defineStore } from 'pinia'
import { ref } from 'vue'
import { v4 as uuidv4 } from 'uuid'

const USER_ID_KEY = 'joyboard_user_id'

export const useUserStore = defineStore('user', () => {
  const userId = ref<string>('')

  function initUserId() {
    let stored = localStorage.getItem(USER_ID_KEY)
    if (!stored) {
      stored = uuidv4()
      localStorage.setItem(USER_ID_KEY, stored)
    }
    userId.value = stored
  }

  function getUserId(): string {
    if (!userId.value) {
      initUserId()
    }
    return userId.value
  }

  const userColor = ref<string>('')

  function generateUserColor(): string {
    const colors = [
      '#FFB8D4', '#FFD4A3', '#FFF4B8', '#B8FFD4',
      '#B8D4FF', '#D4B8FF', '#FFB8B8', '#B8FFFF'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  initUserId()
  userColor.value = generateUserColor()

  return {
    userId,
    userColor,
    getUserId
  }
})

import create from 'zustand'

const LOCAL_KEY = 'expense_auth'

const initial = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null') || { token: null, user: null }

const useAuthStore = create((set) => ({
  token: initial.token,
  user: initial.user,
  setAuth: (token, user) => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ token, user }))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem(LOCAL_KEY)
    set({ token: null, user: null })
  }
}))

export default useAuthStore

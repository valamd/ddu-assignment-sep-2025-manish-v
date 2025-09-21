
import axios from 'axios'
import useAuthStore from '../store/authStore'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use(config => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(res => res, err => {
  if (err.response && err.response.status === 401) {
    useAuthStore.getState().logout()
    toast.error('Session expired. Please login again.')
    window.location.href = '/login'
  }
  return Promise.reject(err)
})

export default api

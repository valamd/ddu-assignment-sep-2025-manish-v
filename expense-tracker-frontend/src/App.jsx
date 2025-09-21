
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dashboard from './pages/Dashboard/Dashboard'
import Expenses from './pages/Expenses/ExpensesList'
import Categories from './pages/Categories/CategoriesList'
import Navbar from './components/Navbar'
import { ToastContainer } from 'react-toastify'
import useAuthStore from './store/authStore'

function Protected({ children }) {
  const token = useAuthStore(state => state.token)
  return token ? children : <Navigate to='/login' />
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={<Protected><Dashboard/></Protected>} />
          <Route path="/dashboard" element={<Protected><Dashboard/></Protected>} />
          <Route path="/expenses" element={<Protected><Expenses/></Protected>} />
          <Route path="/categories" element={<Protected><Categories/></Protected>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
        </Routes>
      </div>
      <ToastContainer />
    </div>
  )
}

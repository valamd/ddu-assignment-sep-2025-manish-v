
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export default function Navbar() {
  const token = useAuthStore(state => state.token)
  const user = useAuthStore(state => state.user)
  const logout = useAuthStore(state => state.logout)
  const nav = useNavigate()

  function handleLogout() {
    logout()
    nav('/login')
  }

  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="font-bold text-lg">ExpenseTracker</Link>
          {token && <>
            <Link to="/dashboard" className="text-sm">Dashboard</Link>
            <Link to="/expenses" className="text-sm">Expenses</Link>
            <Link to="/categories" className="text-sm">Categories</Link>
          </>}
        </div>
        <div>
          {token ? (
            <div className="flex items-center space-x-3">
              <span className="text-sm">Hi, {user?.username || user?.email}</span>
              <button onClick={handleLogout} className="px-3 py-1 bg-red-500 text-white rounded">Logout</button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="px-3 py-1 border rounded">Login</Link>
              <Link to="/register" className="px-3 py-1 bg-blue-500 text-white rounded">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

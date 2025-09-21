import React from "react"
import { useForm } from "react-hook-form"
import api from "../../api/axios"
import useAuthStore from "../../store/authStore"
import { toast } from "react-toastify"
import { useNavigate, Link } from "react-router-dom"
import { DollarSign, Eye } from "lucide-react"

export default function Login() {
  const { register, handleSubmit } = useForm()
  const setAuth = useAuthStore((state) => state.setAuth)
  const nav = useNavigate()

  async function onSubmit(data) {
    try {
      const res = await api.post("/auth/login", data)
      setAuth(res.data.data.token, res.data.data.user)
      toast.success("Logged in")
      nav("/dashboard")
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Login failed")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="bg-blue-600 p-3 rounded-lg">
            <DollarSign className="text-white w-6 h-6" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-blue-700">Expense Tracker</h2>
        <p className="text-center text-gray-500 mb-6">Welcome back! Please sign in to continue</p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email Address</label>
            <input
              {...register("email")}
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <div className="relative">
              <input
                {...register("password")}
                type="password"
                placeholder="Enter your password"
                className="w-full p-3 border rounded-lg pr-10 focus:outline-none focus:ring focus:ring-blue-300"
              />
              <Eye className="absolute right-3 top-3 text-gray-400" />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Remember me
            </label>
            <Link to="/forgot-password" className="text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Sign In
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-6">
          Don’t have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Create one now
          </Link>
        </p>
      </div>
    </div>
  )
}

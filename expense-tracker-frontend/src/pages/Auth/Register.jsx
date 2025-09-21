import React from "react"
import { useForm } from "react-hook-form"
import api from "../../api/axios"
import { toast } from "react-toastify"
import { useNavigate, Link } from "react-router-dom"
import { DollarSign } from "lucide-react"

export default function Register() {
  const { register, handleSubmit } = useForm()
  const nav = useNavigate()

  async function onSubmit(data) {
    try {
      await api.post("/auth/register", data)
      toast.success("Registered successfully! Please login.")
      nav("/login")
    } catch (err) {
      toast.error(err?.response?.data?.error?.message || "Registration failed")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-4">
          <div className="bg-green-600 p-3 rounded-lg">
            <DollarSign className="text-white w-6 h-6" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center text-green-700">Create Account</h2>
        <p className="text-center text-gray-500 mb-6">Sign up to start tracking your expenses</p>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              {...register("username")}
              placeholder="Enter your username"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:ring-green-300"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              {...register("email")}
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:ring-green-300"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              {...register("password")}
              type="password"
              placeholder="Enter your password"
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:ring-green-300"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
          >
            Register
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 hover:underline">
            Login here
          </Link>
        </p>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import { toast } from 'react-toastify'

export default function Profile() {
  const [profile, setProfile] = useState({ username: '', email: '', full_name: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const res = await api.get('/user/profile')
      setProfile(res.data.data)
    } catch (err) {
      toast.error('Could not load profile')
    }
    setLoading(false)
  }

  async function updateProfile(e) {
    e.preventDefault()
    try {
      await api.put('/user/profile', profile)
      toast.success('Profile updated')
    } catch (err) {
      toast.error('Update failed')
    }
  }

  return (
    <div className="max-w-lg mx-auto bg-white shadow p-6 rounded">
      <h1 className="text-xl font-bold mb-4">My Profile</h1>
      {loading ? <div>Loading...</div> : (
        <form onSubmit={updateProfile} className="space-y-3">
          <input
            value={profile.username}
            onChange={e => setProfile({ ...profile, username: e.target.value })}
            placeholder="Username"
            className="p-2 border rounded w-full"
          />
          <input
            value={profile.email}
            disabled
            className="p-2 border rounded w-full bg-gray-100"
          />
          <input
            value={profile.full_name || ''}
            onChange={e => setProfile({ ...profile, full_name: e.target.value })}
            placeholder="Full Name"
            className="p-2 border rounded w-full"
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
        </form>
      )}
    </div>
  )
}

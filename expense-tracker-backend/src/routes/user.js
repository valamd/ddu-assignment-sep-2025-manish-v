const express = require('express')
const router = express.Router()
const authMiddleware  = require('../middleware/auth')
const db = require('../config/db') 

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, full_name, email FROM users WHERE id=?',
      [req.user.id]
    )
    if (!rows.length) return res.status(404).json({ error: 'User not found' })
    res.json({ data: rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { username,full_name } = req.body
    await db.query(
      'UPDATE users SET username=?, full_name=? WHERE id=?',
      [username,full_name, req.user.id]
    )
    res.json({ message: 'Profile updated' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router

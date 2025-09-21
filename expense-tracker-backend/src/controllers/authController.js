
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { registerSchema, loginSchema } = require('../middleware/validators');
require('dotenv').config();

const DISPOSABLE_DOMAINS = ['10minutemail.com','temp-mail.org','mailinator.com','guerrillamail.com','tempmail.com'];

function isDisposableEmail(email) {
  const domain = email.split('@')[1] || '';
  return DISPOSABLE_DOMAINS.some(d => domain.includes(d));
}

function passwordMeetsRules(password) {
  // Joi validator already enforces strong password but double-check here too
  return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}/.test(password);
}

exports.register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });

  const { username, email, password } = value;
  if (isDisposableEmail(email)) return res.status(400).json({ success: false, error: { code: 'DISPOSABLE_EMAIL', message: 'Disposable emails are not allowed' } });

  // Basic common password block (example list)
  const commonPasswords = ['password','password123','admin','12345678'];
  if (commonPasswords.includes(password.toLowerCase())) return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Common passwords are not allowed' } });

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) return res.status(400).json({ success: false, error: { code: 'EMAIL_EXISTS', message: 'Email already registered' } });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await pool.query('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hash]);
    const userId = result.insertId;

    // return token
    const token = jwt.sign({ userId, email }, process.env.JWT_SECRET || 'ChangeThisToAStrongSecret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    res.json({ success: true, data: { token, user: { id: userId, username, email } }, message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
  const { email, password } = value;
  try {
    const [rows] = await pool.query('SELECT id, password_hash, username FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });

    const token = jwt.sign({ userId: user.id, email }, process.env.JWT_SECRET || 'ChangeThisToAStrongSecret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });
    res.json({ success: true, data: { token, user: { id: user.id, username: user.username, email } }, message: 'Login successful' });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.forgotPassword = async (req, res) => {
  const email = req.body.email;
  if (!email) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Email is required' } });
  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(200).json({ success: true, message: 'If the email exists, a reset link will be sent' });
    const user = rows[0];
    // create short-lived JWT as reset token
    const resetToken = require('jsonwebtoken').sign({ userId: user.id, email }, process.env.JWT_SECRET || 'ChangeThisToAStrongSecret', { expiresIn: process.env.RESET_JWT_EXPIRES_IN || '1h' });
    const resetLink = `https://example.com/reset-password?token=${resetToken}`;
    // Simulate email by logging - replace with real email service in production
    console.log('Password reset link for', email, resetLink);
    res.json({ success: true, message: 'Password reset link generated (check server logs in this scaffold)' });
  } catch (err) {
    console.error('Forgot password error', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Token and newPassword required' } });
  if (!passwordMeetsRules(newPassword)) return res.status(400).json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Password does not meet complexity requirements' } });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'ChangeThisToAStrongSecret');
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, payload.userId]);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(400).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' } });
  }
};

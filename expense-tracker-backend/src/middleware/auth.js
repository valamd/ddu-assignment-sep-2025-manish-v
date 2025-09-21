
const jwt = require('jsonwebtoken');
require('dotenv').config();
const pool = require('../config/db');

module.exports = async function (req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'No token provided' } });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'ChangeThisToAStrongSecret');
    // attach user id & email to req
    req.user = { id: payload.userId, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: { code: 'INVALID_TOKEN', message: 'Token invalid or expired' } });
  }
};

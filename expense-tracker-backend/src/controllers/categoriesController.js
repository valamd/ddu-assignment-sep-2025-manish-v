
const pool = require('../config/db');

exports.list = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query('SELECT * FROM categories WHERE is_system = TRUE OR user_id = ? ORDER BY is_system DESC, name ASC', [userId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.create = async (req, res) => {
  const userId = req.user.id;
  const { name, color_code } = req.body;
  if (!name || name.length < 2 || name.length > 30) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be 2-30 chars' } });
  if (color_code && !/^#([0-9A-Fa-f]{6})$/.test(color_code)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid color code' } });
  try {
    const [existing] = await pool.query('SELECT id FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?)', [userId, name]);
    if (existing.length) return res.status(400).json({ success: false, error: { code: 'DUPLICATE_CATEGORY', message: 'Category name already exists' } });
    const [result] = await pool.query('INSERT INTO categories (user_id, name, color_code, is_system) VALUES (?, ?, ?, FALSE)', [userId, name, color_code || '#3498db']);
    res.json({ success: true, data: { id: result.insertId, name, color_code: color_code || '#3498db' }, message: 'Category created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.update = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;
  const { name, color_code } = req.body;
  try {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
    const cat = rows[0];
    if (cat.is_system) return res.status(400).json({ success: false, error: { code: 'SYSTEM_CATEGORY', message: 'System categories cannot be edited' } });
    if (cat.user_id !== userId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not owner of category' } });
    if (name && (name.length < 2 || name.length > 30)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be 2-30 chars' } });
    if (color_code && !/^#([0-9A-Fa-f]{6})$/.test(color_code)) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid color code' } });
    await pool.query('UPDATE categories SET name = ?, color_code = ? WHERE id = ?', [name || cat.name, color_code || cat.color_code, id]);
    res.json({ success: true, message: 'Category updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.remove = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (!rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Category not found' } });
    const cat = rows[0];
    if (cat.is_system) return res.status(400).json({ success: false, error: { code: 'SYSTEM_CATEGORY', message: 'System categories cannot be deleted' } });
    if (cat.user_id !== userId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Not owner of category' } });
    // Check if assigned to existing expenses
    const [countRows] = await pool.query('SELECT COUNT(*) as cnt FROM expenses WHERE category_id = ?', [id]);
    if (countRows[0].cnt > 0) {
      return res.status(400).json({ success: false, error: { code: 'CATEGORY_IN_USE', message: 'Category assigned to existing expenses. Reassign or delete those expenses first.' } });
    }
    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

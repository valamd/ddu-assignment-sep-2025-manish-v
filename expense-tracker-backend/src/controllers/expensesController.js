
const pool = require('../config/db');
const { expenseSchema } = require('../middleware/validators');
const fs = require('fs');
const { parse } = require('json2csv');
const multer = require('multer');

function parseTags(tagsRaw) {
  if (!tagsRaw) return [];
  return Array.from(new Set(tagsRaw.split(',').map(t => t.trim()).filter(t => t)));
}
const path = require('path');

// Define storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/receipts';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`;
    cb(null, name);
  }
});

const upload = multer({ storage }).single('receipt');

exports.create = async (req, res) => {
  const userId = req.user.id;
  const data = { ...req.body };

  // Save uploaded file under correct field name
  if (req.file) data.receipt_path = req.file.path;

  // Joi validation must allow receipt_path
  const { error, value } = expenseSchema.validate(data);
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: error.message },
    });
  }

  try {
    // Validate category
    const [cats] = await pool.query('SELECT * FROM categories WHERE id = ?', [
      value.category_id,
    ]);
    if (!cats.length) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_CATEGORY', message: 'Please select a valid category' },
      });
    }
    const cat = cats[0];
    if (cat.user_id && cat.user_id !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Category does not belong to you' },
      });
    }

    // Duplicate detection
    const [dups] = await pool.query(
      'SELECT id, amount, description, expense_date FROM expenses WHERE user_id = ? AND amount = ? AND description = ? AND expense_date = ?',
      [userId, value.amount, value.description, value.expense_date]
    );
    if (dups.length && !req.query.force) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'POSSIBLE_DUPLICATE',
          message: 'Similar expense found',
          details: dups[0],
        },
      });
    }

    const tagsArr = parseTags(value.tags);

    // Insert expense
    const [result] = await pool.query(
      `INSERT INTO expenses 
       (user_id, category_id, amount, description, payment_method, tags, receipt_path, expense_date) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        value.category_id,
        value.amount,
        value.description,
        value.payment_method,
        tagsArr.join(','),
        value.receipt_path || null,
        value.expense_date,
      ]
    );

    const expenseId = result.insertId;

    // Audit log
    await pool.query(
      'INSERT INTO audit_logs (expense_id, change_type, changed_by, old_values, new_values) VALUES (?, ?, ?, ?, ?)',
      [expenseId, 'create', userId, null, JSON.stringify(value)]
    );

    res.json({
      success: true,
      data: { id: expenseId },
      message: 'Expense created',
    });
  } catch (err) {
    console.error('Create expense error', err);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Server error' },
    });
  }
};


exports.list = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page || '1');
  const limit = Math.min(parseInt(req.query.limit || '10'), 100);
  const offset = (page - 1) * limit;
  const filters = [];
  const params = [userId];
  if (req.query.category) {
    filters.push('category_id = ?');
    params.push(req.query.category);
  }
  if (req.query.date_from) {
    filters.push('expense_date >= ?');
    params.push(req.query.date_from);
  }
  if (req.query.date_to) {
    filters.push('expense_date <= ?');
    params.push(req.query.date_to);
  }
  const where = filters.length ? 'AND ' + filters.join(' AND ') : '';
  try {
    const [rows] = await pool.query(`SELECT * FROM expenses WHERE user_id = ? ${where} ORDER BY expense_date DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
    const [[{ total }]] = await pool.query([`SELECT COUNT(*) as total FROM expenses WHERE user_id = ? ${where}`].concat([]).join(' '), [userId]);
    res.json({ success: true, data: rows, pagination: { page, limit, total } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.update = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;
  const data = { ...req.body };
  if (req.file) data.receipt = req.file.path;
  try {
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
    if (!rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
    const existing = rows[0];
    // validate incoming fields if present
    const { error, value } = expenseSchema.validate({ amount: data.amount || existing.amount, description: data.description || existing.description, category_id: data.category_id || existing.category_id, payment_method: data.payment_method || existing.payment_method, expense_date: data.expense_date || existing.expense_date, tags: data.tags || existing.tags });
    if (error) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
    // update
    const tagsArr = data.tags ? data.tags.split(',').map(t=>t.trim()).filter(Boolean) : (existing.tags ? existing.tags.split(',') : []);
    const receiptPath = data.receipt || existing.receipt_path;
    await pool.query('UPDATE expenses SET category_id = ?, amount = ?, description = ?, payment_method = ?, tags = ?, receipt_path = ?, expense_date = ? WHERE id = ? AND user_id = ?', [value.category_id, value.amount, value.description, value.payment_method, tagsArr.join(','), receiptPath, value.expense_date, id, userId]);
    // audit log
    await pool.query('INSERT INTO audit_logs (expense_id, change_type, changed_by, old_values, new_values) VALUES (?, ?, ?, ?, ?)', [id, 'update', userId, JSON.stringify(existing), JSON.stringify(value)]);
    res.json({ success: true, message: 'Expense updated' });
  } catch (err) {
    console.error('Update expense error', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.remove = async (req, res) => {
  const userId = req.user.id;
  const id = req.params.id;
  try {
    const [rows] = await pool.query('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
    if (!rows.length) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Expense not found' } });
    const existing = rows[0];
    // audit log before delete
    await pool.query('INSERT INTO audit_logs (expense_id, change_type, changed_by, old_values, new_values) VALUES (?, ?, ?, ?, ?)', [id, 'delete', userId, JSON.stringify(existing), null]);
    await pool.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.bulkDelete = async (req, res) => {
  const userId = req.user.id;
  const ids = req.body.ids || [];
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'ids array required' } });
  try {
    // allow only expenses <= 1 year old to be deleted in bulk
    const oneYearAgo = new Date(); oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const [rows] = await pool.query('SELECT id, expense_date, amount FROM expenses WHERE id IN (?) AND user_id = ?', [ids, userId]);
    const tooOld = rows.filter(r => new Date(r.expense_date) < oneYearAgo);
    if (tooOld.length) return res.status(400).json({ success: false, error: { code: 'TOO_OLD', message: 'Some expenses are older than 1 year and cannot be bulk deleted' } });
    // audit log and delete
    for (const r of rows) {
      await pool.query('INSERT INTO audit_logs (expense_id, change_type, changed_by, old_values, new_values) VALUES (?, ?, ?, ?, ?)', [r.id, 'delete', userId, JSON.stringify(r), null]);
    }
    await pool.query('DELETE FROM expenses WHERE id IN (?) AND user_id = ?', [ids, userId]);
    res.json({ success: true, message: `Deleted ${rows.length} expenses` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.exportCSV = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query('SELECT id, category_id, amount, description, payment_method, tags, receipt_path, expense_date, created_at FROM expenses WHERE user_id = ? ORDER BY expense_date DESC', [userId]);
    if (!rows.length) return res.status(400).json({ success: false, error: { code: 'NO_DATA', message: 'No expenses to export' } });
    const fields = ['id','category_id','amount','description','payment_method','tags','receipt_path','expense_date','created_at'];
    const csv = parse(rows, { fields });
    res.setHeader('Content-disposition', 'attachment; filename=expenses.csv');
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csv);
  } catch (err) {
    console.error('Export error', err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};


// controllers/expensesController.js
exports.createExpense = (req, res) => {
    const { amount, category_id, description, user_id } = req.body;
    const receipt = req.file ? req.file.filename : null;

    // Here you should save expense to DB
    res.status(201).json({
        message: 'Expense created successfully',
        data: { amount, category_id, description, user_id, receipt }
    });
};

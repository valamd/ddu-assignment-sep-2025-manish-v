
const pool = require('../config/db');

exports.overview = async (req, res) => {
  const userId = req.user.id;
  try {
    // total current month
    const [current] = await pool.query("SELECT IFNULL(SUM(amount),0) as total FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())", [userId]);
    const [prev] = await pool.query("SELECT IFNULL(SUM(amount),0) as total FROM expenses WHERE user_id = ? AND MONTH(expense_date) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(expense_date) = YEAR(CURDATE() - INTERVAL 1 MONTH)", [userId]);
    const [top] = await pool.query("SELECT c.name, SUM(e.amount) as total FROM expenses e JOIN categories c ON e.category_id = c.id WHERE e.user_id = ? AND MONTH(e.expense_date) = MONTH(CURDATE()) AND YEAR(e.expense_date) = YEAR(CURDATE()) GROUP BY c.name ORDER BY total DESC LIMIT 3", [userId]);
    const [recent] = await pool.query("SELECT id, amount, description, expense_date FROM expenses WHERE user_id = ? ORDER BY expense_date DESC LIMIT 5", [userId]);
    res.json({ success: true, data: { current_month_total: current[0].total, previous_month_total: prev[0].total, top_categories: top, recent_expenses: recent } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.spendingByCategory = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query("SELECT c.name, SUM(e.amount) as total FROM expenses e JOIN categories c ON e.category_id = c.id WHERE e.user_id = ? AND MONTH(e.expense_date) = MONTH(CURDATE()) AND YEAR(e.expense_date) = YEAR(CURDATE()) GROUP BY c.name", [userId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.monthlyTrends = async (req, res) => {
  const userId = req.user.id;
  try {
    const [rows] = await pool.query("SELECT YEAR(expense_date) as yr, MONTH(expense_date) as m, SUM(amount) as total FROM expenses WHERE user_id = ? AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH) GROUP BY YEAR(expense_date), MONTH(expense_date) ORDER BY YEAR(expense_date), MONTH(expense_date)", [userId]);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

exports.forecast = async (req, res) => {
  const userId = req.user.id;
  try {
    // Simple projection: average daily spending over past 90 days * days in month
    const [rows] = await pool.query("SELECT IFNULL(SUM(amount),0) as total, COUNT(DISTINCT expense_date) as days FROM expenses WHERE user_id = ? AND expense_date >= DATE_SUB(CURDATE(), INTERVAL 90 DAY)", [userId]);
    const total = rows[0].total || 0;
    const days = rows[0].days || 1;
    const avgDaily = total / days;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
    const projected = Math.round(avgDaily * daysInMonth * 100)/100;
    res.json({ success: true, data: { avg_daily: avgDaily, projected_month_total: projected } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Server error' } });
  }
};

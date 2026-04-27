const router = require('express').Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const adminAuth = require('../middleware/adminAuth');

const ADMIN_SECRET = () => (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_admin');

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ role: 'admin', email }, ADMIN_SECRET(), { expiresIn: '12h' });
  res.json({ token });
});

router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [usersRes, ordersRes, todayRes, featuredRes, coinsRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM lyrp_users'),
      pool.query('SELECT COUNT(*) FROM lyrp_orders'),
      pool.query("SELECT COUNT(*) FROM lyrp_orders WHERE created_at > NOW() - INTERVAL '24 hours'"),
      pool.query('SELECT * FROM lyrp_featured_account LIMIT 1'),
      pool.query('SELECT SUM(coins) as total FROM lyrp_users'),
    ]);
    const byPlatform = await pool.query(
      `SELECT platform, service_type, COUNT(*) as total
       FROM lyrp_orders GROUP BY platform, service_type ORDER BY total DESC`
    );
    res.json({
      totalUsers: parseInt(usersRes.rows[0].count),
      totalOrders: parseInt(ordersRes.rows[0].count),
      ordersToday: parseInt(todayRes.rows[0].count),
      totalCoinsInCirculation: parseInt(coinsRes.rows[0].total) || 0,
      featuredAccount: featuredRes.rows[0] || null,
      ordersByService: byPlatform.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/users', adminAuth, async (req, res) => {
  const { page = 1, search = '' } = req.query;
  const limit = 25;
  const offset = (page - 1) * limit;
  try {
    const where = search ? 'WHERE u.email ILIKE $3' : '';
    const params = search ? [limit, offset, `%${search}%`] : [limit, offset];
    const [users, count] = await Promise.all([
      pool.query(
        `SELECT u.id, u.email, u.ig_follow_completed, u.coins, u.created_at,
                COUNT(o.id) as order_count
         FROM lyrp_users u
         LEFT JOIN lyrp_orders o ON o.user_id = u.id
         ${where}
         GROUP BY u.id ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
        params
      ),
      pool.query(
        `SELECT COUNT(*) FROM lyrp_users ${search ? 'WHERE email ILIKE $1' : ''}`,
        search ? [`%${search}%`] : []
      ),
    ]);
    res.json({ users: users.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id/coins', adminAuth, async (req, res) => {
  const { amount, reason } = req.body;
  if (!amount || isNaN(amount)) return res.status(400).json({ error: 'amount required' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const balRes = await client.query(
      'UPDATE lyrp_users SET coins = GREATEST(0, coins + $1) WHERE id = $2 RETURNING coins',
      [parseInt(amount), req.params.id]
    );
    if (!balRes.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'User not found' }); }
    await client.query(
      'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [req.params.id, parseInt(amount), 'admin_adjust', reason || 'Admin adjustment']
    );
    await client.query('COMMIT');
    res.json({ success: true, coins: balRes.rows[0].coins });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.get('/orders', adminAuth, async (req, res) => {
  const { page = 1, platform, service_type } = req.query;
  const limit = 25;
  const offset = (page - 1) * limit;
  try {
    const conditions = [];
    const params = [limit, offset];
    if (platform) { params.push(platform); conditions.push(`platform = $${params.length}`); }
    if (service_type) { params.push(service_type); conditions.push(`service_type = $${params.length}`); }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orders = await pool.query(
      `SELECT o.id, o.platform, o.service_type, o.target, o.status, o.smm_order_id, o.created_at,
              u.email as user_email
       FROM lyrp_orders o
       JOIN lyrp_users u ON u.id = o.user_id
       ${where}
       ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
      params
    );
    const count = await pool.query(
      `SELECT COUNT(*) FROM lyrp_orders ${where}`,
      params.slice(2)
    );
    res.json({ orders: orders.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/featured', adminAuth, async (req, res) => {
  const { platform, username, url } = req.body;
  if (!platform || !username) return res.status(400).json({ error: 'platform and username required' });
  try {
    await pool.query(
      `UPDATE lyrp_featured_account SET platform = $1, username = $2, url = $3, updated_at = NOW()
       WHERE id = (SELECT id FROM lyrp_featured_account LIMIT 1)`,
      [platform, username, url || null]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM lyrp_users WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Coupons
router.get('/coupons', adminAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM lyrp_coupons ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/coupons', adminAuth, async (req, res) => {
  const { code, coins, max_uses, expires_at } = req.body;
  if (!code || !coins) return res.status(400).json({ error: 'code and coins required' });
  try {
    const result = await pool.query(
      `INSERT INTO lyrp_coupons (code, coins, max_uses, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [code.toUpperCase().trim(), parseInt(coins), parseInt(max_uses) || 1, expires_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/coupons/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM lyrp_coupons WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

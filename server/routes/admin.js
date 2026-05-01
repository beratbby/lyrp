const router = require('express').Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const adminAuth = require('../middleware/adminAuth');
const { getSettings, setSetting } = require('../db/settings');

const ADMIN_SECRET = () => (process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET + '_admin');

const ALLOWED_SETTINGS = [
  'fastersmm_api_key',
  'smm_service_ig_followers',
  'smm_service_tt_likes',
  'smm_service_tt_views',
  'coin_cost_ig_followers',
  'coin_cost_tt_likes',
  'coin_cost_tt_views',
  'daily_task_coins',
  'claim_quantity',
];

const NUMERIC_SETTINGS = [
  'coin_cost_ig_followers',
  'coin_cost_tt_likes',
  'coin_cost_tt_views',
  'daily_task_coins',
  'claim_quantity',
];

function validId(id) {
  const n = parseInt(id, 10);
  return Number.isInteger(n) && n > 0 ? n : null;
}

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (email !== process.env.ADMIN_EMAIL || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
  const token = jwt.sign({ role: 'admin', email }, ADMIN_SECRET(), { expiresIn: '12h' });
  res.json({ token });
});

router.get('/verify', adminAuth, (req, res) => {
  res.json({ ok: true });
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
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const search = (req.query.search || '').trim().slice(0, 200);
  const limit = 25;
  const offset = (page - 1) * limit;
  try {
    const mainParams = search ? [limit, offset, `%${search}%`] : [limit, offset];
    const mainWhere = search ? 'WHERE u.email ILIKE $3' : '';
    const countParams = search ? [`%${search}%`] : [];
    const countWhere = search ? 'WHERE email ILIKE $1' : '';
    const [users, count] = await Promise.all([
      pool.query(
        `SELECT u.id, u.email, u.ig_follow_completed, u.coins, u.created_at,
                COUNT(o.id) as order_count
         FROM lyrp_users u
         LEFT JOIN lyrp_orders o ON o.user_id = u.id
         ${mainWhere}
         GROUP BY u.id ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`,
        mainParams
      ),
      pool.query(`SELECT COUNT(*) FROM lyrp_users ${countWhere}`, countParams),
    ]);
    res.json({ users: users.rows, total: parseInt(count.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/users/:id/coins', adminAuth, async (req, res) => {
  const userId = validId(req.params.id);
  if (!userId) return res.status(400).json({ error: 'Invalid user ID' });
  const parsed = parseInt(req.body.amount, 10);
  if (isNaN(parsed)) return res.status(400).json({ error: 'amount must be a number' });
  if (parsed < -100000 || parsed > 100000) return res.status(400).json({ error: 'amount out of range (±100000)' });
  const reason = (req.body.reason || 'Admin adjustment').slice(0, 255);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const balRes = await client.query(
      'UPDATE lyrp_users SET coins = GREATEST(0, coins + $1) WHERE id = $2 RETURNING coins',
      [parsed, userId]
    );
    if (!balRes.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'User not found' }); }
    await client.query(
      'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [userId, parsed, 'admin_adjust', reason]
    );
    await client.query('COMMIT');
    res.json({ success: true, coins: balRes.rows[0].coins });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.delete('/users/:id', adminAuth, async (req, res) => {
  const userId = validId(req.params.id);
  if (!userId) return res.status(400).json({ error: 'Invalid user ID' });
  try {
    const result = await pool.query('DELETE FROM lyrp_users WHERE id = $1 RETURNING id', [userId]);
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/orders', adminAuth, async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 25;
  const offset = (page - 1) * limit;
  const platform = req.query.platform || null;
  const service_type = req.query.service_type || null;
  try {
    // Build filter conditions independently so count query can reuse them
    const filterParams = [];
    const filterConditions = [];
    if (platform) { filterParams.push(platform); filterConditions.push(`platform = $${filterParams.length}`); }
    if (service_type) { filterParams.push(service_type); filterConditions.push(`service_type = $${filterParams.length}`); }
    const countWhere = filterConditions.length ? `WHERE ${filterConditions.join(' AND ')}` : '';

    // Main query reindexes filter params after $1=limit, $2=offset
    const mainWhere = filterConditions.length
      ? `WHERE ${filterConditions.map((c, i) => c.replace(`$${i + 1}`, `$${i + 3}`)).join(' AND ')}`
      : '';
    const mainParams = [limit, offset, ...filterParams];

    const [orders, count] = await Promise.all([
      pool.query(
        `SELECT o.id, o.platform, o.service_type, o.target, o.status, o.smm_order_id, o.created_at,
                u.email as user_email
         FROM lyrp_orders o
         JOIN lyrp_users u ON u.id = o.user_id
         ${mainWhere}
         ORDER BY o.created_at DESC LIMIT $1 OFFSET $2`,
        mainParams
      ),
      pool.query(`SELECT COUNT(*) FROM lyrp_orders ${countWhere}`, filterParams),
    ]);
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
      [platform.slice(0, 50), username.slice(0, 255), url ? url.slice(0, 500) : null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Coupons
router.get('/coupons', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM lyrp_coupons ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/coupons', adminAuth, async (req, res) => {
  const { code, coins, max_uses, expires_at } = req.body;
  if (!code || !coins) return res.status(400).json({ error: 'code and coins required' });
  const parsedCoins = parseInt(coins, 10);
  if (isNaN(parsedCoins) || parsedCoins <= 0 || parsedCoins > 100000) {
    return res.status(400).json({ error: 'coins must be between 1 and 100000' });
  }
  const parsedMaxUses = parseInt(max_uses, 10) || 1;
  if (parsedMaxUses <= 0 || parsedMaxUses > 1000000) {
    return res.status(400).json({ error: 'max_uses out of range' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO lyrp_coupons (code, coins, max_uses, expires_at)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [code.toUpperCase().trim().slice(0, 50), parsedCoins, parsedMaxUses, expires_at || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Coupon code already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/coupons/:id', adminAuth, async (req, res) => {
  const couponId = validId(req.params.id);
  if (!couponId) return res.status(400).json({ error: 'Invalid coupon ID' });
  try {
    const result = await pool.query('DELETE FROM lyrp_coupons WHERE id = $1 RETURNING id', [couponId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Coupon not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Settings
router.get('/settings', adminAuth, async (req, res) => {
  try {
    const s = await getSettings();
    res.json(Object.fromEntries(ALLOWED_SETTINGS.map(k => [k, s[k] || ''])));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/settings', adminAuth, async (req, res) => {
  const updates = Object.entries(req.body).filter(([k]) => ALLOWED_SETTINGS.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'No valid settings provided' });
  for (const [key, value] of updates) {
    if (NUMERIC_SETTINGS.includes(key)) {
      const n = parseInt(value, 10);
      if (isNaN(n) || n <= 0 || n > 10000) {
        return res.status(400).json({ error: `Invalid value for ${key}: must be 1–10000` });
      }
    }
  }
  try {
    await Promise.all(updates.map(([key, value]) => setSetting(key, String(value).trim())));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

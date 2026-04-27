const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const QUANTITY = 15;
const DAILY_TASK_COINS = 10;

const COIN_COSTS = {
  instagram_followers: 20,
  tiktok_likes: 5,
  tiktok_views: 3,
};

const SERVICE_IDS = {
  instagram_followers: process.env.SMM_SERVICE_IG_FOLLOWERS,
  tiktok_likes: process.env.SMM_SERVICE_TT_LIKES,
  tiktok_views: process.env.SMM_SERVICE_TT_VIEWS,
};

const serviceKey = (platform, serviceType) => `${platform}_${serviceType}`;

router.get('/status', authMiddleware, async (req, res) => {
  try {
    const [userResult, taskResult, featuredResult] = await Promise.all([
      pool.query('SELECT coins FROM lyrp_users WHERE id = $1', [req.user.id]),
      pool.query(
        'SELECT completed FROM lyrp_daily_tasks WHERE user_id = $1 AND task_date = CURRENT_DATE',
        [req.user.id]
      ),
      pool.query('SELECT * FROM lyrp_featured_account LIMIT 1'),
    ]);

    res.json({
      coins: userResult.rows[0]?.coins || 0,
      coinCosts: COIN_COSTS,
      dailyTaskDone: taskResult.rows[0]?.completed || false,
      featuredAccount: featuredResult.rows[0] || null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/complete-daily-task', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT completed FROM lyrp_daily_tasks WHERE user_id = $1 AND task_date = CURRENT_DATE',
      [req.user.id]
    );
    if (existing.rows[0]?.completed) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Daily task already completed today' });
    }

    await client.query(
      `INSERT INTO lyrp_daily_tasks (user_id, task_date, completed, completed_at)
       VALUES ($1, CURRENT_DATE, TRUE, NOW())
       ON CONFLICT (user_id, task_date) DO UPDATE SET completed = TRUE, completed_at = NOW()`,
      [req.user.id]
    );

    const balResult = await client.query(
      'UPDATE lyrp_users SET coins = coins + $1 WHERE id = $2 RETURNING coins',
      [DAILY_TASK_COINS, req.user.id]
    );

    await client.query(
      'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [req.user.id, DAILY_TASK_COINS, 'daily_task', 'Daily task reward']
    );

    await client.query('COMMIT');
    res.json({ success: true, coinsEarned: DAILY_TASK_COINS, coins: balResult.rows[0].coins });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/claim', authMiddleware, async (req, res) => {
  const { platform, serviceType, target } = req.body;
  if (!platform || !serviceType || !target) {
    return res.status(400).json({ error: 'platform, serviceType, and target are required' });
  }

  const key = serviceKey(platform, serviceType);
  const smmServiceId = SERVICE_IDS[key];
  if (!smmServiceId) return res.status(400).json({ error: 'Invalid service' });

  const cost = COIN_COSTS[key];
  if (!cost) return res.status(400).json({ error: 'Invalid service' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT ig_follow_completed, coins FROM lyrp_users WHERE id = $1 FOR UPDATE',
      [req.user.id]
    );
    const user = userResult.rows[0];

    if (!user?.ig_follow_completed) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You must follow @lyrp.io on Instagram first' });
    }

    if (user.coins < cost) {
      await client.query('ROLLBACK');
      return res.status(402).json({ error: 'Not enough coins', coins: user.coins, required: cost });
    }

    // Deduct coins first — refund on SMM failure
    const balResult = await client.query(
      'UPDATE lyrp_users SET coins = coins - $1 WHERE id = $2 RETURNING coins',
      [cost, req.user.id]
    );

    await client.query(
      'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [req.user.id, -cost, 'claim', `${platform} ${serviceType} claim`]
    );

    await client.query('COMMIT');

    // Call SMM API outside the transaction (can't roll back external calls)
    try {
      const params = new URLSearchParams();
      params.append('key', process.env.FASTERSMM_API_KEY);
      params.append('action', 'add');
      params.append('service', smmServiceId);
      params.append('link', target);
      params.append('quantity', String(QUANTITY));

      const smmResponse = await axios.post('https://fastersmm.com/api/v2', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const smmOrderId = smmResponse.data?.order?.toString() || null;

      const orderResult = await pool.query(
        `INSERT INTO lyrp_orders (user_id, platform, service_type, target, smm_order_id, status)
         VALUES ($1, $2, $3, $4, $5, 'processing') RETURNING id`,
        [req.user.id, platform, serviceType, target, smmOrderId]
      );

      res.json({ success: true, orderId: orderResult.rows[0].id, quantity: QUANTITY, coins: balResult.rows[0].coins });
    } catch (smmErr) {
      // SMM failed — refund coins
      await pool.query('UPDATE lyrp_users SET coins = coins + $1 WHERE id = $2', [cost, req.user.id]);
      await pool.query(
        'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
        [req.user.id, cost, 'refund', `Refund: ${platform} ${serviceType} SMM error`]
      );
      if (smmErr.response?.data) {
        console.error('SMM API error:', smmErr.response.data);
        return res.status(502).json({ error: 'SMM panel error', detail: smmErr.response.data });
      }
      throw smmErr;
    }
  } catch (err) {
    if (!res.headersSent) {
      try { await client.query('ROLLBACK'); } catch (_) {}
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  } finally {
    client.release();
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, platform, service_type, target, status, created_at
       FROM lyrp_orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

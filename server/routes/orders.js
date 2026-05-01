const router = require('express').Router();
const axios = require('axios');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { getSettings } = require('../db/settings');

async function getConfig() {
  const s = await getSettings();
  return {
    quantity: parseInt(s.claim_quantity, 10) || 15,
    dailyTaskCoins: parseInt(s.daily_task_coins, 10) || 10,
    coinCosts: {
      instagram_followers: parseInt(s.coin_cost_ig_followers, 10) || 20,
      tiktok_likes: parseInt(s.coin_cost_tt_likes, 10) || 5,
      tiktok_views: parseInt(s.coin_cost_tt_views, 10) || 3,
    },
    serviceIds: {
      instagram_followers: s.smm_service_ig_followers || '',
      tiktok_likes: s.smm_service_tt_likes || '',
      tiktok_views: s.smm_service_tt_views || '',
    },
    apiKey: s.fastersmm_api_key || '',
  };
}

const VALID_KEYS = new Set(['instagram_followers', 'tiktok_likes', 'tiktok_views']);
const serviceKey = (platform, serviceType) => `${platform}_${serviceType}`;

router.get('/status', authMiddleware, async (req, res) => {
  try {
    const [cfg, userResult, taskResult, featuredResult] = await Promise.all([
      getConfig(),
      pool.query('SELECT coins, pro_until FROM lyrp_users WHERE id = $1', [req.user.id]),
      pool.query(
        'SELECT completed FROM lyrp_daily_tasks WHERE user_id = $1 AND task_date = CURRENT_DATE',
        [req.user.id]
      ),
      pool.query('SELECT * FROM lyrp_featured_account LIMIT 1'),
    ]);
    const proUntil = userResult.rows[0]?.pro_until || null;
    const isPro = proUntil && new Date(proUntil) > new Date();
    const coinCosts = isPro
      ? Object.fromEntries(Object.entries(cfg.coinCosts).map(([k, v]) => [k, Math.max(1, Math.ceil(v / 2))]))
      : cfg.coinCosts;
    res.json({
      coins: userResult.rows[0]?.coins || 0,
      coinCosts,
      dailyTaskDone: taskResult.rows[0]?.completed || false,
      featuredAccount: featuredResult.rows[0] || null,
      isPro: !!isPro,
      proUntil,
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
    const { dailyTaskCoins } = await getConfig();
    await client.query(
      `INSERT INTO lyrp_daily_tasks (user_id, task_date, completed, completed_at)
       VALUES ($1, CURRENT_DATE, TRUE, NOW())
       ON CONFLICT (user_id, task_date) DO UPDATE SET completed = TRUE, completed_at = NOW()`,
      [req.user.id]
    );
    const balResult = await client.query(
      'UPDATE lyrp_users SET coins = coins + $1 WHERE id = $2 RETURNING coins',
      [dailyTaskCoins, req.user.id]
    );
    await client.query(
      'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [req.user.id, dailyTaskCoins, 'daily_task', 'Daily task reward']
    );
    await client.query('COMMIT');
    res.json({ success: true, coinsEarned: dailyTaskCoins, coins: balResult.rows[0].coins });
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
  if (typeof target !== 'string' || target.length > 500) {
    return res.status(400).json({ error: 'Invalid target' });
  }

  const key = serviceKey(platform, serviceType);
  if (!VALID_KEYS.has(key)) return res.status(400).json({ error: 'Invalid service' });

  const cfg = await getConfig();
  const smmServiceId = cfg.serviceIds[key];
  if (!smmServiceId) return res.status(400).json({ error: 'Service not configured' });

  let cost = cfg.coinCosts[key];
  if (!cost) return res.status(400).json({ error: 'Invalid service' });
  const proRes = await pool.query('SELECT pro_until FROM lyrp_users WHERE id = $1', [req.user.id]);
  const isPro = proRes.rows[0]?.pro_until && new Date(proRes.rows[0].pro_until) > new Date();
  if (isPro) cost = Math.max(1, Math.ceil(cost / 2));

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
    const balResult = await client.query(
      'UPDATE lyrp_users SET coins = coins - $1 WHERE id = $2 RETURNING coins',
      [cost, req.user.id]
    );
    await client.query(
      'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [req.user.id, -cost, 'claim', `${platform} ${serviceType} claim`]
    );
    await client.query('COMMIT');

    // Call SMM API outside the transaction
    try {
      const params = new URLSearchParams();
      params.append('key', cfg.apiKey);
      params.append('action', 'add');
      params.append('service', smmServiceId);
      params.append('link', target.trim());
      params.append('quantity', String(cfg.quantity));

      const smmResponse = await axios.post('https://fastersmm.com/api/v2', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });

      const smmOrderId = smmResponse.data?.order?.toString() || null;
      const orderResult = await pool.query(
        `INSERT INTO lyrp_orders (user_id, platform, service_type, target, smm_order_id, status)
         VALUES ($1, $2, $3, $4, $5, 'processing') RETURNING id`,
        [req.user.id, platform, serviceType, target.trim(), smmOrderId]
      );
      res.json({ success: true, orderId: orderResult.rows[0].id, quantity: cfg.quantity, coins: balResult.rows[0].coins });
    } catch (smmErr) {
      // Refund coins on SMM failure
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

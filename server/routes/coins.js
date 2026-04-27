const router = require('express').Router();
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

router.post('/redeem', authMiddleware, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Coupon code required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const couponRes = await client.query(
      `SELECT * FROM lyrp_coupons
       WHERE code = $1 AND used_count < max_uses
       AND (expires_at IS NULL OR expires_at > NOW())`,
      [code.toUpperCase().trim()]
    );
    if (!couponRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }
    const coupon = couponRes.rows[0];

    const usedRes = await client.query(
      'SELECT id FROM lyrp_coupon_uses WHERE coupon_id = $1 AND user_id = $2',
      [coupon.id, req.user.id]
    );
    if (usedRes.rows.length) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You already used this coupon' });
    }

    await client.query(
      'INSERT INTO lyrp_coupon_uses (coupon_id, user_id) VALUES ($1, $2)',
      [coupon.id, req.user.id]
    );
    await client.query(
      'UPDATE lyrp_coupons SET used_count = used_count + 1 WHERE id = $1',
      [coupon.id]
    );

    const balRes = await client.query(
      'UPDATE lyrp_users SET coins = coins + $1 WHERE id = $2 RETURNING coins',
      [coupon.coins, req.user.id]
    );
    await client.query(
      'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
      [req.user.id, coupon.coins, 'coupon', `Coupon: ${coupon.code}`]
    );

    await client.query('COMMIT');
    res.json({ success: true, coinsAdded: coupon.coins, balance: balRes.rows[0].coins });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT amount, type, description, created_at
       FROM lyrp_coin_transactions WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 30`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

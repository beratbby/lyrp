const router = require('express').Router();
const crypto = require('crypto');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { createInvoice, verifyWebhook } = require('../lib/heleket');

const COIN_PACKAGES = {
  starter: { coins: 100, usd: 2.99 },
  popular: { coins: 500, usd: 9.99 },
  pro: { coins: 1500, usd: 24.99 },
  whale: { coins: 5000, usd: 69.99 },
};

const PRO_PLANS = {
  monthly: { days: 30, usd: 4.99 },
  yearly: { days: 365, usd: 39.99 },
};

const FEATURED_DAILY_USD = 10;

function newOrderId() {
  return 'lyrp_' + crypto.randomBytes(12).toString('hex');
}

function publicUrl(path) {
  const base = (process.env.PUBLIC_URL || process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return base + path;
}

function serverUrl(path) {
  const base = (process.env.SERVER_URL || 'http://localhost:3001').replace(/\/$/, '');
  return base + path;
}

async function createPayment({ userId, kind, amountUsd, metadata, payerEmail }) {
  const orderId = newOrderId();
  const inserted = await pool.query(
    `INSERT INTO lyrp_payments (user_id, order_id, kind, amount_usd, metadata, status)
     VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
    [userId || null, orderId, kind, amountUsd, metadata || {}]
  );
  const invoice = await createInvoice({
    orderId,
    amountUsd,
    callbackUrl: serverUrl('/api/payments/heleket/webhook'),
    returnUrl: publicUrl('/payment/return?order=' + orderId),
    payerEmail,
  });
  await pool.query(
    'UPDATE lyrp_payments SET heleket_uuid = $1 WHERE id = $2',
    [invoice?.uuid || null, inserted.rows[0].id]
  );
  return { orderId, paymentId: inserted.rows[0].id, url: invoice?.url, uuid: invoice?.uuid };
}

// ── Buy Coins ────────────────────────────────────────────────
router.get('/coins/packages', (_req, res) => {
  res.json(COIN_PACKAGES);
});

router.post('/coins/checkout', authMiddleware, async (req, res) => {
  const { packageKey } = req.body;
  const pkg = COIN_PACKAGES[packageKey];
  if (!pkg) return res.status(400).json({ error: 'Invalid package' });
  try {
    const result = await createPayment({
      userId: req.user.id,
      kind: 'coins',
      amountUsd: pkg.usd,
      metadata: { coins: pkg.coins, packageKey },
      payerEmail: req.user.email,
    });
    res.json({ url: result.url, orderId: result.orderId });
  } catch (err) {
    console.error('coins checkout error', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// ── Pro plan ────────────────────────────────────────────────
router.get('/pro/plans', (_req, res) => {
  res.json(PRO_PLANS);
});

router.post('/pro/checkout', authMiddleware, async (req, res) => {
  const { plan } = req.body;
  const p = PRO_PLANS[plan];
  if (!p) return res.status(400).json({ error: 'Invalid plan' });
  try {
    const result = await createPayment({
      userId: req.user.id,
      kind: 'pro',
      amountUsd: p.usd,
      metadata: { days: p.days, plan },
      payerEmail: req.user.email,
    });
    res.json({ url: result.url, orderId: result.orderId });
  } catch (err) {
    console.error('pro checkout error', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// ── Featured account self-serve ─────────────────────────────
router.get('/featured/quote', (req, res) => {
  const days = Math.min(30, Math.max(1, parseInt(req.query.days, 10) || 1));
  res.json({ days, dailyUsd: FEATURED_DAILY_USD, totalUsd: +(days * FEATURED_DAILY_USD).toFixed(2) });
});

router.post('/featured/checkout', async (req, res) => {
  const { platform, username, url, days, startDate, email } = req.body;
  if (!platform || !username || !startDate || !email) {
    return res.status(400).json({ error: 'platform, username, startDate, email are required' });
  }
  if (!['instagram', 'tiktok'].includes(platform)) return res.status(400).json({ error: 'Invalid platform' });
  const d = parseInt(days, 10);
  if (!Number.isInteger(d) || d < 1 || d > 30) return res.status(400).json({ error: 'days must be 1–30' });
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return res.status(400).json({ error: 'Invalid startDate' });
  const end = new Date(start.getTime() + (d - 1) * 86400000);
  const totalUsd = +(d * FEATURED_DAILY_USD).toFixed(2);

  try {
    const result = await createPayment({
      userId: null,
      kind: 'featured',
      amountUsd: totalUsd,
      metadata: {
        platform,
        username: username.slice(0, 255),
        url: (url || '').slice(0, 500),
        days: d,
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        email: email.slice(0, 255),
      },
      payerEmail: email,
    });
    await pool.query(
      `INSERT INTO lyrp_featured_bookings
       (payment_id, user_id, platform, username, url, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
      [
        result.paymentId,
        null,
        platform,
        username.slice(0, 255),
        url ? url.slice(0, 500) : null,
        start.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10),
      ]
    );
    res.json({ url: result.url, orderId: result.orderId });
  } catch (err) {
    console.error('featured checkout error', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// ── Order status (for return page polling) ──────────────────
router.get('/order/:orderId', async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT order_id, kind, amount_usd, status, completed_at FROM lyrp_payments WHERE order_id = $1',
      [req.params.orderId]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json(r.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── Webhook ─────────────────────────────────────────────────
router.post('/heleket/webhook', async (req, res) => {
  const apiKey = process.env.HELEKET_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfigured' });
  if (!verifyWebhook(req.body, apiKey)) {
    console.warn('Heleket webhook signature mismatch');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const { order_id, status, uuid } = req.body;
  if (!order_id) return res.status(400).json({ error: 'Missing order_id' });

  const isPaid = status === 'paid' || status === 'paid_over';
  const isFailed = ['fail', 'cancel', 'system_fail', 'wrong_amount'].includes(status);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      'SELECT * FROM lyrp_payments WHERE order_id = $1 FOR UPDATE',
      [order_id]
    );
    if (!r.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Order not found' });
    }
    const payment = r.rows[0];

    if (payment.status === 'completed') {
      await client.query('COMMIT');
      return res.json({ ok: true, already: true });
    }

    if (isPaid) {
      await client.query(
        `UPDATE lyrp_payments SET status = 'completed', completed_at = NOW(), heleket_uuid = COALESCE(heleket_uuid, $2) WHERE id = $1`,
        [payment.id, uuid || null]
      );

      if (payment.kind === 'coins') {
        const coins = parseInt(payment.metadata?.coins, 10);
        if (coins > 0 && payment.user_id) {
          await client.query('UPDATE lyrp_users SET coins = coins + $1 WHERE id = $2', [coins, payment.user_id]);
          await client.query(
            'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
            [payment.user_id, coins, 'purchase', `Purchased ${coins} coins`]
          );
        }
      } else if (payment.kind === 'pro') {
        const days = parseInt(payment.metadata?.days, 10) || 30;
        if (payment.user_id) {
          await client.query(
            `UPDATE lyrp_users
             SET pro_until = GREATEST(COALESCE(pro_until, NOW()), NOW()) + ($1 || ' days')::interval
             WHERE id = $2`,
            [String(days), payment.user_id]
          );
        }
      } else if (payment.kind === 'featured') {
        await client.query(
          `UPDATE lyrp_featured_bookings SET status = 'paid' WHERE payment_id = $1`,
          [payment.id]
        );
      }
    } else if (isFailed) {
      await client.query(
        `UPDATE lyrp_payments SET status = $2 WHERE id = $1`,
        [payment.id, status]
      );
      if (payment.kind === 'featured') {
        await client.query(
          `UPDATE lyrp_featured_bookings SET status = 'failed' WHERE payment_id = $1`,
          [payment.id]
        );
      }
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('webhook fulfillment error', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;

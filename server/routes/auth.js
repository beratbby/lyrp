const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.post('/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

  const client = await pool.connect();
  try {
    const exists = await client.query('SELECT id FROM lyrp_users WHERE email = $1', [email.toLowerCase()]);
    if (exists.rows.length) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const result = await client.query(
      'INSERT INTO lyrp_users (email, password_hash, coins) VALUES ($1, $2, 100) RETURNING id, email, ig_follow_completed, coins',
      [email.toLowerCase(), hash]
    );
    const user = result.rows[0];

    await client.query(
      'INSERT INTO lyrp_coin_transactions (user_id, amount, type, description) VALUES ($1, 100, $2, $3)',
      [user.id, 'signup', 'Welcome bonus']
    );

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, igFollowCompleted: user.ig_follow_completed, coins: user.coins },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const result = await pool.query('SELECT * FROM lyrp_users WHERE email = $1', [email.toLowerCase()]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user.id, email: user.email, igFollowCompleted: user.ig_follow_completed, coins: user.coins },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/complete-follow', require('../middleware/auth'), async (req, res) => {
  try {
    await pool.query('UPDATE lyrp_users SET ig_follow_completed = TRUE WHERE id = $1', [req.user.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, ig_follow_completed, coins FROM lyrp_users WHERE id = $1',
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'User not found' });
    const u = result.rows[0];
    res.json({ id: u.id, email: u.email, igFollowCompleted: u.ig_follow_completed, coins: u.coins });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

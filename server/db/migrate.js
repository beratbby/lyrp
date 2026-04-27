require('dotenv').config();
const pool = require('./index');

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');

    await client.query(`
      ALTER TABLE lyrp_users
        ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 100
    `);
    console.log('✓ lyrp_users.coins column');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lyrp_coin_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES lyrp_users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type VARCHAR(50) NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ lyrp_coin_transactions table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lyrp_coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        coins INTEGER NOT NULL,
        max_uses INTEGER NOT NULL DEFAULT 1,
        used_count INTEGER NOT NULL DEFAULT 0,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ lyrp_coupons table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lyrp_coupon_uses (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER REFERENCES lyrp_coupons(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES lyrp_users(id) ON DELETE CASCADE,
        used_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(coupon_id, user_id)
      )
    `);
    console.log('✓ lyrp_coupon_uses table');

    console.log('All migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => { console.error(err); process.exit(1); });

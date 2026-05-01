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

    await client.query(`
      CREATE TABLE IF NOT EXISTS lyrp_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ lyrp_settings table');

    await client.query(`
      ALTER TABLE lyrp_users
        ADD COLUMN IF NOT EXISTS pro_until TIMESTAMP
    `);
    console.log('✓ lyrp_users.pro_until column');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lyrp_payments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES lyrp_users(id) ON DELETE SET NULL,
        order_id VARCHAR(64) UNIQUE NOT NULL,
        heleket_uuid VARCHAR(64),
        kind VARCHAR(32) NOT NULL,
        amount_usd NUMERIC(10,2) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      )
    `);
    console.log('✓ lyrp_payments table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS lyrp_featured_bookings (
        id SERIAL PRIMARY KEY,
        payment_id INTEGER REFERENCES lyrp_payments(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES lyrp_users(id) ON DELETE SET NULL,
        platform VARCHAR(50) NOT NULL,
        username VARCHAR(255) NOT NULL,
        url VARCHAR(500),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ lyrp_featured_bookings table');

    console.log('All migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => { console.error(err); process.exit(1); });

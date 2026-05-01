CREATE TABLE IF NOT EXISTS lyrp_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  ig_follow_completed BOOLEAN DEFAULT FALSE,
  coins INTEGER NOT NULL DEFAULT 100,
  pro_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

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
);

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
);

CREATE TABLE IF NOT EXISTS lyrp_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES lyrp_users(id) ON DELETE CASCADE,
  platform VARCHAR(50) NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  target VARCHAR(500) NOT NULL,
  smm_order_id VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lyrp_daily_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES lyrp_users(id) ON DELETE CASCADE,
  task_date DATE DEFAULT CURRENT_DATE,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP,
  UNIQUE(user_id, task_date)
);

CREATE TABLE IF NOT EXISTS lyrp_featured_account (
  id SERIAL PRIMARY KEY,
  platform VARCHAR(50) NOT NULL DEFAULT 'instagram',
  username VARCHAR(255) NOT NULL DEFAULT 'lyrp.io',
  url VARCHAR(500),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lyrp_coin_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES lyrp_users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lyrp_coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  coins INTEGER NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lyrp_coupon_uses (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER REFERENCES lyrp_coupons(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES lyrp_users(id) ON DELETE CASCADE,
  used_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(coupon_id, user_id)
);

CREATE TABLE IF NOT EXISTS lyrp_settings (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO lyrp_featured_account (platform, username, url)
VALUES ('instagram', 'lyrp.io', 'https://instagram.com/lyrp.io')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS lyrp_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  ig_follow_completed BOOLEAN DEFAULT FALSE,
  coins INTEGER NOT NULL DEFAULT 100,
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

INSERT INTO lyrp_featured_account (platform, username, url)
VALUES ('instagram', 'lyrp.io', 'https://instagram.com/lyrp.io')
ON CONFLICT DO NOTHING;

const pool = require('./index');

let cache = null;
let cacheAt = 0;
const TTL = 5 * 60 * 1000;

const DEFAULTS = {
  fastersmm_api_key: () => process.env.FASTERSMM_API_KEY || '',
  smm_service_ig_followers: () => process.env.SMM_SERVICE_IG_FOLLOWERS || '',
  smm_service_tt_likes: () => process.env.SMM_SERVICE_TT_LIKES || '',
  smm_service_tt_views: () => process.env.SMM_SERVICE_TT_VIEWS || '',
  coin_cost_ig_followers: () => '20',
  coin_cost_tt_likes: () => '5',
  coin_cost_tt_views: () => '3',
  daily_task_coins: () => '10',
  claim_quantity: () => '15',
};

async function getSettings() {
  if (cache && Date.now() - cacheAt < TTL) return cache;
  const { rows } = await pool.query('SELECT key, value FROM lyrp_settings');
  const dbValues = Object.fromEntries(rows.map(r => [r.key, r.value]));
  cache = {};
  for (const key of Object.keys(DEFAULTS)) {
    cache[key] = (dbValues[key] && dbValues[key].trim()) ? dbValues[key] : DEFAULTS[key]();
  }
  cacheAt = Date.now();
  return cache;
}

async function setSetting(key, value) {
  await pool.query(
    `INSERT INTO lyrp_settings (key, value, updated_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
    [key, value]
  );
  cache = null;
}

module.exports = { getSettings, setSetting };

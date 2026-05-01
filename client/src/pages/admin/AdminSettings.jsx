import { useState, useEffect } from 'react';
import axios from 'axios';

const API_FIELDS = [
  { key: 'fastersmm_api_key', label: 'FasterSMM API Key', hint: 'Your API key from fastersmm.com', secret: true },
  { key: 'smm_service_ig_followers', label: 'Instagram Followers Service ID', hint: 'Service ID from the FasterSMM panel' },
  { key: 'smm_service_tt_likes', label: 'TikTok Likes Service ID', hint: 'Service ID from the FasterSMM panel' },
  { key: 'smm_service_tt_views', label: 'TikTok Views Service ID', hint: 'Service ID from the FasterSMM panel' },
];

const ECONOMY_FIELDS = [
  { key: 'coin_cost_ig_followers', label: 'IG Followers cost (coins)', min: 1 },
  { key: 'coin_cost_tt_likes', label: 'TikTok Likes cost (coins)', min: 1 },
  { key: 'coin_cost_tt_views', label: 'TikTok Views cost (coins)', min: 1 },
  { key: 'daily_task_coins', label: 'Daily task reward (coins)', min: 1 },
  { key: 'claim_quantity', label: 'Units per claim', min: 1 },
];

const EMPTY = {
  fastersmm_api_key: '',
  smm_service_ig_followers: '',
  smm_service_tt_likes: '',
  smm_service_tt_views: '',
  coin_cost_ig_followers: '20',
  coin_cost_tt_likes: '5',
  coin_cost_tt_views: '3',
  daily_task_coins: '10',
  claim_quantity: '15',
};

export default function AdminSettings() {
  const [form, setForm] = useState(EMPTY);
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    axios.get('/api/admin/settings')
      .then(res => { setForm({ ...EMPTY, ...res.data }); })
      .catch(() => setMsg({ type: 'error', text: 'Failed to load settings.' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await axios.put('/api/admin/settings', form);
      setMsg({ type: 'success', text: 'Settings saved. Changes apply within 5 minutes.' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.error || 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[300px]">
      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-[1.6rem] font-extrabold tracking-tight">Settings</h1>
        <p className="text-[14px] text-[#999] mt-1">API configuration and economy settings. Changes apply within 5 minutes.</p>
      </div>

      <form onSubmit={handleSave} className="grid md:grid-cols-2 gap-6">
        {/* SMM API Configuration */}
        <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8 flex flex-col gap-5">
            <h2 className="text-[15px] font-bold">SMM API Configuration</h2>

            {API_FIELDS.map(f => (
              <div key={f.key} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-[#888] uppercase tracking-[0.1em]">{f.label}</label>
                <p className="text-[11px] text-[#bbb]">{f.hint}</p>
                <div className="relative p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                  <input
                    type={f.secret && !showKey ? 'password' : 'text'}
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.secret ? '••••••••••••' : 'e.g. 1234'}
                    className="w-full bg-white rounded-[calc(0.75rem-4px)] px-4 py-2.5 text-[13px] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200 focus:shadow-[inset_0_1px_2px_rgba(14,165,233,0.1),0_0_0_2px_rgba(14,165,233,0.1)]"
                    style={{ paddingRight: f.secret ? '2.5rem' : undefined }}
                  />
                  {f.secret && (
                    <button type="button" onClick={() => setShowKey(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#555] transition-colors p-1">
                      {showKey
                        ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      }
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Economy Settings */}
          <div className="p-1.5 bg-sky-500/[0.06] border border-sky-500/15 rounded-[2rem]">
            <div className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8 flex flex-col gap-5">
              <h2 className="text-[15px] font-bold">Economy Settings</h2>
              <div className="grid grid-cols-2 gap-4">
                {ECONOMY_FIELDS.map(f => (
                  <div key={f.key} className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-[#888] uppercase tracking-[0.08em] leading-tight">{f.label}</label>
                    <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
                      <input
                        type="number"
                        min={f.min}
                        max="10000"
                        value={form[f.key]}
                        onChange={e => set(f.key, e.target.value)}
                        className="w-full bg-white rounded-[calc(0.75rem-4px)] px-3 py-2 text-[13px] outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-shadow duration-200 focus:shadow-[inset_0_1px_2px_rgba(14,165,233,0.1),0_0_0_2px_rgba(14,165,233,0.1)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feedback */}
          {msg && (
            <div className={`rounded-2xl px-5 py-3.5 text-[13px] font-semibold ${
              msg.type === 'success'
                ? 'bg-green-50 border border-green-100 text-green-700'
                : 'bg-red-50 border border-red-100 text-red-600'
            }`}>
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center gap-2 bg-[#0a0a0a] text-white font-semibold text-[14px] py-4 rounded-full hover:bg-sky-500 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : 'Save settings'
            }
          </button>
        </div>
      </form>
    </div>
  );
}

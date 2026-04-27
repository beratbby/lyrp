import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const ease = [0.32, 0.72, 0, 1];

function StatCard({ label, value, sub, color = 'text-[#0a0a0a]' }) {
  return (
    <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[1.5rem]">
      <div className="bg-white rounded-[calc(1.5rem-6px)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
        <div className="text-[12px] font-semibold text-[#999] uppercase tracking-[0.1em] mb-2">{label}</div>
        <div className={`text-[2.5rem] font-extrabold tracking-tight ${color}`}>{value ?? '—'}</div>
        {sub && <div className="text-[12px] text-[#aaa] mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/admin/stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-[1.6rem] font-extrabold tracking-tight">Overview</h1>
        <p className="text-[14px] text-[#999] mt-1">lyrp.io admin dashboard</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay: 0 }}>
          <StatCard label="Total Users" value={stats?.totalUsers?.toLocaleString()} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay: 0.06 }}>
          <StatCard label="Total Orders" value={stats?.totalOrders?.toLocaleString()} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay: 0.12 }}>
          <StatCard label="Orders Today" value={stats?.ordersToday?.toLocaleString()} color="text-sky-500" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease, delay: 0.18 }}>
          <StatCard label="Est. Daily Revenue" value={stats?.ordersToday > 0 ? '$15–$70' : '$0'} sub="from featured slots" color="text-green-600" />
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Orders by service */}
        <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
            <h2 className="text-[14px] font-bold mb-5">Orders by Service</h2>
            {stats?.ordersByService?.length ? (
              <div className="flex flex-col gap-3">
                {stats.ordersByService.map(row => (
                  <div key={`${row.platform}-${row.service_type}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${row.platform === 'instagram' ? 'bg-[#ee2a7b]' : row.service_type === 'likes' ? 'bg-[#ee1d52]' : 'bg-[#0a9ba6]'}`} />
                      <span className="text-[13px] font-medium capitalize">{row.platform} {row.service_type}</span>
                    </div>
                    <span className="text-[13px] font-bold text-[#0a0a0a]">{parseInt(row.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-[13px] text-[#aaa]">No orders yet</p>}
          </div>
        </div>

        {/* Featured account */}
        <div className="p-1.5 bg-sky-500/[0.06] border border-sky-500/15 rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-6 shadow-[inset_0_1px_1px_rgba(14,165,233,0.05)]">
            <h2 className="text-[14px] font-bold mb-5">Current Featured Account</h2>
            {stats?.featuredAccount ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-[15px] font-bold">@{stats.featuredAccount.username}</div>
                    <div className="text-[12px] text-[#aaa] capitalize">{stats.featuredAccount.platform}</div>
                  </div>
                </div>
                {stats.featuredAccount.url && (
                  <a href={stats.featuredAccount.url} target="_blank" rel="noopener noreferrer"
                    className="text-[13px] text-sky-500 hover:text-sky-600 transition-colors truncate">{stats.featuredAccount.url}</a>
                )}
                <a href="/admin/featured" className="mt-2 text-center block bg-sky-50 text-sky-600 font-semibold text-[13px] py-2.5 rounded-full hover:bg-sky-100 transition-colors">
                  Change featured account →
                </a>
              </div>
            ) : <p className="text-[13px] text-[#aaa]">No featured account set</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

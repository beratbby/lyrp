import { useEffect, useState } from 'react';
import axios from 'axios';

const PLATFORMS = ['', 'instagram', 'tiktok'];
const TYPES = ['', 'followers', 'likes', 'views'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [platform, setPlatform] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    axios.get('/api/admin/orders', { params: { page, platform, service_type: serviceType } })
      .then(res => { setOrders(res.data.orders); setTotal(res.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, platform, serviceType]);

  const statusColor = (s) => {
    if (s === 'processing') return 'bg-amber-50 text-amber-600';
    if (s === 'completed') return 'bg-green-50 text-green-600';
    return 'bg-[#f5f5f5] text-[#aaa]';
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-tight">Orders</h1>
          <p className="text-[14px] text-[#999] mt-1">{total.toLocaleString()} total</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={platform} onChange={e => { setPlatform(e.target.value); setPage(1); }}
            className="bg-white border border-black/10 rounded-full px-4 py-2 text-[13px] font-medium outline-none">
            <option value="">All platforms</option>
            {PLATFORMS.filter(Boolean).map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
          </select>
          <select value={serviceType} onChange={e => { setServiceType(e.target.value); setPage(1); }}
            className="bg-white border border-black/10 rounded-full px-4 py-2 text-[13px] font-medium outline-none">
            <option value="">All types</option>
            {TYPES.filter(Boolean).map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
          </select>
        </div>
      </div>

      <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
        <div className="bg-white rounded-[calc(2rem-6px)] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-black/[0.05]">
                  {['User', 'Service', 'Target', 'Status', 'Date'].map(h => (
                    <th key={h} className={`text-left px-5 py-4 text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.1em] ${h === 'Target' || h === 'Date' ? 'hidden md:table-cell' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id} className={`border-b border-black/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#fafafa]'}`}>
                    <td className="px-5 py-4 text-[12px] text-[#666] max-w-[140px] truncate">{o.user_email}</td>
                    <td className="px-5 py-4">
                      <span className="text-[12px] font-semibold capitalize">{o.platform} {o.service_type}</span>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-[#aaa] max-w-[160px] truncate hidden md:table-cell">{o.target}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${statusColor(o.status)}`}>{o.status}</span>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-[#aaa] hidden md:table-cell">
                      {new Date(o.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-[14px] text-[#aaa]">No orders found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {total > 25 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-[13px] font-medium bg-white border border-black/10 rounded-full hover:bg-[#f5f5f5] disabled:opacity-40 transition-colors">Previous</button>
          <span className="text-[13px] text-[#999]">Page {page} of {Math.ceil(total / 25)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 25)}
            className="px-4 py-2 text-[13px] font-medium bg-white border border-black/10 rounded-full hover:bg-[#f5f5f5] disabled:opacity-40 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}

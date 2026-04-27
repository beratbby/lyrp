import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', { params: { page, search } });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [page, search]);

  const deleteUser = async (id) => {
    if (!confirm('Delete this user and all their orders?')) return;
    await axios.delete(`/api/admin/users/${id}`);
    fetchUsers();
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[1.6rem] font-extrabold tracking-tight">Users</h1>
          <p className="text-[14px] text-[#999] mt-1">{total.toLocaleString()} total</p>
        </div>
        <div className="p-1 bg-black/[0.025] border border-black/[0.06] rounded-xl">
          <input
            type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email..."
            className="bg-white rounded-[calc(0.75rem-4px)] px-4 py-2.5 text-[13px] outline-none w-full sm:w-56 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
          />
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
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.1em]">Email</th>
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.1em] hidden md:table-cell">Joined</th>
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.1em]">IG Follow</th>
                  <th className="text-left px-6 py-4 text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.1em]">Orders</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr key={u.id} className={`border-b border-black/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#fafafa]'}`}>
                    <td className="px-6 py-4 text-[13px] font-medium">{u.email}</td>
                    <td className="px-6 py-4 text-[12px] text-[#aaa] hidden md:table-cell">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[11px] font-bold px-2 py-1 rounded-full ${u.ig_follow_completed ? 'bg-green-50 text-green-600' : 'bg-[#f5f5f5] text-[#aaa]'}`}>
                        {u.ig_follow_completed ? 'Done' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold">{u.order_count}</td>
                    <td className="px-6 py-4">
                      <button onClick={() => deleteUser(u.id)}
                        className="text-[12px] text-red-400 hover:text-red-600 font-medium transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-[14px] text-[#aaa]">No users found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {total > 25 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 text-[13px] font-medium bg-white border border-black/10 rounded-full hover:bg-[#f5f5f5] disabled:opacity-40 transition-colors">
            Previous
          </button>
          <span className="text-[13px] text-[#999]">Page {page} of {Math.ceil(total / 25)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 25)}
            className="px-4 py-2 text-[13px] font-medium bg-white border border-black/10 rounded-full hover:bg-[#f5f5f5] disabled:opacity-40 transition-colors">
            Next
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';

export default function PaymentReturn() {
  const [params] = useSearchParams();
  const orderId = params.get('order');
  const [order, setOrder] = useState(null);
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await axios.get(`/api/payments/order/${orderId}`);
        if (cancelled) return;
        setOrder(r.data);
        if (r.data.status !== 'completed' && tries < 30) {
          setTimeout(() => setTries(t => t + 1), 5000);
        }
      } catch (_) {
        if (!cancelled) setOrder({ status: 'unknown' });
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [orderId, tries]);

  const isDone = order?.status === 'completed';
  const isPending = !order || order.status === 'pending';

  return (
    <div className="min-h-[100dvh] bg-[#f7f7f8] font-sans flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="p-1.5 bg-black/[0.04] border border-black/[0.06] rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-8 text-center">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
              isDone ? 'bg-green-50 border border-green-100 text-green-500'
                : isPending ? 'bg-amber-50 border border-amber-100 text-amber-500'
                : 'bg-red-50 border border-red-100 text-red-500'
            }`}>
              {isDone
                ? <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                : isPending
                  ? <span className="w-6 h-6 border-2 border-amber-300 border-t-amber-500 rounded-full animate-spin" />
                  : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              }
            </div>
            <h1 className="text-[1.4rem] font-extrabold tracking-tight mb-2">
              {isDone ? 'Payment received' : isPending ? 'Waiting for payment' : 'Payment failed'}
            </h1>
            <p className="text-[13px] text-[#666] leading-relaxed mb-7">
              {isDone
                ? 'Your order has been fulfilled. Refresh your dashboard to see updates.'
                : isPending
                  ? 'Your transaction is being confirmed on the blockchain. This page will update automatically.'
                  : 'We could not confirm your payment. If you were charged, contact support.'}
            </p>
            <Link to="/dashboard" className="block w-full text-center bg-[#0a0a0a] text-white font-semibold text-[14px] py-3.5 rounded-full hover:bg-sky-500 transition-colors">
              Back to dashboard
            </Link>
            {orderId && <p className="text-[10px] text-[#ccc] mt-4 font-mono">{orderId}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

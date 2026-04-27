export default function AdminSettings() {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-[1.6rem] font-extrabold tracking-tight">Settings</h1>
        <p className="text-[14px] text-[#999] mt-1">Configuration for the lyrp.io platform.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* SMM Service IDs */}
        <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] flex flex-col gap-5">
            <h2 className="text-[15px] font-bold">SMM Service IDs</h2>
            <p className="text-[13px] text-[#777] leading-relaxed">
              These are set via <code className="bg-[#f5f5f5] px-1.5 py-0.5 rounded text-[12px]">server/.env</code>. To change them, edit the file and restart the server.
            </p>
            <div className="flex flex-col gap-3">
              {[
                ['SMM_SERVICE_IG_FOLLOWERS', 'Instagram Followers service ID'],
                ['SMM_SERVICE_TT_LIKES', 'TikTok Likes service ID'],
                ['SMM_SERVICE_TT_VIEWS', 'TikTok Views service ID'],
                ['FASTERSMM_API_KEY', 'FasterSMM API Key'],
              ].map(([key, label]) => (
                <div key={key} className="p-4 bg-[#fafafa] rounded-2xl">
                  <div className="text-[11px] font-bold text-[#aaa] uppercase tracking-[0.1em] mb-1">{label}</div>
                  <code className="text-[13px] font-medium text-[#0a0a0a]">{key}</code>
                  <div className="text-[12px] text-[#bbb] mt-1">Set in server/.env</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Monetization guide */}
        <div className="p-1.5 bg-sky-500/[0.06] border border-sky-500/15 rounded-[2rem]">
          <div className="bg-white rounded-[calc(2rem-6px)] p-8 shadow-[inset_0_1px_1px_rgba(14,165,233,0.05)] flex flex-col gap-4">
            <h2 className="text-[15px] font-bold">Monetization Guide</h2>
            <div className="flex flex-col gap-4">
              {[
                {
                  title: 'Featured Slots',
                  desc: 'Sell daily/weekly/monthly slots to creators who want their account featured as the daily task. $15/day is your baseline.',
                  action: 'Manage in Featured Slot tab',
                  color: 'text-sky-600',
                },
                {
                  title: 'Pro Plan',
                  desc: 'Coming soon: $4.99/mo for 50 claims/hr, no daily task, priority delivery. Collect waitlist emails now.',
                  action: 'Email list via contact form',
                  color: 'text-purple-600',
                },
                {
                  title: 'SMM Reseller Margin',
                  desc: 'You buy from FasterSMM at wholesale rates. You can also sell bulk packages directly to users at markup.',
                  action: 'Set up a /buy page',
                  color: 'text-green-600',
                },
                {
                  title: 'Referral Loop',
                  desc: 'Users refer friends → bonus claims. Every referral grows your user base organically at zero cost.',
                  action: 'Coming in v2',
                  color: 'text-amber-600',
                },
              ].map(({ title, desc, action, color }) => (
                <div key={title} className="p-4 bg-[#fafafa] rounded-2xl">
                  <div className={`text-[12px] font-bold ${color} mb-1`}>{title}</div>
                  <p className="text-[12px] text-[#777] leading-relaxed mb-2">{desc}</p>
                  <span className="text-[11px] font-semibold text-[#aaa] uppercase tracking-[0.08em]">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

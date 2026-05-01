import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useT } from '../context/I18nContext';
import { locales } from '../i18n';

const ease = [0.32, 0.72, 0, 1];

function RevealSection({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setTimeout(() => el.classList.add('animate-in'), delay); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    el.classList.add('opacity-0-start');
    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);
  return <div ref={ref} className={className}>{children}</div>;
}

function LangSwitcher({ dark = false }) {
  const { lang, switchLang, locales: locs } = useT();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-[12px] font-semibold transition-colors px-2 py-1.5 rounded-full ${dark ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-[#666] hover:text-[#0a0a0a] hover:bg-black/5'}`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
        <span>{locs[lang].nav.lang}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.2, ease }}
            className="absolute top-full mt-2 right-0 bg-white border border-black/[0.07] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.1)] overflow-hidden z-50 min-w-[72px]"
          >
            {Object.keys(locs).map(code => (
              <button key={code} onClick={() => { switchLang(code); setOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-[12px] font-semibold transition-colors ${lang === code ? 'bg-sky-50 text-sky-600' : 'text-[#444] hover:bg-[#f5f5f5]'}`}>
                {locs[code].nav.lang}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileMenu({ t }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors md:hidden">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}>
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ duration: 0.35, ease }}
              className="absolute right-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.05]">
                <span className="text-[15px] font-bold">lyrp.io</span>
                <button onClick={() => setOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
              <div className="flex flex-col gap-1 p-4 flex-1">
                {[
                  { delay: 0.05, el: <Link to="/login" onClick={() => setOpen(false)} className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-[15px] font-medium text-[#444] hover:bg-[#f5f5f5] hover:text-[#0a0a0a] transition-all">{t.nav.login}</Link> },
                  { delay: 0.1, el: <Link to="/signup" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 bg-[#0a0a0a] text-white text-[15px] font-semibold px-4 py-3.5 rounded-2xl hover:bg-sky-500 transition-colors">{t.nav.signup}</Link> },
                ].map(({ delay, el }, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.3, ease }}>
                    {el}
                  </motion.div>
                ))}
              </div>
              <div className="px-6 py-5 border-t border-black/[0.05]">
                <LangSwitcher />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-black/[0.06] last:border-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-start justify-between gap-4 py-5 text-left">
        <span className="text-[14px] sm:text-[15px] font-semibold text-[#0a0a0a] leading-snug">{q}</span>
        <span className={`shrink-0 w-6 h-6 rounded-full bg-[#f5f5f5] flex items-center justify-center transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1V9M1 5H9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease }} className="overflow-hidden">
            <p className="text-[14px] text-[#666] leading-relaxed pb-5">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Landing() {
  const { t } = useT();

  return (
    <div className="grain bg-white text-[#0a0a0a] font-sans overflow-x-hidden">

      {/* Nav — island pill on desktop, full-width bar on mobile */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease }}
        className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 md:top-6 md:left-1/2 md:right-auto md:px-0 md:pt-0 md:-translate-x-1/2 md:w-max"
      >
        {/* Desktop pill */}
        <div className="hidden md:flex bg-white/80 backdrop-blur-xl border border-black/[0.06] shadow-[0_8px_32px_rgba(0,0,0,0.06)] rounded-full px-5 py-3 items-center gap-5">
          <span className="text-[15px] font-bold tracking-tight">{t.nav.logo}</span>
          <div className="flex items-center gap-1">
            <LangSwitcher />
            <Link to="/login" className="text-[13px] font-medium text-[#555] hover:text-[#0a0a0a] transition-colors px-3 py-1.5">{t.nav.login}</Link>
            <Link to="/signup" className="group flex items-center gap-2 bg-[#0a0a0a] text-white text-[13px] font-semibold px-4 py-2 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-sky-500 active:scale-[0.97]">
              {t.nav.signup}
              <span className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-px">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8L8 2M8 2H3M8 2V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </Link>
          </div>
        </div>
        {/* Mobile bar */}
        <div className="flex md:hidden bg-white/90 backdrop-blur-xl border border-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.07)] rounded-2xl px-4 py-3 items-center justify-between">
          <span className="text-[15px] font-bold tracking-tight">{t.nav.logo}</span>
          <div className="flex items-center gap-2">
            <Link to="/signup" className="bg-[#0a0a0a] text-white text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-sky-500 transition-colors active:scale-[0.97]">
              {t.nav.signup}
            </Link>
            <MobileMenu t={t} />
          </div>
        </div>
      </motion.nav>

      {/* Hero */}
      <section className="min-h-[100dvh] flex flex-col items-center justify-center px-4 pt-28 md:pt-36 pb-16 md:pb-24 text-center">
        <motion.div initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.9, ease, delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-sky-50 border border-sky-100 rounded-full px-4 py-1.5 mb-6 md:mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span className="text-[10px] md:text-[11px] uppercase tracking-[0.18em] font-semibold text-sky-600">{t.hero.badge}</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 32, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 1, ease, delay: 0.2 }}
          className="text-[clamp(2.4rem,10vw,6rem)] font-extrabold tracking-[-0.03em] leading-[1.05] max-w-4xl mb-5 px-2">
          {t.hero.title}<br /><span className="text-sky-500">{t.hero.titleAccent}</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.35 }}
          className="text-[15px] md:text-[clamp(1rem,2.5vw,1.2rem)] text-[#666] max-w-sm md:max-w-lg leading-relaxed mb-8 md:mb-10 px-2">
          {t.hero.sub}
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease, delay: 0.5 }}
          className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto px-4 sm:px-0">
          <Link to="/signup" className="group w-full sm:w-auto flex items-center justify-center gap-3 bg-[#0a0a0a] text-white font-semibold text-[15px] px-7 py-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-sky-500 hover:shadow-[0_16px_48px_rgba(14,165,233,0.35)] active:scale-[0.97]">
            {t.hero.cta}
            <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          </Link>
          <Link to="/login" className="text-[15px] font-medium text-[#888] hover:text-[#0a0a0a] transition-colors py-2">{t.hero.loginLink}</Link>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease, delay: 0.7 }}
          className="flex items-center justify-center gap-6 sm:gap-10 mt-12 md:mt-16 text-[#999] text-[12px] sm:text-[13px] w-full px-4">
          {[[t.hero.s1val, t.hero.s1label],[t.hero.s2val, t.hero.s2label],[t.hero.s3val, t.hero.s3label]].map(([val, label]) => (
            <div key={label} className="flex flex-col items-center gap-0.5 min-w-0">
              <span className="text-[1.15rem] sm:text-[1.4rem] font-bold text-[#0a0a0a] tracking-tight whitespace-nowrap">{val}</span>
              <span className="text-center leading-tight">{label}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Stats Bar */}
      <section className="py-8 md:py-12 bg-[#0a0a0a] text-white">
        <RevealSection className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-2xl overflow-hidden">
            {[[t.stats.s1val, t.stats.s1label],[t.stats.s2val, t.stats.s2label],[t.stats.s3val, t.stats.s3label],[t.stats.s4val, t.stats.s4label]].map(([val, label]) => (
              <div key={label} className="bg-[#0a0a0a] flex flex-col items-center py-7 md:py-8 px-3 text-center">
                <span className="text-[1.6rem] md:text-[2rem] font-extrabold tracking-tight text-white">{val}</span>
                <span className="text-[11px] md:text-[12px] text-white/40 mt-1 leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </RevealSection>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-32 px-4">
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-10 md:mb-20">
            <div className="inline-flex items-center gap-2 bg-[#f5f5f5] rounded-full px-4 py-1.5 mb-5 md:mb-6">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#666]">{t.howItWorks.badge}</span>
            </div>
            <h2 className="text-[clamp(1.8rem,5vw,3.5rem)] font-extrabold tracking-[-0.025em] leading-[1.1]">{t.howItWorks.title}</h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {[
              { step:'01', title:t.howItWorks.step1title, desc:t.howItWorks.step1desc, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
              { step:'02', title:t.howItWorks.step2title, desc:t.howItWorks.step2desc, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
              { step:'03', title:t.howItWorks.step3title, desc:t.howItWorks.step3desc, icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> },
            ].map(({ step, title, desc, icon }, i) => (
              <RevealSection key={step} delay={i * 80} className="h-full">
                <div className="p-1.5 bg-black/[0.03] border border-black/[0.05] rounded-[2rem] h-full">
                  <div className="bg-white rounded-[calc(2rem-6px)] p-6 md:p-8 h-full flex flex-col gap-4 md:gap-5">
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-500">{icon}</div>
                      <span className="text-[11px] font-bold tracking-[0.1em] text-[#ccc]">{step}</span>
                    </div>
                    <div>
                      <h3 className="text-[1rem] md:text-[1.1rem] font-bold mb-2 tracking-tight">{title}</h3>
                      <p className="text-[13px] md:text-[14px] text-[#777] leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-16 md:py-32 px-4 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto">
          <RevealSection className="text-center mb-10 md:mb-20">
            <div className="inline-flex items-center gap-2 bg-white border border-black/[0.06] rounded-full px-4 py-1.5 mb-5 md:mb-6">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#666]">{t.services.badge}</span>
            </div>
            <h2 className="text-[clamp(1.8rem,5vw,3.5rem)] font-extrabold tracking-[-0.025em] leading-[1.1]">{t.services.title}</h2>
          </RevealSection>
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {[
              { svc:t.services.ig, accentText:'text-[#ee2a7b]', accentBg:'bg-[#fdf2f8]', accentBorder:'border-[#f9d0e8]', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg> },
              { svc:t.services.ttLikes, accentText:'text-[#ee1d52]', accentBg:'bg-[#fff1f4]', accentBorder:'border-[#ffd0d8]', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> },
              { svc:t.services.ttViews, accentText:'text-[#0a9ba6]', accentBg:'bg-[#f0fafb]', accentBorder:'border-[#c5edf0]', icon:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> },
            ].map(({ svc, accentText, accentBg, accentBorder, icon }, i) => (
              <RevealSection key={svc.service} delay={i * 80} className="h-full">
                <div className={`p-1.5 bg-black/[0.03] border border-black/[0.05] rounded-[2rem] h-full`}>
                  <div className={`${accentBg} rounded-[calc(2rem-6px)] p-6 md:p-8 h-full flex flex-col gap-4 md:gap-5`}>
                    <div className={`w-11 h-11 rounded-2xl ${accentBg} border ${accentBorder} flex items-center justify-center ${accentText}`}>{icon}</div>
                    <div className="flex-1">
                      <div className={`text-[10px] md:text-[11px] uppercase tracking-[0.15em] font-bold ${accentText} mb-1`}>{svc.platform}</div>
                      <h3 className="text-[1.2rem] md:text-[1.3rem] font-extrabold tracking-tight mb-2 md:mb-3">{svc.service}</h3>
                      <p className="text-[13px] md:text-[14px] text-[#777] leading-relaxed">{svc.desc}</p>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
                      <span className="text-[12px] md:text-[13px] font-semibold text-[#0a0a0a]">15 {t.services.perHour}</span>
                      <span className={`text-[11px] font-bold ${accentText} bg-white rounded-full px-3 py-1`}>{t.services.free}</span>
                    </div>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="py-16 md:py-32 px-4">
        <div className="max-w-3xl mx-auto">
          <RevealSection className="text-center mb-10 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-[#f5f5f5] rounded-full px-4 py-1.5 mb-5 md:mb-6">
              <span className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#666]">{t.faq.badge}</span>
            </div>
            <h2 className="text-[clamp(1.8rem,5vw,3.5rem)] font-extrabold tracking-[-0.025em] leading-[1.1]">{t.faq.title}</h2>
          </RevealSection>
          <RevealSection delay={80}>
            <div className="p-1.5 bg-black/[0.025] border border-black/[0.05] rounded-[2rem]">
              <div className="bg-white rounded-[calc(2rem-6px)] px-5 md:px-8 py-2">
                {t.faq.items.map(item => <FAQItem key={item.q} q={item.q} a={item.a} />)}
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 md:py-32 px-4 bg-[#0a0a0a] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <RevealSection>
            <h2 className="text-[clamp(2rem,8vw,4.5rem)] font-extrabold tracking-[-0.03em] leading-[1.05] mb-5 md:mb-6">
              {t.finalCta.title}<br /><span className="text-sky-400">{t.finalCta.titleAccent}</span>
            </h2>
            <p className="text-[14px] md:text-[16px] text-white/50 mb-8 md:mb-10 max-w-sm md:max-w-md mx-auto leading-relaxed">{t.finalCta.sub}</p>
            <Link to="/signup" className="group inline-flex items-center gap-3 bg-white text-[#0a0a0a] font-semibold text-[15px] px-7 py-4 rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-sky-400 hover:text-white hover:shadow-[0_16px_48px_rgba(56,189,248,0.4)] active:scale-[0.97]">
              {t.finalCta.cta}
              <span className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center transition-all duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:scale-105">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 9.5L9.5 2.5M9.5 2.5H4M9.5 2.5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </span>
            </Link>
          </RevealSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a0a0a] border-t border-white/5 px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <span className="text-white/40 text-[13px] font-bold tracking-tight block">{t.nav.logo}</span>
            <span className="text-white/20 text-[12px]">{t.footer.tagline}</span>
          </div>
          <span className="text-white/20 text-[12px]">{t.footer.rights}</span>
          <a href="mailto:abdelsalemcali@gmail.com" className="text-[12px] text-white/30 hover:text-white/60 transition-colors">{t.footer.contact}</a>
        </div>
      </footer>
    </div>
  );
}

import en from './locales/en';
import tr from './locales/tr';
import ar from './locales/ar';
import de from './locales/de';
import es from './locales/es';
import pt from './locales/pt';
import fr from './locales/fr';

export const locales = { en, tr, ar, de, es, pt, fr };

const countryToLang = {
  TR: 'tr', AZ: 'tr', TM: 'tr',
  SA: 'ar', AE: 'ar', EG: 'ar', KW: 'ar', QA: 'ar', BH: 'ar', OM: 'ar', JO: 'ar', LB: 'ar', IQ: 'ar', SY: 'ar', MA: 'ar', DZ: 'ar', TN: 'ar', LY: 'ar',
  DE: 'de', AT: 'de', CH: 'de',
  ES: 'es', MX: 'es', AR: 'es', CO: 'es', PE: 'es', CL: 'es', VE: 'es', EC: 'es', GT: 'es', CU: 'es', BO: 'es', DO: 'es', HN: 'es', PY: 'es', SV: 'es', NI: 'es', CR: 'es', PA: 'es', UY: 'es',
  BR: 'pt', PT: 'pt', AO: 'pt', MZ: 'pt',
  FR: 'fr', BE: 'fr', LU: 'fr', CI: 'fr', SN: 'fr', CM: 'fr', MG: 'fr',
};

export async function detectLanguage() {
  const stored = localStorage.getItem('lyrp_lang');
  if (stored && locales[stored]) return stored;
  try {
    const res = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
    const data = await res.json();
    const lang = countryToLang[data.country_code] || 'en';
    return lang;
  } catch {
    return 'en';
  }
}

export function setLang(code) {
  localStorage.setItem('lyrp_lang', code);
}

import { createContext, useContext, useState, useEffect } from 'react';
import { locales, detectLanguage, setLang } from '../i18n';

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState('en');
  const [t, setT] = useState(locales.en);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    detectLanguage().then(detected => {
      setLangState(detected);
      setT(locales[detected]);
      document.documentElement.setAttribute('dir', locales[detected].dir);
      document.documentElement.setAttribute('lang', detected);
      setReady(true);
    });
  }, []);

  const switchLang = (code) => {
    setLang(code);
    setLangState(code);
    setT(locales[code]);
    document.documentElement.setAttribute('dir', locales[code].dir);
    document.documentElement.setAttribute('lang', code);
  };

  return (
    <I18nContext.Provider value={{ t, lang, switchLang, ready, locales }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useT = () => useContext(I18nContext);

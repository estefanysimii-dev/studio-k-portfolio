"use client";
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({ theme: 'dark', toggle: () => {} });
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState('dark');
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme || 'dark');
    const sync = (event: StorageEvent) => {
      if (event.key === 'studio-theme') {
        const next = event.newValue === 'light' ? 'light' : 'dark';
        document.documentElement.dataset.theme = next; setTheme(next);
      }
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; setTheme(next);
    try { localStorage.setItem('studio-theme', next); } catch {}
  };
  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}
export function ThemeToggle() {
  const { theme, toggle } = useContext(ThemeContext);
  return <button type="button" className="btn btn-outline compact theme-toggle" onClick={toggle} aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}>{theme === 'dark' ? '☀ Claro' : '☾ Escuro'}</button>;
}

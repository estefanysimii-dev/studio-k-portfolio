import { createRoot } from 'react-dom/client';
import { useEffect } from 'react';
import { StudioProvider, useStudio } from '@/components/studio-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { RadioPlayerProvider } from '@/components/radio-player-provider';
import AmbientLight from '@/components/ambient-light';
import StudioShell from '@/components/studio-shell';
import ShowcaseDetail from '@/components/showcase-detail';
import Home from '@/app/page';
import Portfolio from '@/app/portfolio/page';
import Products from '@/app/products/page';
import Account from '@/app/account/page';
import Discord from '@/app/discord/page';
import Control from '@/app/control/page';
import Cart from '@/app/cart/page';
import Collections from '@/app/collections/page';
import CollectionDetail from '@/app/collections/[slug]/page';
import Community from '@/app/community/page';
import Compare from '@/app/compare/page';
import { navigate, usePathname } from './navigation';
import '@/app/globals.css';

function Routes() {
  const path = usePathname().replace(/\/$/, '') || '/';
  const { state, loading, error } = useStudio();
  useEffect(() => {
    const route = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a') : null;
      if (!target || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || target.target || target.hasAttribute('download')) return;
      const url = new URL(target.href);
      if (url.origin !== location.origin || !/^\/(?:$|portfolio(?:\/[^/]+)?\/?$|products(?:\/[^/]+)?\/?$|collections(?:\/[^/]+)?\/?$|community\/?$|compare\/?$|cart\/?$|account\/?$|control\/?$|discord\/?$)/.test(url.pathname) || url.hash) return;
      event.preventDefault(); navigate(url.pathname + url.search);
    };
    document.addEventListener('click', route);
    return () => document.removeEventListener('click', route);
  }, []);
  const match = path.match(/^\/(portfolio|products)\/([^/]+)$/);
  if (match) {
    let id = ''; try { id = decodeURIComponent(match[2]); } catch {}
    if (loading) return <StudioShell><p>Carregando…</p></StudioShell>;
    const product = match[1] === 'products';
    const item = (product ? state.products : state.items).find(entry => entry.id === id);
    if (!item) return <StudioShell><h1>{error || 'Página não encontrada'}</h1><a href={product ? '/products' : '/portfolio'}>Voltar</a></StudioShell>;
    return product
      ? <ShowcaseDetail key={path} kind="product" item={item as typeof state.products[number]} />
      : <ShowcaseDetail key={path} kind="portfolio" item={item} />;
  }
  const collectionMatch = path.match(/^\/collections\/([^/]+)$/);
  if (collectionMatch) return <CollectionDetail />;

  switch (path) {
    case '/': return <Home />;
    case '/portfolio': return <Portfolio />;
    case '/products': return <Products />;
    case '/collections': return <Collections />;
    case '/community': return <Community />;
    case '/compare': return <Compare />;
    case '/cart': return <Cart />;
    case '/account': return <Account />;
    case '/discord': return <Discord />;
    case '/control': return <Control />;
    default: return <StudioShell><h1>Página não encontrada</h1><a href="/">Voltar ao início</a></StudioShell>;
  }
}
createRoot(document.getElementById('root')!).render(
  <StudioProvider>
    <RadioPlayerProvider>
      <ThemeProvider>
        <AmbientLight />
        <Routes />
      </ThemeProvider>
    </RadioPlayerProvider>
  </StudioProvider>
);

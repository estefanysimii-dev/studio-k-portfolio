import { createRoot } from 'react-dom/client';
import { lazy, Suspense, useEffect } from 'react';
import { StudioProvider, useStudio } from '@/components/studio-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { RadioPlayerProvider } from '@/components/radio-player-provider';
import AmbientLight from '@/components/ambient-light';
import StudioScrollbars from '@/components/studio-scrollbars';
import EntryIntro from './entry-intro';
import StudioShell from '@/components/studio-shell';
import Home from '@/app/page';
import { navigate, usePathname } from './navigation';
import '@/app/globals.css';

const ShowcaseDetail = lazy(() => import('@/components/showcase-detail'));
const Portfolio = lazy(() => import('@/app/portfolio/page'));
const Products = lazy(() => import('@/app/products/page'));
const Account = lazy(() => import('@/app/account/page'));
const Discord = lazy(() => import('@/app/discord/page'));
const Control = lazy(() => import('@/app/control/page'));
const Cart = lazy(() => import('@/app/cart/page'));
const Collections = lazy(() => import('@/app/collections/page'));
const CollectionDetail = lazy(() => import('@/app/collections/[slug]/page'));
const Community = lazy(() => import('@/app/community/page'));
const Compare = lazy(() => import('@/app/compare/page'));

function RouteFallback() {
  return (
    <StudioShell eyebrow="STUDIO K" title="Carregando">
      <div className="glass-panel" role="status" aria-live="polite" style={{ padding: 24 }}>
        Carregando conteúdo…
      </div>
    </StudioShell>
  );
}

function Routes() {
  const path = usePathname().replace(/\/$/, '') || '/';
  const { state, loading, error } = useStudio();

  useEffect(() => {
    const route = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target.closest('a') : null;
      if (!target || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || target.target || target.hasAttribute('download')) return;
      const url = new URL(target.href);
      if (url.origin !== location.origin || !/^\/(?:$|portfolio(?:\/[^/]+)?\/?$|products(?:\/[^/]+)?\/?$|collections(?:\/[^/]+)?\/?$|community\/?$|compare\/?$|cart\/?$|account\/?$|control\/?$|discord\/?$)/.test(url.pathname) || url.hash) return;
      event.preventDefault();
      navigate(url.pathname + url.search);
    };
    document.addEventListener('click', route);
    return () => document.removeEventListener('click', route);
  }, []);

  const match = path.match(/^\/(portfolio|products)\/([^/]+)$/);
  if (match) {
    let id = '';
    try { id = decodeURIComponent(match[2]); } catch {}
    if (loading) return <RouteFallback />;
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
        <EntryIntro />
        <AmbientLight />
        <StudioScrollbars />
        <Suspense fallback={<RouteFallback />}>
          <Routes />
        </Suspense>
      </ThemeProvider>
    </RadioPlayerProvider>
  </StudioProvider>
);

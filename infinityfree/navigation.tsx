import { useSyncExternalStore } from 'react';
const subscribe = (update: () => void) => {
  window.addEventListener('popstate', update);
  return () => window.removeEventListener('popstate', update);
};
export const usePathname = () => useSyncExternalStore(subscribe, () => window.location.pathname);
export function navigate(href: string) {
  window.history.pushState(null, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo(0, 0);
}

export function useParams<T extends Record<string,string> = Record<string,string>>(): T {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);
  const last = decodeURIComponent(parts.at(-1) || '');
  return { id: last, slug: last } as unknown as T;
}

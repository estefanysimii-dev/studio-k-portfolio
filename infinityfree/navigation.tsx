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

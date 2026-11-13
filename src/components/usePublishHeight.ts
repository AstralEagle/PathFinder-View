import { useLayoutEffect, type RefObject } from 'react';

/**
 * Publie la hauteur réelle d'un élément dans une variable CSS sur <html>
 * (ex. --hp-bar-h, --header-h), tenue à jour quand l'élément change de taille.
 */
export function usePublishHeight(ref: RefObject<HTMLElement | null>, cssVar: string): void {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty(cssVar, `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty(cssVar);
    };
  }, [ref, cssVar]);
}

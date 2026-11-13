import { useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Hauteur maximale pour qu'un élément tienne entre sa position et le bas de l'écran,
 * barre de PV fixe comprise. Recalculée au redimensionnement.
 */
export function useFitHeight(ref: RefObject<HTMLElement | null>, margin = 16): number | undefined {
  const [height, setHeight] = useState<number>();

  useLayoutEffect(() => {
    function update() {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const hpBar = document.querySelector<HTMLElement>('.hp-bar')?.offsetHeight ?? 0;
      setHeight(Math.max(200, window.innerHeight - top - hpBar - margin));
    }
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [ref, margin]);

  return height;
}

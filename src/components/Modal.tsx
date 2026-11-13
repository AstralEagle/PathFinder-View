import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  /** 'dialog' : fenêtre centrée ; 'drawer' : panneau latéral. */
  variant?: 'dialog' | 'drawer';
  children: ReactNode;
}

/**
 * Pile des fenêtres ouvertes : le défilement de la page reste bloqué tant qu'il en reste une,
 * et Échap ne ferme que celle du dessus.
 */
const stack: object[] = [];

/** Fenêtre par-dessus la page : se ferme avec Échap, la croix ou un toucher sur le fond. */
export function Modal({ title, onClose, variant = 'dialog', children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  // Garde la dernière version de onClose sans relancer l'effet (qui redonnerait le focus au panneau).
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    node?.focus();
    const self = {};
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === self) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    stack.push(self);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(self), 1);
      if (stack.length === 0) document.body.classList.remove('no-scroll');
      // Ne rend le focus que s'il était dans cette fenêtre (pas si une autre fenêtre vient de s'ouvrir).
      const active = document.activeElement;
      if (!active || active === document.body || node?.contains(active)) previous?.focus();
    };
  }, []);

  return (
    <div className={`overlay overlay-${variant}`} onClick={onClose}>
      <div
        ref={panel}
        className={`panel panel-${variant}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-head">
          <h2>{title}</h2>
          <button type="button" className="icon-button" aria-label="Fermer" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}

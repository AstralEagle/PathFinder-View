import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  title: string;
  onClose: () => void;
  /**
   * Retour à la fenêtre précédente : affiche une flèche ← à la place de la croix.
   * Sans `onBack`, une fenêtre ouverte par-dessus une autre affiche aussi ← (qui la ferme).
   */
  onBack?: () => void;
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
export function Modal({ title, onClose, onBack, variant = 'dialog', children }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  // Ouverte par-dessus une autre fenêtre ? Mesuré à l'affichage, une fois les fenêtres remplacées retirées.
  const [nested, setNested] = useState(false);
  const back = onBack ?? (nested ? onClose : undefined);
  const selfRef = useRef<object | null>(null);

  useLayoutEffect(() => {
    const self = {};
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mesure de la pile à l'ouverture
    setNested(stack.length > 0);
    stack.push(self);
    document.body.classList.add('no-scroll');
    selfRef.current = self;
    return () => {
      stack.splice(stack.indexOf(self), 1);
      if (stack.length === 0) document.body.classList.remove('no-scroll');
    };
  }, []);
  // Garde la dernière version de onClose sans relancer l'effet (qui redonnerait le focus au panneau).
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    node?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === selfRef.current) closeRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
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
        <div className={back ? 'panel-head with-back' : 'panel-head'}>
          {back && (
            <button type="button" className="icon-button" aria-label="Retour" onClick={back}>
              ←
            </button>
          )}
          <h2>{title}</h2>
          {!back && (
            <button type="button" className="icon-button" aria-label="Fermer" onClick={onClose}>
              ✕
            </button>
          )}
        </div>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}

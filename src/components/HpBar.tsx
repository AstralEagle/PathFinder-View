import { useLayoutEffect, useRef, useState } from 'react';
import { applyDamage, applyHealing, setTempHp, type GameState } from '../game/state.ts';

interface Props {
  state: GameState;
  max: number;
  onChange: (next: GameState) => void;
}

/** Barre de PV toujours visible en bas de l'écran. */
export function HpBar({ state, max, onChange }: Props) {
  const [amount, setAmount] = useState('');
  const barRef = useRef<HTMLDivElement>(null);
  const { current, temp } = state.hp;

  // Publie la hauteur réelle de la barre (--hp-bar-h) : la page réserve exactement cet espace.
  useLayoutEffect(() => {
    const el = barRef.current;
    if (!el) return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty('--hp-bar-h', `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--hp-bar-h');
    };
  }, []);
  const ratio = max > 0 ? Math.min(1, current / max) : 0;
  const value = Number.parseInt(amount, 10);
  const valid = Number.isFinite(value) && value > 0;

  function apply(kind: 'damage' | 'heal' | 'temp') {
    if (!valid) return;
    if (kind === 'damage') onChange(applyDamage(state, value));
    else if (kind === 'heal') onChange(applyHealing(state, value, max));
    else onChange(setTempHp(state, value));
    setAmount('');
  }

  return (
    <div className="hp-bar" ref={barRef} role="region" aria-label="Points de vie">
      <div className="hp-top">
        <div className="hp-count" aria-live="polite">
          <span className="hp-label">PV</span>
          <strong className={current === 0 ? 'hp-zero' : undefined}>{current}</strong>
          <span className="muted">/ {max}</span>
          {temp > 0 && (
            <button
              type="button"
              className="temp-chip"
              title="Retirer les PV temporaires"
              onClick={() => {
                if (window.confirm('Retirer les PV temporaires ?')) onChange(setTempHp(state, 0));
              }}
            >
              +{temp} temp.
            </button>
          )}
        </div>
        <div className="hp-quick">
          <button
            type="button"
            className="hp-btn minus"
            onClick={() => onChange(applyDamage(state, 5))}
          >
            −5
          </button>
          <button
            type="button"
            className="hp-btn minus"
            onClick={() => onChange(applyDamage(state, 1))}
          >
            −1
          </button>
          <button
            type="button"
            className="hp-btn plus"
            onClick={() => onChange(applyHealing(state, 1, max))}
          >
            +1
          </button>
          <button
            type="button"
            className="hp-btn plus"
            onClick={() => onChange(applyHealing(state, 5, max))}
          >
            +5
          </button>
        </div>
      </div>

      <div className="hp-gauge" aria-hidden="true">
        <div className="hp-gauge-fill" style={{ width: `${ratio * 100}%` }} />
      </div>

      <form
        className="hp-input"
        onSubmit={(e) => {
          e.preventDefault();
          apply('damage');
        }}
      >
        <input
          type="number"
          inputMode="numeric"
          min={1}
          placeholder="Valeur"
          aria-label="Valeur de dégâts ou de soins"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <button type="submit" className="hp-btn minus" disabled={!valid}>
          Dégâts
        </button>
        <button
          type="button"
          className="hp-btn plus"
          disabled={!valid}
          onClick={() => apply('heal')}
        >
          Soins
        </button>
        <button
          type="button"
          className="hp-btn temp"
          disabled={!valid}
          onClick={() => apply('temp')}
        >
          Temp.
        </button>
      </form>
    </div>
  );
}

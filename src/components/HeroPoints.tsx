import { MAX_HERO_POINTS, setHeroPoints, type GameState } from '../game/state.ts';

interface Props {
  state: GameState;
  onChange: (next: GameState) => void;
}

export function HeroPoints({ state, onChange }: Props) {
  const n = state.heroPoints;
  return (
    <section className="card">
      <h3>Points d’héroïsme</h3>
      <div
        className="hero-points"
        role="group"
        aria-label={`Points d’héroïsme : ${n} sur ${MAX_HERO_POINTS}`}
      >
        {Array.from({ length: MAX_HERO_POINTS }, (_, i) => {
          const filled = i < n;
          return (
            <button
              key={i}
              type="button"
              className={filled ? 'hero-point filled' : 'hero-point'}
              aria-pressed={filled}
              aria-label={`Point ${i + 1}`}
              // Toucher le dernier point plein le retire ; sinon, remplit jusqu'à ce point.
              onClick={() => onChange(setHeroPoints(state, filled && i === n - 1 ? i : i + 1))}
            >
              ★
            </button>
          );
        })}
      </div>
    </section>
  );
}

interface Props {
  value: number;
  label: string;
  onChange: (delta: number) => void;
}

/** Boutons − / + autour d'une quantité. */
export function Stepper({ value, label, onChange }: Props) {
  return (
    <span className="stepper">
      <button
        type="button"
        aria-label={`Retirer un ${label}`}
        disabled={value <= 0}
        onClick={() => onChange(-1)}
      >
        −
      </button>
      <strong aria-live="polite">{value}</strong>
      <button type="button" aria-label={`Ajouter un ${label}`} onClick={() => onChange(1)}>
        +
      </button>
    </span>
  );
}

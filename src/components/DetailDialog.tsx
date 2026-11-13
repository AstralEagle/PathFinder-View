import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { Modal } from './Modal.tsx';
import { Name } from './Name.tsx';
import { cleanEnrichers } from '../details/enrichers.ts';
import type { DetailRequest } from '../details/DetailContext.ts';
import { resolveDetail, SOURCE_LABELS, nameSource, type ResolvedDetail } from '../sources/chain.ts';
import { traitFr } from '../sources/langFr.ts';
import { useTranslation } from '../sources/TranslationContext.ts';

type Status = { kind: 'loading' } | { kind: 'done'; detail: ResolvedDetail } | { kind: 'error' };

const ALLOWED_TAGS = [
  'p',
  'br',
  'hr',
  'strong',
  'em',
  'b',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'span',
];

function toSafeHtml(raw: string): string {
  return DOMPurify.sanitize(cleanEnrichers(raw), { ALLOWED_TAGS, ALLOWED_ATTR: [] });
}

const ACTIONS: Record<string, string> = {
  reaction: 'Réaction',
  free: 'Action gratuite',
  passive: 'Passif',
};

function actionLabel(type: string | null, count: number | null): string | null {
  if (type === 'action' && count) return count === 1 ? '1 action' : `${count} actions`;
  return type ? (ACTIONS[type] ?? null) : null;
}

/** Saisie d'une traduction locale pour un nom qui n'en a pas (source n°3). */
function LocalNameForm({ en, onSave }: { en: string; onSave: (fr: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <form
      className="local-name"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSave(value.trim());
      }}
    >
      <label>
        <span>Ajouter une traduction pour « {en} » :</span>
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Nom en français"
        />
      </label>
      <button type="submit" className="secondary" disabled={!value.trim()}>
        Enregistrer
      </button>
    </form>
  );
}

interface Props {
  request: DetailRequest;
  onClose: () => void;
  /** Retour à la description précédente (historique), si elle existe. */
  onBack?: () => void;
}

export function DetailDialog({ request, onClose, onBack }: Props) {
  const { tr, sources, group, lang, setLocalName } = useTranslation();
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    resolveDetail(request.kind, request.en, group).then(
      (detail) => {
        if (!cancelled) setStatus({ kind: 'done', detail });
      },
      () => {
        if (!cancelled) setStatus({ kind: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [request.kind, request.en, group, attempt]);

  const translated = tr(request.en);
  const title = request.label ?? translated ?? request.en;
  const nameFrom = nameSource(sources, request.en);
  const aon = `https://2e.aonprd.com/Search.aspx?q=${encodeURIComponent(request.en)}`;

  const d = status.kind === 'done' ? status.detail : null;
  const meta = d?.meta;
  const action = meta ? actionLabel(meta.actionType, meta.actions) : null;
  const traits = meta
    ? [...(meta.rarity ? [meta.rarity] : []), ...meta.traits].map((t) =>
        lang ? (traitFr(lang, t) ?? t) : t,
      )
    : [];

  return (
    <Modal title={title} onClose={onClose} onBack={onBack}>
      {title !== request.en && <p className="detail-en">{request.en}</p>}

      {request.runes && (
        <div className="detail-runes">
          <h3>Runes</h3>
          {request.runes.length === 0 ? (
            <p className="muted">Aucune rune.</p>
          ) : (
            <ul>
              {request.runes.map((r) => (
                <li key={r}>
                  <Name en={r} detail={{ kind: 'item' }} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!translated && (
        <LocalNameForm en={request.en} onSave={(fr) => setLocalName(request.en, fr)} />
      )}

      {status.kind === 'loading' && (
        <p className="muted" role="status">
          Chargement… (la première fois, cela peut prendre quelques secondes)
        </p>
      )}

      {status.kind === 'error' && (
        <p className="error" role="alert">
          Impossible de charger les informations.
        </p>
      )}

      {d && (
        <>
          {(meta?.level != null || action || traits.length > 0) && (
            <div className="detail-tags">
              {meta?.level != null && <span className="tag level">Niveau {meta.level}</span>}
              {action && <span className="tag action">{action}</span>}
              {traits.map((t) => (
                <span key={t} className="tag">
                  {t}
                </span>
              ))}
            </div>
          )}

          {(d.prereq || d.spell) && (
            <dl className="detail-meta">
              {d.prereq && (
                <div>
                  <dt>Prérequis</dt>
                  <dd lang={d.prereq.lang}>{d.prereq.values.join(' ; ')}</dd>
                </div>
              )}
              {d.spell?.range && (
                <div>
                  <dt>Portée</dt>
                  <dd>{d.spell.range}</dd>
                </div>
              )}
              {d.spell?.area && (
                <div>
                  <dt>Zone</dt>
                  <dd>{d.spell.area}</dd>
                </div>
              )}
              {d.spell?.target && (
                <div>
                  <dt>Cibles</dt>
                  <dd>{d.spell.target}</dd>
                </div>
              )}
            </dl>
          )}

          {d.description ? (
            <>
              {d.description.lang === 'en' && (
                <p className="detail-notice">
                  Pas de description française : texte officiel en anglais.
                </p>
              )}
              <div
                className="detail-body"
                lang={d.description.lang}
                dangerouslySetInnerHTML={{ __html: toSafeHtml(d.description.html) }}
              />
            </>
          ) : (
            <p className="muted">Aucune description trouvée dans les sources.</p>
          )}

          {d.failed.length > 0 && (
            <div className="detail-notice" role="alert">
              <p>
                Source{d.failed.length > 1 ? 's' : ''} injoignable
                {d.failed.length > 1 ? 's' : ''} :{' '}
                {d.failed.map((s) => SOURCE_LABELS[s]).join(', ')}. Êtes-vous hors connexion ?
              </p>
              <button
                type="button"
                className="secondary full"
                onClick={() => {
                  setStatus({ kind: 'loading' });
                  setAttempt((n) => n + 1);
                }}
              >
                Réessayer
              </button>
            </div>
          )}
        </>
      )}

      <p className="detail-source">
        {nameFrom && <>Nom : {SOURCE_LABELS[nameFrom]}. </>}
        {d?.description && <>Description : {SOURCE_LABELS[d.description.source]}. </>}
        {meta && <>Niveau et traits : {SOURCE_LABELS.foundry}. </>}
        Voir aussi{' '}
        <a href={aon} target="_blank" rel="noreferrer">
          Archives of Nethys
        </a>
        .
      </p>
    </Modal>
  );
}

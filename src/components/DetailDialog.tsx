import { useEffect, useState } from 'react';
import DOMPurify from 'dompurify';
import { Modal } from './Modal.tsx';
import { cleanEnrichers } from '../details/enrichers.ts';
import { findDetail, type DetailEntry } from '../details/packs.ts';
import type { DetailRequest } from '../details/DetailContext.ts';
import { trName } from '../i18n/names.ts';

type Status =
  | { kind: 'loading' }
  | { kind: 'found'; entry: DetailEntry; html: string }
  | { kind: 'missing' }
  | { kind: 'error' };

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

interface Props {
  request: DetailRequest;
  onClose: () => void;
}

export function DetailDialog({ request, onClose }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    findDetail(request.kind, request.en).then(
      (entry) => {
        if (cancelled) return;
        setStatus(
          entry
            ? { kind: 'found', entry, html: toSafeHtml(entry.description) }
            : { kind: 'missing' },
        );
      },
      () => {
        if (!cancelled) setStatus({ kind: 'error' });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [request.kind, request.en, attempt]);

  const fr = request.label ?? trName(request.en) ?? request.en;
  const aon = `https://2e.aonprd.com/Search.aspx?q=${encodeURIComponent(request.en)}`;

  return (
    <Modal title={fr} onClose={onClose}>
      {fr !== request.en && <p className="detail-en">{request.en}</p>}

      {status.kind === 'loading' && (
        <p className="muted" role="status">
          Chargement de la description… (la première fois, cela peut prendre quelques secondes)
        </p>
      )}

      {status.kind === 'error' && (
        <div role="alert">
          <p className="error">Impossible de charger la description. Êtes-vous hors connexion ?</p>
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

      {status.kind === 'missing' && (
        <p className="muted">Aucune description trouvée pour cet élément dans Pathfinder-fr.</p>
      )}

      {status.kind === 'found' && (
        <>
          {(status.entry.prereq.length > 0 ||
            status.entry.range ||
            status.entry.target ||
            status.entry.area) && (
            <dl className="detail-meta">
              {status.entry.prereq.length > 0 && (
                <div>
                  <dt>Prérequis</dt>
                  <dd>{status.entry.prereq.join(' ; ')}</dd>
                </div>
              )}
              {status.entry.range && (
                <div>
                  <dt>Portée</dt>
                  <dd>{status.entry.range}</dd>
                </div>
              )}
              {status.entry.area && (
                <div>
                  <dt>Zone</dt>
                  <dd>{status.entry.area}</dd>
                </div>
              )}
              {status.entry.target && (
                <div>
                  <dt>Cibles</dt>
                  <dd>{status.entry.target}</dd>
                </div>
              )}
            </dl>
          )}
          {status.html ? (
            <div className="detail-body" dangerouslySetInnerHTML={{ __html: status.html }} />
          ) : (
            <p className="muted">Pas de description.</p>
          )}
        </>
      )}

      <p className="detail-source">
        Source : traduction communautaire{' '}
        <a
          href="https://github.com/pathfinder-fr/foundryvtt-pathfinder2-fr"
          target="_blank"
          rel="noreferrer"
        >
          Pathfinder-fr
        </a>{' '}
        (non officielle). Version anglaise :{' '}
        <a href={aon} target="_blank" rel="noreferrer">
          Archives of Nethys
        </a>
        .
      </p>
    </Modal>
  );
}

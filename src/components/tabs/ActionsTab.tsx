import { useEffect, useMemo, useState } from 'react';
import type { Character, Weapon } from '../../pathbuilder/model.ts';
import { damageFormula, multipleAttackBonuses, weaponAttack } from '../../rules/character.ts';
import { extraDamageFr, signed, trCore } from '../../i18n/translate.ts';
import { weaponName } from '../../i18n/itemNames.ts';
import { useTr } from '../../sources/TranslationContext.ts';
import {
  ACTION_GROUPS,
  actionGlyph,
  basicActionCandidates,
  characterActionCandidates,
  classifyAction,
  type ActionCandidate,
  type ActionGroup,
} from '../../game/actions.ts';
import { findFoundryItem, type FoundryItem } from '../../sources/foundry.ts';
import { Name } from '../Name.tsx';

interface Resolved {
  cand: ActionCandidate;
  item: FoundryItem;
  group: ActionGroup;
}

type Status = { state: 'loading' } | { state: 'done'; list: Resolved[]; failed: number };

/** Interroge Foundry pf2e pour chaque candidat et garde ceux qui sont des actions. */
function useResolvedActions(candidates: ActionCandidate[]): Status {
  const key = candidates.map((c) => `${c.kind}:${c.en}`).join('|');
  const [result, setResult] = useState<{ key: string; status: Status } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(candidates.map((c) => findFoundryItem(c.kind, c.en))).then((results) => {
      if (cancelled) return;
      const list: Resolved[] = [];
      let failed = 0;
      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          failed++;
          return;
        }
        const item = r.value;
        const group = item ? classifyAction(item) : null;
        if (item && group) list.push({ cand: candidates[i]!, item, group });
      });
      setResult({ key, status: { state: 'done', list, failed } });
    });
    return () => {
      cancelled = true;
    };
    // `key` résume la liste des candidats.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return result?.key === key ? result.status : { state: 'loading' };
}

const ORIGIN: Record<ActionCandidate['origin'], string> = {
  feat: 'Don',
  special: 'Capacité',
  basic: 'De base',
};

function ActionList({ list }: { list: Resolved[] }) {
  return (
    <ul className="actions-list">
      {list.map(({ cand, item }) => (
        <li key={`${cand.kind}:${cand.en}`}>
          <span className="glyph" aria-label={item.actionType ?? undefined}>
            {actionGlyph(item) || '⏱'}
          </span>
          <Name en={cand.en} detail={{ kind: cand.kind }} />
          <span className="origin">{ORIGIN[cand.origin]}</span>
        </li>
      ))}
    </ul>
  );
}

function Groups({ status, empty }: { status: Status; empty: string }) {
  if (status.state === 'loading') {
    return (
      <p className="muted" role="status">
        Recherche des actions… (la première fois, cela peut prendre quelques secondes)
      </p>
    );
  }
  return (
    <>
      {status.list.length === 0 && <p className="muted">{empty}</p>}
      {ACTION_GROUPS.map((g) => {
        const list = status.list.filter((r) => r.group === g.key);
        return list.length === 0 ? null : (
          <div key={g.key} className="action-group">
            <h4>{g.label}</h4>
            <ActionList list={list} />
          </div>
        );
      })}
      {status.failed > 0 && (
        <p className="detail-notice" role="alert">
          {status.failed} élément(s) n’ont pas pu être vérifiés (hors connexion ?).
        </p>
      )}
    </>
  );
}

/** Traits des armes (pour « agile »), lus dans Foundry pf2e. */
function useWeaponTraits(weapons: Weapon[]): Record<string, string[]> {
  const key = weapons.map((w) => w.name).join('|');
  const [traits, setTraits] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(weapons.map((w) => findFoundryItem('item', w.name))).then((results) => {
      if (cancelled) return;
      const out: Record<string, string[]> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) out[weapons[i]!.name] = r.value.traits;
      });
      setTraits(out);
    });
    return () => {
      cancelled = true;
    };
    // `key` résume la liste des armes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return traits;
}

/** Frappes avec chaque arme : bonus des 1re / 2e / 3e attaques et dégâts. */
function Strikes({ weapons }: { weapons: Weapon[] }) {
  const tr = useTr();
  const traits = useWeaponTraits(weapons);
  if (weapons.length === 0) return null;

  return (
    <div className="action-group">
      <h4>Frappes</h4>
      <ul className="actions-list strikes">
        {weapons.map((w, i) => {
          const a = weaponAttack(w);
          const agile = traits[w.name]?.includes('agile') ?? false;
          const type = trCore('damageTypes', a.damageType) ?? a.damageType;
          const dice = damageFormula(a).replace(/ \S+$/, '');
          return (
            <li key={`${w.name}-${i}`}>
              <span className="glyph">◆</span>
              <div className="strike-body">
                <Name {...weaponName(w, tr)} detail={{ kind: 'item', en: w.name }} />
                <div className="strike-line">
                  {a.attack !== null && (
                    <strong className="strike-map" title="1re / 2e / 3e attaque du tour">
                      {multipleAttackBonuses(a.attack, agile).map(signed).join(' / ')}
                    </strong>
                  )}
                  <span>
                    {dice} {type}
                    {a.extra.map((e) => ` ${extraDamageFr(e)}`).join('')}
                  </span>
                </div>
              </div>
              <span className="origin">{agile ? 'Agile' : 'Arme'}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

const SHOW_BASIC_KEY = 'pf2.showBasicActions';

function readShowBasic(): boolean {
  try {
    return localStorage.getItem(SHOW_BASIC_KEY) === '1';
  } catch {
    return false;
  }
}

export function ActionsTab({ c }: { c: Character }) {
  const own = useMemo(() => characterActionCandidates(c), [c]);
  const basic = useMemo(() => basicActionCandidates(), []);
  const ownStatus = useResolvedActions(own);
  const [showBasic, setShowBasic] = useState(readShowBasic);

  function toggleBasic(show: boolean) {
    setShowBasic(show);
    try {
      localStorage.setItem(SHOW_BASIC_KEY, show ? '1' : '0');
    } catch {
      // préférence non mémorisée : sans conséquence
    }
  }

  return (
    <>
      <section className="card">
        <h3>Actions du personnage</h3>
        <Strikes weapons={c.weapons} />
        <Groups status={ownStatus} empty="Aucun don ni capacité n’est une action." />
        <p className="legend">
          ◆ action · ◆◆ / ◆◆◆ activité · ◇ gratuite · ⟲ réaction · ⏱ exploration
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Actions de base</h3>
          {showBasic && (
            <button type="button" className="link-button" onClick={() => toggleBasic(false)}>
              Masquer
            </button>
          )}
        </div>
        {showBasic ? (
          <BasicActions candidates={basic} />
        ) : (
          <button type="button" className="secondary full" onClick={() => toggleBasic(true)}>
            Afficher les actions de base
          </button>
        )}
      </section>
    </>
  );
}

/** Chargées seulement à la demande, pour économiser les requêtes. */
function BasicActions({ candidates }: { candidates: ActionCandidate[] }) {
  const status = useResolvedActions(candidates);
  return <Groups status={status} empty="Actions de base introuvables." />;
}

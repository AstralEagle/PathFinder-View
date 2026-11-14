import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dictionary } from '../i18n/lookup.ts';
import {
  EMPTY_GROUP,
  fetchGroupFile,
  loadStoredGroup,
  normalizeGroupUrl,
  saveStoredGroup,
  type StoredGroup,
} from './groupFile.ts';
import { loadLocalNames, saveLocalNames } from './localNames.ts';
import { loadLangFr, type LangTable } from './langFr.ts';
import { buildNameLookup } from './chain.ts';
import type { Translation } from './TranslationContext.ts';

export type GroupStatus =
  | { state: 'none' }
  | { state: 'loading' }
  | { state: 'ok'; count: number; fetchedAt: string }
  | { state: 'error'; message: string; cachedCount: number };

/** État des sources de traduction : fichier du groupe, saisie locale, lang-fr. */
export function useTranslationState(groupUrl: string) {
  const url = groupUrl ? normalizeGroupUrl(groupUrl) : '';
  const [stored, setStored] = useState<StoredGroup | null>(loadStoredGroup);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState<string | null>(null);
  const [local, setLocal] = useState<Dictionary>(loadLocalNames);
  const [lang, setLang] = useState<LangTable | null>(null);

  // Termes de jeu (lang-fr) : chargés en arrière-plan, sans bloquer l'affichage.
  useEffect(() => {
    loadLangFr().then(setLang, () => undefined);
  }, []);

  const fetchGroup = useCallback((target: string) => {
    fetchGroupFile(target).then(
      (data) => {
        const next = { url: target, fetchedAt: new Date().toISOString(), data };
        saveStoredGroup(next);
        setStored(next);
        setGroupError(null);
        setLoadingUrl(null);
      },
      (e: unknown) => {
        setGroupError(e instanceof Error ? e.message : 'Erreur inconnue');
        setLoadingUrl(null);
      },
    );
  }, []);

  // Au démarrage et quand l'adresse change : télécharge la dernière version du fichier du groupe.
  useEffect(() => {
    if (url) fetchGroup(url);
  }, [url, fetchGroup]);

  const reloadGroup = useCallback(() => {
    if (!url) return;
    setLoadingUrl(url);
    fetchGroup(url);
  }, [url, fetchGroup]);

  const group = stored && stored.url === url ? stored.data : EMPTY_GROUP;

  const groupStatus: GroupStatus = !url
    ? { state: 'none' }
    : loadingUrl === url
      ? { state: 'loading' }
      : groupError
        ? { state: 'error', message: groupError, cachedCount: Object.keys(group.names).length }
        : stored && stored.url === url
          ? { state: 'ok', count: Object.keys(group.names).length, fetchedAt: stored.fetchedAt }
          : { state: 'loading' };

  const setLocalName = useCallback((en: string, fr: string) => {
    setLocal((prev) => {
      const next = { ...prev, [en]: fr };
      saveLocalNames(next);
      return next;
    });
  }, []);

  /** Ajoute des traductions locales (import d'une sauvegarde) ; celles du fichier l'emportent. */
  const mergeLocal = useCallback((names: Dictionary) => {
    setLocal((prev) => {
      const next = { ...prev, ...names };
      saveLocalNames(next);
      return next;
    });
  }, []);

  const clearLocal = useCallback(() => {
    saveLocalNames({});
    setLocal({});
  }, []);

  const translation: Translation = useMemo(() => {
    const sources = { group, local, lang };
    return { tr: buildNameLookup(sources), sources, group, lang, setLocalName };
  }, [group, local, lang, setLocalName]);

  return { translation, groupStatus, reloadGroup, local, clearLocal, mergeLocal };
}

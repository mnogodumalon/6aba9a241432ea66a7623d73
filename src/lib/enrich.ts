import type { EnrichedArbeitsvorbereitung, EnrichedAuftragsstatus, EnrichedProblemerfassung, EnrichedStationsprotokoll } from '@/types/enriched';
import type { Arbeitsvorbereitung, Auftragsstatus, Fertigungsauftrag, Problemerfassung, Stationsprotokoll } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface ArbeitsvorbereitungMaps {
  fertigungsauftragMap: Map<string, Fertigungsauftrag>;
}

export function enrichArbeitsvorbereitung(
  arbeitsvorbereitung: Arbeitsvorbereitung[],
  maps: ArbeitsvorbereitungMaps
): EnrichedArbeitsvorbereitung[] {
  return arbeitsvorbereitung.map(r => ({
    ...r,
    fertigungsauftragName: resolveDisplay(r.fields.fertigungsauftrag, maps.fertigungsauftragMap, 'auftragsnummer'),
  }));
}

interface StationsprotokollMaps {
  fertigungsauftragMap: Map<string, Fertigungsauftrag>;
}

export function enrichStationsprotokoll(
  stationsprotokoll: Stationsprotokoll[],
  maps: StationsprotokollMaps
): EnrichedStationsprotokoll[] {
  return stationsprotokoll.map(r => ({
    ...r,
    fertigungsauftragName: resolveDisplay(r.fields.fertigungsauftrag, maps.fertigungsauftragMap, 'auftragsnummer'),
  }));
}

interface ProblemerfassungMaps {
  fertigungsauftragMap: Map<string, Fertigungsauftrag>;
}

export function enrichProblemerfassung(
  problemerfassung: Problemerfassung[],
  maps: ProblemerfassungMaps
): EnrichedProblemerfassung[] {
  return problemerfassung.map(r => ({
    ...r,
    fertigungsauftragName: resolveDisplay(r.fields.fertigungsauftrag, maps.fertigungsauftragMap, 'auftragsnummer'),
  }));
}

interface AuftragsstatusMaps {
  fertigungsauftragMap: Map<string, Fertigungsauftrag>;
}

export function enrichAuftragsstatus(
  auftragsstatus: Auftragsstatus[],
  maps: AuftragsstatusMaps
): EnrichedAuftragsstatus[] {
  return auftragsstatus.map(r => ({
    ...r,
    fertigungsauftragName: resolveDisplay(r.fields.fertigungsauftrag, maps.fertigungsauftragMap, 'auftragsnummer'),
  }));
}

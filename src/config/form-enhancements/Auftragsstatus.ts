import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'gesamtstatus',
    'aktuelle_station',
    'fertigstellungsgrad_gesamt',
    'fertigungsauftrag',
    'soll_stunden_status',
    'ist_stunden_status',
    'verbleibende_stunden',
    'offene_aufgaben',
    'offene_probleme',
    'fehlende_ressourcen',
    'voraussichtlicher_abschluss',
    'letzte_aktualisierung',
    { row: ['aktualisiert_vorname', 'aktualisiert_nachname'] },
    'statuskommentar',
    'eskalation_erforderlich',
  ],
  defaults: {
    'gesamtstatus': { kind: 'lookup', key: 'planmaessig', label: 'Planmäßig' },
    'fertigstellungsgrad_gesamt': { kind: 'literal', value: 0 },
    'letzte_aktualisierung': { kind: 'today', withTime: true },
    'eskalation_erforderlich': { kind: 'literal', value: false },
  },
  computed: {
    'verbleibende_stunden': { op: 'sub', left: { kind: 'field', key: 'soll_stunden_status' }, right: { kind: 'field', key: 'ist_stunden_status' } },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};

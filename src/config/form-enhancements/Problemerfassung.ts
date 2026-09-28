import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'fertigungsauftrag',
    'betroffene_station',
    'problemtyp',
    'problem_datum_zeit',
    'problem_status',
    'problem_beschreibung',
    'ursache',
    'auswirkung_termin',
    'fehlende_artikel',
    { row: ['gemeldet_vorname', 'gemeldet_nachname'] },
    { row: ['verantwortlich_vorname', 'verantwortlich_nachname'] },
    'loesungsmassnahme',
    'behoben_datum',
  ],
  defaults: {
    'problem_datum_zeit': { kind: 'today', withTime: true },
    'problem_status': { kind: 'lookup', key: 'offen', label: 'Offen' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};

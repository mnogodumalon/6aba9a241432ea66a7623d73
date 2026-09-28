import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'bearbeitungsstatus',
    'fertigungsauftrag',
    'station_nummer',
    'station_bezeichnung_detail',
    'beginn_datum_zeit',
    'ende_datum_zeit',
    'ist_stunden',
    'fertigstellungsgrad',
    'mitarbeiter_vorname',
    'mitarbeiter_nachname',
    'weitere_mitarbeiter',
    { row: ['freigabe_vorname', 'freigabe_nachname'] },
    'erledigte_arbeiten',
    'verwendete_materialien',
    'anmerkungen_station',
  ],
  defaults: {
    'bearbeitungsstatus': { kind: 'lookup', key: 'nicht_begonnen', label: 'Nicht begonnen' },
    'beginn_datum_zeit': { kind: 'today', withTime: true },
  },
  computed: {
    'ist_stunden': { kind: 'dateDiff', from: 'beginn_datum_zeit', to: 'ende_datum_zeit', unit: 'hours' },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};

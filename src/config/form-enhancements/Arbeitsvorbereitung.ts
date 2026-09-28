import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'status_planung',
    'fertigungsauftrag',
    'station_nummer',
    'station_bezeichnung',
    'arbeitsschritt_bezeichnung',
    'arbeitsschritt_beschreibung',
    'benoetigte_mitarbeiter',
    'benoetigte_materialien',
    'soll_stunden',
    'reihenfolge',
    'anmerkungen_planung',
  ],
  defaults: {
    'status_planung': { kind: 'lookup', key: 'offen', label: 'Offen' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};

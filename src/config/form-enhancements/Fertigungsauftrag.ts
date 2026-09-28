import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [
    'auftragsnummer',
    'auftragsdatum',
    'prioritaet',
    { row: ['kunde_vorname', 'kunde_nachname'] },
    'kunde_telefon',
    'kunde_email',
    'fahrzeugtyp',
    'fahrzeugmodell',
    'basisfahrzeug',
    'fahrzeug_laenge',
    'fahrzeug_gewicht',
    'geplanter_start',
    'geplanter_abschluss',
    'projektleiter_vorname',
    'projektleiter_nachname',
    'auftragsstatus_gesamt',
    'soll_stunden_gesamt',
    'sonderausstattung',
    'bemerkungen',
  ],
  defaults: {
    'auftragsdatum': { kind: 'today' },
    'prioritaet': { kind: 'lookup', key: 'normal', label: 'Normal' },
    'geplanter_start': { kind: 'today' },
    'geplanter_abschluss': { kind: 'todayOffset', days: 30 },
    'auftragsstatus_gesamt': { kind: 'lookup', key: 'neu', label: 'Neu' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, { lookupKey: string }[]> = {};

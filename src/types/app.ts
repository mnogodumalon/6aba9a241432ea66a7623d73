import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Fertigungsauftrag {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    auftragsnummer?: string;
    auftragsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    prioritaet?: LookupValue;
    kunde_vorname?: string;
    kunde_nachname?: string;
    kunde_telefon?: string;
    kunde_email?: string;
    fahrzeugtyp?: LookupValue;
    fahrzeugmodell?: string;
    basisfahrzeug?: string;
    fahrzeug_laenge?: number;
    fahrzeug_gewicht?: number;
    geplanter_start?: string; // Format: YYYY-MM-DD oder ISO String
    geplanter_abschluss?: string; // Format: YYYY-MM-DD oder ISO String
    projektleiter_nachname?: string;
    auftragsstatus_gesamt?: LookupValue;
    soll_stunden_gesamt?: number;
    sonderausstattung?: string;
    bemerkungen?: string;
    projektleiter_vorname?: string;
  };
}

export interface Arbeitsvorbereitung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    status_planung?: LookupValue;
    benoetigte_mitarbeiter?: string;
    benoetigte_materialien?: string;
    soll_stunden?: number;
    anmerkungen_planung?: string;
    fertigungsauftrag?: RecordUrl; // applookup -> URL zu 'Fertigungsauftrag' Record
    station_nummer?: LookupValue;
    station_bezeichnung?: string;
    arbeitsschritt_bezeichnung?: string;
    arbeitsschritt_beschreibung?: string;
    reihenfolge?: number;
  };
}

export interface Stationsprotokoll {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    fertigstellungsgrad?: number;
    erledigte_arbeiten?: string;
    verwendete_materialien?: string;
    bearbeitungsstatus?: LookupValue;
    fertigungsauftrag?: RecordUrl; // applookup -> URL zu 'Fertigungsauftrag' Record
    station_nummer?: LookupValue;
    station_bezeichnung_detail?: string;
    beginn_datum_zeit?: string; // Format: YYYY-MM-DD oder ISO String
    ende_datum_zeit?: string; // Format: YYYY-MM-DD oder ISO String
    ist_stunden?: number;
    mitarbeiter_nachname?: string;
    weitere_mitarbeiter?: string;
    mitarbeiter_vorname?: string;
    freigabe_vorname?: string;
    freigabe_nachname?: string;
    fotos?: string;
    anmerkungen_station?: string;
  };
}

export interface Problemerfassung {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    fertigungsauftrag?: RecordUrl; // applookup -> URL zu 'Fertigungsauftrag' Record
    betroffene_station?: LookupValue;
    problemtyp?: LookupValue;
    problem_datum_zeit?: string; // Format: YYYY-MM-DD oder ISO String
    problem_beschreibung?: string;
    ursache?: string;
    auswirkung_termin?: LookupValue;
    fehlende_artikel?: string;
    gemeldet_vorname?: string;
    gemeldet_nachname?: string;
    verantwortlich_vorname?: string;
    verantwortlich_nachname?: string;
    loesungsmassnahme?: string;
    problem_status?: LookupValue;
    behoben_datum?: string; // Format: YYYY-MM-DD oder ISO String
    problem_foto?: string;
  };
}

export interface Auftragsstatus {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    gesamtstatus?: LookupValue;
    aktuelle_station?: LookupValue;
    fertigstellungsgrad_gesamt?: number;
    fertigungsauftrag?: RecordUrl; // applookup -> URL zu 'Fertigungsauftrag' Record
    soll_stunden_status?: number;
    ist_stunden_status?: number;
    verbleibende_stunden?: number;
    offene_aufgaben?: number;
    offene_probleme?: number;
    fehlende_ressourcen?: string;
    voraussichtlicher_abschluss?: string; // Format: YYYY-MM-DD oder ISO String
    letzte_aktualisierung?: string; // Format: YYYY-MM-DD oder ISO String
    aktualisiert_vorname?: string;
    aktualisiert_nachname?: string;
    statuskommentar?: string;
    eskalation_erforderlich?: boolean;
  };
}

export const APP_IDS = {
  FERTIGUNGSAUFTRAG: '6aba99e7cdfa6620f444282d',
  ARBEITSVORBEREITUNG: '6aba99ffa46e6aa76f3288f1',
  STATIONSPROTOKOLL: '6aba99ff5ad0c4dacbb45694',
  PROBLEMERFASSUNG: '6aba9a0091f5202e7e27158f',
  AUFTRAGSSTATUS: '6aba9a0140e49f8a5fcce83e',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'fertigungsauftrag': {
    prioritaet: [{ key: "normal", get label() { return lookupLabel('fertigungsauftrag', 'prioritaet', "normal") ?? "Normal"; } }, { key: "hoch", get label() { return lookupLabel('fertigungsauftrag', 'prioritaet', "hoch") ?? "Hoch"; } }, { key: "dringend", get label() { return lookupLabel('fertigungsauftrag', 'prioritaet', "dringend") ?? "Dringend"; } }],
    fahrzeugtyp: [{ key: "alkoven", get label() { return lookupLabel('fertigungsauftrag', 'fahrzeugtyp', "alkoven") ?? "Alkoven"; } }, { key: "teilintegriert", get label() { return lookupLabel('fertigungsauftrag', 'fahrzeugtyp', "teilintegriert") ?? "Teilintegriert"; } }, { key: "vollintegriert", get label() { return lookupLabel('fertigungsauftrag', 'fahrzeugtyp', "vollintegriert") ?? "Vollintegriert"; } }, { key: "kastenwagen", get label() { return lookupLabel('fertigungsauftrag', 'fahrzeugtyp', "kastenwagen") ?? "Kastenwagen"; } }, { key: "pickup_aufbau", get label() { return lookupLabel('fertigungsauftrag', 'fahrzeugtyp', "pickup_aufbau") ?? "Pickup-Aufbau"; } }],
    auftragsstatus_gesamt: [{ key: "neu", get label() { return lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', "neu") ?? "Neu"; } }, { key: "in_planung", get label() { return lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', "in_planung") ?? "In Planung"; } }, { key: "in_fertigung", get label() { return lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', "in_fertigung") ?? "In Fertigung"; } }, { key: "qualitaetspruefung", get label() { return lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', "qualitaetspruefung") ?? "Qualitätsprüfung"; } }, { key: "abgeschlossen", get label() { return lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "storniert", get label() { return lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', "storniert") ?? "Storniert"; } }],
  },
  'arbeitsvorbereitung': {
    status_planung: [{ key: "erledigt", get label() { return lookupLabel('arbeitsvorbereitung', 'status_planung', "erledigt") ?? "Erledigt"; } }, { key: "blockiert", get label() { return lookupLabel('arbeitsvorbereitung', 'status_planung', "blockiert") ?? "Blockiert"; } }, { key: "offen", get label() { return lookupLabel('arbeitsvorbereitung', 'status_planung', "offen") ?? "Offen"; } }, { key: "in_bearbeitung", get label() { return lookupLabel('arbeitsvorbereitung', 'status_planung', "in_bearbeitung") ?? "In Bearbeitung"; } }],
    station_nummer: [{ key: "station_1", get label() { return lookupLabel('arbeitsvorbereitung', 'station_nummer', "station_1") ?? "Station 1 – Rohbau / Basisaufbau"; } }, { key: "station_2", get label() { return lookupLabel('arbeitsvorbereitung', 'station_nummer', "station_2") ?? "Station 2 – Elektrik / Sanitär"; } }, { key: "station_3", get label() { return lookupLabel('arbeitsvorbereitung', 'station_nummer', "station_3") ?? "Station 3 – Innenausbau"; } }, { key: "station_4", get label() { return lookupLabel('arbeitsvorbereitung', 'station_nummer', "station_4") ?? "Station 4 – Außenverkleidung / Lackierung"; } }, { key: "station_5", get label() { return lookupLabel('arbeitsvorbereitung', 'station_nummer', "station_5") ?? "Station 5 – Endmontage / Qualitätsprüfung"; } }],
  },
  'stationsprotokoll': {
    bearbeitungsstatus: [{ key: "nicht_begonnen", get label() { return lookupLabel('stationsprotokoll', 'bearbeitungsstatus', "nicht_begonnen") ?? "Nicht begonnen"; } }, { key: "in_bearbeitung", get label() { return lookupLabel('stationsprotokoll', 'bearbeitungsstatus', "in_bearbeitung") ?? "In Bearbeitung"; } }, { key: "unterbrochen", get label() { return lookupLabel('stationsprotokoll', 'bearbeitungsstatus', "unterbrochen") ?? "Unterbrochen"; } }, { key: "abgeschlossen", get label() { return lookupLabel('stationsprotokoll', 'bearbeitungsstatus', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "freigegeben", get label() { return lookupLabel('stationsprotokoll', 'bearbeitungsstatus', "freigegeben") ?? "Freigegeben"; } }],
    station_nummer: [{ key: "station_1", get label() { return lookupLabel('stationsprotokoll', 'station_nummer', "station_1") ?? "Station 1 – Rohbau / Basisaufbau"; } }, { key: "station_2", get label() { return lookupLabel('stationsprotokoll', 'station_nummer', "station_2") ?? "Station 2 – Elektrik / Sanitär"; } }, { key: "station_3", get label() { return lookupLabel('stationsprotokoll', 'station_nummer', "station_3") ?? "Station 3 – Innenausbau"; } }, { key: "station_4", get label() { return lookupLabel('stationsprotokoll', 'station_nummer', "station_4") ?? "Station 4 – Außenverkleidung / Lackierung"; } }, { key: "station_5", get label() { return lookupLabel('stationsprotokoll', 'station_nummer', "station_5") ?? "Station 5 – Endmontage / Qualitätsprüfung"; } }],
  },
  'problemerfassung': {
    betroffene_station: [{ key: "station_1", get label() { return lookupLabel('problemerfassung', 'betroffene_station', "station_1") ?? "Station 1 – Rohbau / Basisaufbau"; } }, { key: "station_2", get label() { return lookupLabel('problemerfassung', 'betroffene_station', "station_2") ?? "Station 2 – Elektrik / Sanitär"; } }, { key: "station_3", get label() { return lookupLabel('problemerfassung', 'betroffene_station', "station_3") ?? "Station 3 – Innenausbau"; } }, { key: "station_4", get label() { return lookupLabel('problemerfassung', 'betroffene_station', "station_4") ?? "Station 4 – Außenverkleidung / Lackierung"; } }, { key: "station_5", get label() { return lookupLabel('problemerfassung', 'betroffene_station', "station_5") ?? "Station 5 – Endmontage / Qualitätsprüfung"; } }, { key: "stationsuebergreifend", get label() { return lookupLabel('problemerfassung', 'betroffene_station', "stationsuebergreifend") ?? "Stationsübergreifend"; } }],
    problemtyp: [{ key: "verzoegerung", get label() { return lookupLabel('problemerfassung', 'problemtyp', "verzoegerung") ?? "Verzögerung"; } }, { key: "fehlender_artikel", get label() { return lookupLabel('problemerfassung', 'problemtyp', "fehlender_artikel") ?? "Fehlender Artikel / Material"; } }, { key: "qualitaetsproblem", get label() { return lookupLabel('problemerfassung', 'problemtyp', "qualitaetsproblem") ?? "Qualitätsproblem"; } }, { key: "personalausfall", get label() { return lookupLabel('problemerfassung', 'problemtyp', "personalausfall") ?? "Personalausfall"; } }, { key: "technischer_defekt", get label() { return lookupLabel('problemerfassung', 'problemtyp', "technischer_defekt") ?? "Technischer Defekt"; } }, { key: "sonstiges", get label() { return lookupLabel('problemerfassung', 'problemtyp', "sonstiges") ?? "Sonstiges"; } }],
    auswirkung_termin: [{ key: "keine_auswirkung", get label() { return lookupLabel('problemerfassung', 'auswirkung_termin', "keine_auswirkung") ?? "Keine Auswirkung"; } }, { key: "gering", get label() { return lookupLabel('problemerfassung', 'auswirkung_termin', "gering") ?? "Geringe Verzögerung (< 1 Tag)"; } }, { key: "mittel", get label() { return lookupLabel('problemerfassung', 'auswirkung_termin', "mittel") ?? "Mittlere Verzögerung (1–3 Tage)"; } }, { key: "stark", get label() { return lookupLabel('problemerfassung', 'auswirkung_termin', "stark") ?? "Starke Verzögerung (> 3 Tage)"; } }],
    problem_status: [{ key: "offen", get label() { return lookupLabel('problemerfassung', 'problem_status', "offen") ?? "Offen"; } }, { key: "in_klaerung", get label() { return lookupLabel('problemerfassung', 'problem_status', "in_klaerung") ?? "In Klärung"; } }, { key: "massnahme_eingeleitet", get label() { return lookupLabel('problemerfassung', 'problem_status', "massnahme_eingeleitet") ?? "Maßnahme eingeleitet"; } }, { key: "behoben", get label() { return lookupLabel('problemerfassung', 'problem_status', "behoben") ?? "Behoben"; } }, { key: "eskaliert", get label() { return lookupLabel('problemerfassung', 'problem_status', "eskaliert") ?? "Eskaliert"; } }],
  },
  'auftragsstatus': {
    gesamtstatus: [{ key: "planmaessig", get label() { return lookupLabel('auftragsstatus', 'gesamtstatus', "planmaessig") ?? "Planmäßig"; } }, { key: "leichte_verzoegerung", get label() { return lookupLabel('auftragsstatus', 'gesamtstatus', "leichte_verzoegerung") ?? "Leichte Verzögerung"; } }, { key: "starke_verzoegerung", get label() { return lookupLabel('auftragsstatus', 'gesamtstatus', "starke_verzoegerung") ?? "Starke Verzögerung"; } }, { key: "kritisch", get label() { return lookupLabel('auftragsstatus', 'gesamtstatus', "kritisch") ?? "Kritisch"; } }, { key: "abgeschlossen", get label() { return lookupLabel('auftragsstatus', 'gesamtstatus', "abgeschlossen") ?? "Abgeschlossen"; } }],
    aktuelle_station: [{ key: "station_2", get label() { return lookupLabel('auftragsstatus', 'aktuelle_station', "station_2") ?? "Station 2 – Elektrik / Sanitär"; } }, { key: "station_3", get label() { return lookupLabel('auftragsstatus', 'aktuelle_station', "station_3") ?? "Station 3 – Innenausbau"; } }, { key: "station_4", get label() { return lookupLabel('auftragsstatus', 'aktuelle_station', "station_4") ?? "Station 4 – Außenverkleidung / Lackierung"; } }, { key: "station_5", get label() { return lookupLabel('auftragsstatus', 'aktuelle_station', "station_5") ?? "Station 5 – Endmontage / Qualitätsprüfung"; } }, { key: "abgeschlossen", get label() { return lookupLabel('auftragsstatus', 'aktuelle_station', "abgeschlossen") ?? "Abgeschlossen"; } }, { key: "station_1", get label() { return lookupLabel('auftragsstatus', 'aktuelle_station', "station_1") ?? "Station 1 – Rohbau / Basisaufbau"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'fertigungsauftrag': {
    'auftragsnummer': 'string/text',
    'auftragsdatum': 'date/date',
    'prioritaet': 'lookup/radio',
    'kunde_vorname': 'string/text',
    'kunde_nachname': 'string/text',
    'kunde_telefon': 'string/tel',
    'kunde_email': 'string/email',
    'fahrzeugtyp': 'lookup/select',
    'fahrzeugmodell': 'string/text',
    'basisfahrzeug': 'string/text',
    'fahrzeug_laenge': 'number',
    'fahrzeug_gewicht': 'number',
    'geplanter_start': 'date/date',
    'geplanter_abschluss': 'date/date',
    'projektleiter_nachname': 'string/text',
    'auftragsstatus_gesamt': 'lookup/select',
    'soll_stunden_gesamt': 'number',
    'sonderausstattung': 'string/textarea',
    'bemerkungen': 'string/textarea',
    'projektleiter_vorname': 'string/text',
  },
  'arbeitsvorbereitung': {
    'status_planung': 'lookup/select',
    'benoetigte_mitarbeiter': 'string/textarea',
    'benoetigte_materialien': 'string/textarea',
    'soll_stunden': 'number',
    'anmerkungen_planung': 'string/textarea',
    'fertigungsauftrag': 'applookup/select',
    'station_nummer': 'lookup/radio',
    'station_bezeichnung': 'string/text',
    'arbeitsschritt_bezeichnung': 'string/text',
    'arbeitsschritt_beschreibung': 'string/textarea',
    'reihenfolge': 'number',
  },
  'stationsprotokoll': {
    'fertigstellungsgrad': 'number',
    'erledigte_arbeiten': 'string/textarea',
    'verwendete_materialien': 'string/textarea',
    'bearbeitungsstatus': 'lookup/select',
    'fertigungsauftrag': 'applookup/select',
    'station_nummer': 'lookup/radio',
    'station_bezeichnung_detail': 'string/text',
    'beginn_datum_zeit': 'date/datetimeminute',
    'ende_datum_zeit': 'date/datetimeminute',
    'ist_stunden': 'number',
    'mitarbeiter_nachname': 'string/text',
    'weitere_mitarbeiter': 'string/textarea',
    'mitarbeiter_vorname': 'string/text',
    'freigabe_vorname': 'string/text',
    'freigabe_nachname': 'string/text',
    'fotos': 'file',
    'anmerkungen_station': 'string/textarea',
  },
  'problemerfassung': {
    'fertigungsauftrag': 'applookup/select',
    'betroffene_station': 'lookup/select',
    'problemtyp': 'lookup/radio',
    'problem_datum_zeit': 'date/datetimeminute',
    'problem_beschreibung': 'string/textarea',
    'ursache': 'string/textarea',
    'auswirkung_termin': 'lookup/radio',
    'fehlende_artikel': 'string/textarea',
    'gemeldet_vorname': 'string/text',
    'gemeldet_nachname': 'string/text',
    'verantwortlich_vorname': 'string/text',
    'verantwortlich_nachname': 'string/text',
    'loesungsmassnahme': 'string/textarea',
    'problem_status': 'lookup/select',
    'behoben_datum': 'date/date',
    'problem_foto': 'file',
  },
  'auftragsstatus': {
    'gesamtstatus': 'lookup/select',
    'aktuelle_station': 'lookup/select',
    'fertigstellungsgrad_gesamt': 'number',
    'fertigungsauftrag': 'applookup/select',
    'soll_stunden_status': 'number',
    'ist_stunden_status': 'number',
    'verbleibende_stunden': 'number',
    'offene_aufgaben': 'number',
    'offene_probleme': 'number',
    'fehlende_ressourcen': 'string/textarea',
    'voraussichtlicher_abschluss': 'date/date',
    'letzte_aktualisierung': 'date/datetimeminute',
    'aktualisiert_vorname': 'string/text',
    'aktualisiert_nachname': 'string/text',
    'statuskommentar': 'string/textarea',
    'eskalation_erforderlich': 'bool',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
  'fertigungsauftrag': [
    { field: 'fertigungsauftrag', entity: 'arbeitsvorbereitung' },
    { field: 'fertigungsauftrag', entity: 'stationsprotokoll' },
    { field: 'fertigungsauftrag', entity: 'problemerfassung' },
    { field: 'fertigungsauftrag', entity: 'auftragsstatus' },
  ],
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateFertigungsauftrag = StripLookup<Fertigungsauftrag['fields']>;
export type CreateArbeitsvorbereitung = StripLookup<Arbeitsvorbereitung['fields']>;
export type CreateStationsprotokoll = StripLookup<Stationsprotokoll['fields']>;
export type CreateProblemerfassung = StripLookup<Problemerfassung['fields']>;
export type CreateAuftragsstatus = StripLookup<Auftragsstatus['fields']>;
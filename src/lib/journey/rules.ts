/**
 * Field rules — GENERATED from the app metadata. Do not edit.
 *
 * The mechanical truth about every field: what kind it is, whether the
 * platform's base view marks it required, which lookup keys exist, where an
 * applookup points, what the label is. `useStepForm` validates against these
 * rules and phrases its messages with the real labels; `toWirePayload` uses
 * them to shape the create payload; `SHAPES` tells a page which input FORM
 * fits the data (a date pair wants a calendar, not two fields) — it is a
 * signal, not a gate.
 */
import { appLabel, fieldLabel, lookupLabel } from '@/i18n';
import { LOOKUP_OPTIONS } from '@/types/app';

export type EntityKey = 'fertigungsauftrag' | 'arbeitsvorbereitung' | 'stationsprotokoll' | 'problemerfassung' | 'auftragsstatus';

/** The text fields of each entity — what a search may run over (generated;
 *  `never` for an entity without text of its own, e.g. a link table). */
export interface StringFields {
  "fertigungsauftrag": "auftragsnummer" | "kunde_vorname" | "kunde_nachname" | "kunde_telefon" | "kunde_email" | "fahrzeugmodell" | "basisfahrzeug" | "projektleiter_nachname" | "sonderausstattung" | "bemerkungen" | "projektleiter_vorname";
  "arbeitsvorbereitung": "benoetigte_mitarbeiter" | "benoetigte_materialien" | "anmerkungen_planung" | "station_bezeichnung" | "arbeitsschritt_bezeichnung" | "arbeitsschritt_beschreibung";
  "stationsprotokoll": "erledigte_arbeiten" | "verwendete_materialien" | "station_bezeichnung_detail" | "mitarbeiter_nachname" | "weitere_mitarbeiter" | "mitarbeiter_vorname" | "freigabe_vorname" | "freigabe_nachname" | "anmerkungen_station";
  "problemerfassung": "problem_beschreibung" | "ursache" | "fehlende_artikel" | "gemeldet_vorname" | "gemeldet_nachname" | "verantwortlich_vorname" | "verantwortlich_nachname" | "loesungsmassnahme";
  "auftragsstatus": "fehlende_ressourcen" | "aktualisiert_vorname" | "aktualisiert_nachname" | "statuskommentar";
}
export type StringFieldKey<E extends EntityKey> = E extends keyof StringFields ? StringFields[E] : never;

/** The applookup fields of each entity (generated). A pick stored through
 *  `form.set` on one of these must carry its display name — at compile time
 *  (`StepForm.set`), because the review would otherwise show the id. */
export interface RecordFields {
  "fertigungsauftrag": never;
  "arbeitsvorbereitung": "fertigungsauftrag";
  "stationsprotokoll": "fertigungsauftrag";
  "problemerfassung": "fertigungsauftrag";
  "auftragsstatus": "fertigungsauftrag";
}
export type RecordFieldKey<E extends EntityKey> = E extends keyof RecordFields ? RecordFields[E] : never;

export type FieldKind =
  | 'text'
  | 'textarea'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'bool'
  | 'date'
  | 'datetime'
  | 'lookup'
  | 'multilookup'
  | 'record'
  | 'multirecord'
  | 'file'
  | 'geo';

export interface FieldRule {
  key: string;
  fulltype: string;
  kind: FieldKind;
  /** From the app's base view. A public page may override this per field. */
  required: boolean;
  /** Build-time label — `labelOf()` prefers the runtime i18n bundle. */
  label: string;
  /** Whether a journey may write it (`file` is upload-only, never via a journey). */
  writable: boolean;
  maxLength?: number;
  /** lookup / multilookup: the ONLY valid write values. */
  options?: string[];
  /** record / multirecord: the target app (always) and its entity key (when inside this appgroup). */
  targetAppId?: string;
  targetEntity?: EntityKey;
  format?: 'currency';
  /** HTML autocomplete token derived from the field name (given-name, email, tel, …). */
  autoComplete?: string;
}

export interface EntityInfo {
  key: EntityKey;
  appId: string;
  label: string;
  /** PascalCase plural — `get<pascal>()` on the service. */
  pascal: string;
  /** The single-record suffix — `create<single>()` on the service. */
  single: string;
}

/** Input-form signals per entity: which data shape each field (pair) has.
 *  `range`  — two date fields that form a stay/period → AvailabilityRangePicker
 *  `choice` — a lookup with few options → ChoiceGroup pills instead of a select
 *  `record` — an applookup → EntitySelectStep with search, never a raw id field
 *  `stock`  — a quantity that has a stock/capacity counterpart → show it, warn on overshoot */
export type Shape =
  | { kind: 'range'; from: string; to: string }
  | { kind: 'choice'; field: string; count: number }
  | { kind: 'record'; field: string; targetEntity?: EntityKey }
  | { kind: 'stock'; field: string };

export const ENTITIES: Record<EntityKey, EntityInfo> = {
  "fertigungsauftrag": {
    "key": "fertigungsauftrag",
    "appId": "6aba99e7cdfa6620f444282d",
    "label": "Fertigungsauftrag",
    "pascal": "Fertigungsauftrag",
    "single": "FertigungsauftragEntry"
  },
  "arbeitsvorbereitung": {
    "key": "arbeitsvorbereitung",
    "appId": "6aba99ffa46e6aa76f3288f1",
    "label": "Arbeitsvorbereitung",
    "pascal": "Arbeitsvorbereitung",
    "single": "ArbeitsvorbereitungEntry"
  },
  "stationsprotokoll": {
    "key": "stationsprotokoll",
    "appId": "6aba99ff5ad0c4dacbb45694",
    "label": "Stationsprotokoll",
    "pascal": "Stationsprotokoll",
    "single": "StationsprotokollEntry"
  },
  "problemerfassung": {
    "key": "problemerfassung",
    "appId": "6aba9a0091f5202e7e27158f",
    "label": "Problemerfassung",
    "pascal": "Problemerfassung",
    "single": "ProblemerfassungEntry"
  },
  "auftragsstatus": {
    "key": "auftragsstatus",
    "appId": "6aba9a0140e49f8a5fcce83e",
    "label": "Auftragsstatus",
    "pascal": "Auftragsstatus",
    "single": "Auftragsstatu"
  }
};

export const FIELD_RULES: Record<EntityKey, Record<string, FieldRule>> = {
  "fertigungsauftrag": {
    "auftragsnummer": {
      "key": "auftragsnummer",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Auftragsnummer",
      "writable": true,
      "maxLength": 4000
    },
    "auftragsdatum": {
      "key": "auftragsdatum",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Auftragsdatum",
      "writable": true
    },
    "prioritaet": {
      "key": "prioritaet",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Priorität",
      "writable": true,
      "options": [
        "normal",
        "hoch",
        "dringend"
      ]
    },
    "kunde_vorname": {
      "key": "kunde_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname Kunde",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "kunde_nachname": {
      "key": "kunde_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname Kunde",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "kunde_telefon": {
      "key": "kunde_telefon",
      "fulltype": "string/tel",
      "kind": "tel",
      "required": false,
      "label": "Telefon Kunde",
      "writable": true,
      "autoComplete": "tel"
    },
    "kunde_email": {
      "key": "kunde_email",
      "fulltype": "string/email",
      "kind": "email",
      "required": false,
      "label": "E-Mail Kunde",
      "writable": true,
      "autoComplete": "email"
    },
    "fahrzeugtyp": {
      "key": "fahrzeugtyp",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Fahrzeugtyp",
      "writable": true,
      "options": [
        "alkoven",
        "teilintegriert",
        "vollintegriert",
        "kastenwagen",
        "pickup_aufbau"
      ]
    },
    "fahrzeugmodell": {
      "key": "fahrzeugmodell",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Fahrzeugmodell / Bezeichnung",
      "writable": true,
      "maxLength": 4000
    },
    "basisfahrzeug": {
      "key": "basisfahrzeug",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Basisfahrzeug",
      "writable": true,
      "maxLength": 4000
    },
    "fahrzeug_laenge": {
      "key": "fahrzeug_laenge",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Fahrzeuglänge (m)",
      "writable": true
    },
    "fahrzeug_gewicht": {
      "key": "fahrzeug_gewicht",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Zulässiges Gesamtgewicht (kg)",
      "writable": true,
      "format": "currency"
    },
    "geplanter_start": {
      "key": "geplanter_start",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Geplanter Fertigungsstart",
      "writable": true
    },
    "geplanter_abschluss": {
      "key": "geplanter_abschluss",
      "fulltype": "date/date",
      "kind": "date",
      "required": true,
      "label": "Geplanter Fertigstellungstermin",
      "writable": true
    },
    "projektleiter_nachname": {
      "key": "projektleiter_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname Projektleiter",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "auftragsstatus_gesamt": {
      "key": "auftragsstatus_gesamt",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Auftragsstatus",
      "writable": true,
      "options": [
        "neu",
        "in_planung",
        "in_fertigung",
        "qualitaetspruefung",
        "abgeschlossen",
        "storniert"
      ]
    },
    "soll_stunden_gesamt": {
      "key": "soll_stunden_gesamt",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Soll-Stunden gesamt",
      "writable": true
    },
    "sonderausstattung": {
      "key": "sonderausstattung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Sonderausstattung / Kundenwünsche",
      "writable": true
    },
    "bemerkungen": {
      "key": "bemerkungen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Weitere Bemerkungen",
      "writable": true
    },
    "projektleiter_vorname": {
      "key": "projektleiter_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname Projektleiter",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    }
  },
  "arbeitsvorbereitung": {
    "status_planung": {
      "key": "status_planung",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Status",
      "writable": true,
      "options": [
        "erledigt",
        "blockiert",
        "offen",
        "in_bearbeitung"
      ]
    },
    "benoetigte_mitarbeiter": {
      "key": "benoetigte_mitarbeiter",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Benötigte Mitarbeiter",
      "writable": true
    },
    "benoetigte_materialien": {
      "key": "benoetigte_materialien",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Benötigte Materialien / Artikel",
      "writable": true
    },
    "soll_stunden": {
      "key": "soll_stunden",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Soll-Stunden",
      "writable": true
    },
    "anmerkungen_planung": {
      "key": "anmerkungen_planung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Anmerkungen zur Planung",
      "writable": true
    },
    "fertigungsauftrag": {
      "key": "fertigungsauftrag",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Fertigungsauftrag",
      "writable": true,
      "targetAppId": "6aba99e7cdfa6620f444282d",
      "targetEntity": "fertigungsauftrag"
    },
    "station_nummer": {
      "key": "station_nummer",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Stationsnummer",
      "writable": true,
      "options": [
        "station_1",
        "station_2",
        "station_3",
        "station_4",
        "station_5"
      ]
    },
    "station_bezeichnung": {
      "key": "station_bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Stationsbezeichnung (Detail)",
      "writable": true,
      "maxLength": 4000
    },
    "arbeitsschritt_bezeichnung": {
      "key": "arbeitsschritt_bezeichnung",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Bezeichnung des Arbeitsschritts",
      "writable": true,
      "maxLength": 4000
    },
    "arbeitsschritt_beschreibung": {
      "key": "arbeitsschritt_beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Beschreibung des Arbeitsschritts",
      "writable": true
    },
    "reihenfolge": {
      "key": "reihenfolge",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Reihenfolge / Priorität",
      "writable": true
    }
  },
  "stationsprotokoll": {
    "fertigstellungsgrad": {
      "key": "fertigstellungsgrad",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Fertigstellungsgrad Station (%)",
      "writable": true
    },
    "erledigte_arbeiten": {
      "key": "erledigte_arbeiten",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Erledigte Arbeiten",
      "writable": true
    },
    "verwendete_materialien": {
      "key": "verwendete_materialien",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Verwendete Materialien / Artikel",
      "writable": true
    },
    "bearbeitungsstatus": {
      "key": "bearbeitungsstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Bearbeitungsstatus",
      "writable": true,
      "options": [
        "nicht_begonnen",
        "in_bearbeitung",
        "unterbrochen",
        "abgeschlossen",
        "freigegeben"
      ]
    },
    "fertigungsauftrag": {
      "key": "fertigungsauftrag",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Fertigungsauftrag",
      "writable": true,
      "targetAppId": "6aba99e7cdfa6620f444282d",
      "targetEntity": "fertigungsauftrag"
    },
    "station_nummer": {
      "key": "station_nummer",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Stationsnummer",
      "writable": true,
      "options": [
        "station_1",
        "station_2",
        "station_3",
        "station_4",
        "station_5"
      ]
    },
    "station_bezeichnung_detail": {
      "key": "station_bezeichnung_detail",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Stationsbezeichnung (Detail)",
      "writable": true,
      "maxLength": 4000
    },
    "beginn_datum_zeit": {
      "key": "beginn_datum_zeit",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Beginn (Datum und Uhrzeit)",
      "writable": true
    },
    "ende_datum_zeit": {
      "key": "ende_datum_zeit",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": false,
      "label": "Ende (Datum und Uhrzeit)",
      "writable": true
    },
    "ist_stunden": {
      "key": "ist_stunden",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Ist-Stunden",
      "writable": true
    },
    "mitarbeiter_nachname": {
      "key": "mitarbeiter_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname Mitarbeiter (verantwortlich)",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "weitere_mitarbeiter": {
      "key": "weitere_mitarbeiter",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Weitere beteiligte Mitarbeiter",
      "writable": true
    },
    "mitarbeiter_vorname": {
      "key": "mitarbeiter_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname Mitarbeiter (verantwortlich)",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "freigabe_vorname": {
      "key": "freigabe_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Vorname Freigabe durch",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "freigabe_nachname": {
      "key": "freigabe_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Nachname Freigabe durch",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "fotos": {
      "key": "fotos",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Fotos / Dokumente",
      "writable": false
    },
    "anmerkungen_station": {
      "key": "anmerkungen_station",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Anmerkungen zur Station",
      "writable": true
    }
  },
  "problemerfassung": {
    "fertigungsauftrag": {
      "key": "fertigungsauftrag",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Fertigungsauftrag",
      "writable": true,
      "targetAppId": "6aba99e7cdfa6620f444282d",
      "targetEntity": "fertigungsauftrag"
    },
    "betroffene_station": {
      "key": "betroffene_station",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Betroffene Station",
      "writable": true,
      "options": [
        "station_1",
        "station_2",
        "station_3",
        "station_4",
        "station_5",
        "stationsuebergreifend"
      ]
    },
    "problemtyp": {
      "key": "problemtyp",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": true,
      "label": "Problemtyp",
      "writable": true,
      "options": [
        "verzoegerung",
        "fehlender_artikel",
        "qualitaetsproblem",
        "personalausfall",
        "technischer_defekt",
        "sonstiges"
      ]
    },
    "problem_datum_zeit": {
      "key": "problem_datum_zeit",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Zeitpunkt des Problems",
      "writable": true
    },
    "problem_beschreibung": {
      "key": "problem_beschreibung",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": true,
      "label": "Problembeschreibung",
      "writable": true
    },
    "ursache": {
      "key": "ursache",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Ursache",
      "writable": true
    },
    "auswirkung_termin": {
      "key": "auswirkung_termin",
      "fulltype": "lookup/radio",
      "kind": "lookup",
      "required": false,
      "label": "Auswirkung auf Fertigstellungstermin",
      "writable": true,
      "options": [
        "keine_auswirkung",
        "gering",
        "mittel",
        "stark"
      ]
    },
    "fehlende_artikel": {
      "key": "fehlende_artikel",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Fehlende Artikel / Materialien",
      "writable": true
    },
    "gemeldet_vorname": {
      "key": "gemeldet_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname Melder",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "gemeldet_nachname": {
      "key": "gemeldet_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname Melder",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "verantwortlich_vorname": {
      "key": "verantwortlich_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Vorname Verantwortlicher",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "verantwortlich_nachname": {
      "key": "verantwortlich_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": false,
      "label": "Nachname Verantwortlicher",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "loesungsmassnahme": {
      "key": "loesungsmassnahme",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Lösungsmaßnahme",
      "writable": true
    },
    "problem_status": {
      "key": "problem_status",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Problemstatus",
      "writable": true,
      "options": [
        "offen",
        "in_klaerung",
        "massnahme_eingeleitet",
        "behoben",
        "eskaliert"
      ]
    },
    "behoben_datum": {
      "key": "behoben_datum",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Behebungsdatum",
      "writable": true
    },
    "problem_foto": {
      "key": "problem_foto",
      "fulltype": "file",
      "kind": "file",
      "required": false,
      "label": "Foto / Dokument zum Problem",
      "writable": false
    }
  },
  "auftragsstatus": {
    "gesamtstatus": {
      "key": "gesamtstatus",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Gesamtstatus Auftrag",
      "writable": true,
      "options": [
        "planmaessig",
        "leichte_verzoegerung",
        "starke_verzoegerung",
        "kritisch",
        "abgeschlossen"
      ]
    },
    "aktuelle_station": {
      "key": "aktuelle_station",
      "fulltype": "lookup/select",
      "kind": "lookup",
      "required": true,
      "label": "Aktuelle Station",
      "writable": true,
      "options": [
        "station_2",
        "station_3",
        "station_4",
        "station_5",
        "abgeschlossen",
        "station_1"
      ]
    },
    "fertigstellungsgrad_gesamt": {
      "key": "fertigstellungsgrad_gesamt",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Gesamtfertigstellungsgrad (%)",
      "writable": true
    },
    "fertigungsauftrag": {
      "key": "fertigungsauftrag",
      "fulltype": "applookup/select",
      "kind": "record",
      "required": true,
      "label": "Fertigungsauftrag",
      "writable": true,
      "targetAppId": "6aba99e7cdfa6620f444282d",
      "targetEntity": "fertigungsauftrag"
    },
    "soll_stunden_status": {
      "key": "soll_stunden_status",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Soll-Stunden gesamt",
      "writable": true
    },
    "ist_stunden_status": {
      "key": "ist_stunden_status",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Ist-Stunden gesamt (aktuell)",
      "writable": true
    },
    "verbleibende_stunden": {
      "key": "verbleibende_stunden",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Verbleibende Stunden (Schätzung)",
      "writable": true
    },
    "offene_aufgaben": {
      "key": "offene_aufgaben",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Anzahl offener Aufgaben",
      "writable": true
    },
    "offene_probleme": {
      "key": "offene_probleme",
      "fulltype": "number",
      "kind": "number",
      "required": false,
      "label": "Anzahl offener Probleme",
      "writable": true
    },
    "fehlende_ressourcen": {
      "key": "fehlende_ressourcen",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Fehlende Ressourcen / Materialien",
      "writable": true
    },
    "voraussichtlicher_abschluss": {
      "key": "voraussichtlicher_abschluss",
      "fulltype": "date/date",
      "kind": "date",
      "required": false,
      "label": "Voraussichtlicher Fertigstellungstermin",
      "writable": true
    },
    "letzte_aktualisierung": {
      "key": "letzte_aktualisierung",
      "fulltype": "date/datetimeminute",
      "kind": "datetime",
      "required": true,
      "label": "Letzte Aktualisierung",
      "writable": true
    },
    "aktualisiert_vorname": {
      "key": "aktualisiert_vorname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Vorname Bearbeiter",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "given-name"
    },
    "aktualisiert_nachname": {
      "key": "aktualisiert_nachname",
      "fulltype": "string/text",
      "kind": "text",
      "required": true,
      "label": "Nachname Bearbeiter",
      "writable": true,
      "maxLength": 4000,
      "autoComplete": "family-name"
    },
    "statuskommentar": {
      "key": "statuskommentar",
      "fulltype": "string/textarea",
      "kind": "textarea",
      "required": false,
      "label": "Statuskommentar",
      "writable": true
    },
    "eskalation_erforderlich": {
      "key": "eskalation_erforderlich",
      "fulltype": "bool",
      "kind": "bool",
      "required": false,
      "label": "Eskalation erforderlich",
      "writable": true
    }
  }
};

export const SHAPES: Record<EntityKey, Shape[]> = {
  "fertigungsauftrag": [
    {
      "kind": "choice",
      "field": "prioritaet",
      "count": 3
    },
    {
      "kind": "choice",
      "field": "fahrzeugtyp",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "auftragsstatus_gesamt",
      "count": 6
    }
  ],
  "arbeitsvorbereitung": [
    {
      "kind": "choice",
      "field": "status_planung",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "station_nummer",
      "count": 5
    },
    {
      "kind": "record",
      "field": "fertigungsauftrag",
      "targetEntity": "fertigungsauftrag"
    }
  ],
  "stationsprotokoll": [
    {
      "kind": "choice",
      "field": "bearbeitungsstatus",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "station_nummer",
      "count": 5
    },
    {
      "kind": "record",
      "field": "fertigungsauftrag",
      "targetEntity": "fertigungsauftrag"
    }
  ],
  "problemerfassung": [
    {
      "kind": "choice",
      "field": "betroffene_station",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "problemtyp",
      "count": 6
    },
    {
      "kind": "choice",
      "field": "auswirkung_termin",
      "count": 4
    },
    {
      "kind": "choice",
      "field": "problem_status",
      "count": 5
    },
    {
      "kind": "record",
      "field": "fertigungsauftrag",
      "targetEntity": "fertigungsauftrag"
    }
  ],
  "auftragsstatus": [
    {
      "kind": "choice",
      "field": "gesamtstatus",
      "count": 5
    },
    {
      "kind": "choice",
      "field": "aktuelle_station",
      "count": 6
    },
    {
      "kind": "record",
      "field": "fertigungsauftrag",
      "targetEntity": "fertigungsauftrag"
    }
  ]
};

/** The fields a record of this entity is recognised by (a person: first and
 *  last name; else its title-like text field) — the same choice the dashboard's
 *  enrichment makes for `<key>Name`. `useRecordSearch` resolves an applookup to
 *  this name (`ctx.ref('gast')` in `toItem`). */
export const DISPLAY_FIELDS: Record<EntityKey, string[]> = {
  "fertigungsauftrag": [
    "auftragsnummer"
  ],
  "arbeitsvorbereitung": [
    "station_bezeichnung"
  ],
  "stationsprotokoll": [
    "station_bezeichnung_detail"
  ],
  "problemerfassung": [
    "problem_beschreibung"
  ],
  "auftragsstatus": [
    "fehlende_ressourcen"
  ]
};

/** The display name of a record: its display fields joined, else the first
 *  non-empty text value, else ''. */
/** A display-field value as text: strings as they are, a lookup `{ key, label }`
 *  (either door hydrates lookups to objects) by its label — an entity whose
 *  only title-like field is a lookup/select otherwise had no name at all. */
function displayPart(v: unknown): string {
  if (typeof v === 'string') return v.trim();
  if (v && typeof v === 'object' && 'label' in v) {
    const l = (v as { label?: unknown }).label;
    return l === null || l === undefined ? '' : String(l).trim();
  }
  return '';
}

export function displayNameOf(entity: EntityKey, fields: Record<string, unknown>): string {
  const parts = (DISPLAY_FIELDS[entity] ?? [])
    .map(k => displayPart(fields[k]))
    .filter(v => v !== '');
  if (parts.length > 0) return parts.join(' ');
  for (const [k, rule] of Object.entries(FIELD_RULES[entity] ?? {})) {
    if (rule.kind !== 'text' && rule.kind !== 'email') continue;
    const v = fields[k];
    if (typeof v === 'string' && v.trim() !== '') return v.trim();
  }
  return '';
}

export function ruleOf(entity: EntityKey, key: string): FieldRule | undefined {
  return FIELD_RULES[entity]?.[key];
}

/** The field label as the user sees it — runtime bundle first, generated label second. */
export function labelOf(entity: EntityKey, key: string): string {
  const fromBundle = fieldLabel(entity, key);
  if (fromBundle !== key) return fromBundle;
  return ruleOf(entity, key)?.label ?? key;
}

export function entityLabel(entity: EntityKey): string {
  const fromBundle = appLabel(entity);
  if (fromBundle !== entity) return fromBundle;
  return ENTITIES[entity]?.label ?? entity;
}

/** Lookup options with runtime labels — the only legitimate source of `{key,label}` pairs. */
export function optionsOf(entity: EntityKey, key: string): Array<{ key: string; label: string }> {
  const generated = (LOOKUP_OPTIONS as Record<string, Record<string, Array<{ key: string; label: string }>>>)[entity]?.[key];
  if (generated && generated.length) return generated.map(o => ({ key: o.key, label: o.label }));
  const keys = ruleOf(entity, key)?.options ?? [];
  return keys.map(k => ({ key: k, label: lookupLabel(entity, key, k) ?? k }));
}

export function isEmptyValue(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object' && 'from' in (v as object) && 'to' in (v as object)) {
    const r = v as { from: unknown; to: unknown };
    return isEmptyValue(r.from) && isEmptyValue(r.to);
  }
  return false;
}

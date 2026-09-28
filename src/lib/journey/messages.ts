/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - fertigungsauftrag: auftragsnummer (Auftragsnummer), auftragsdatum (Auftragsdatum), prioritaet (Priorität), kunde_vorname (Vorname Kunde), kunde_nachname (Nachname Kunde), fahrzeugtyp (Fahrzeugtyp), fahrzeugmodell (Fahrzeugmodell / Bezeichnung), basisfahrzeug (Basisfahrzeug), geplanter_start (Geplanter Fertigungsstart), geplanter_abschluss (Geplanter Fertigstellungstermin), projektleiter_nachname (Nachname Projektleiter), auftragsstatus_gesamt (Auftragsstatus), projektleiter_vorname (Vorname Projektleiter)
 *   - arbeitsvorbereitung: status_planung (Status), fertigungsauftrag (Fertigungsauftrag), station_nummer (Stationsnummer), arbeitsschritt_bezeichnung (Bezeichnung des Arbeitsschritts)
 *   - stationsprotokoll: bearbeitungsstatus (Bearbeitungsstatus), fertigungsauftrag (Fertigungsauftrag), station_nummer (Stationsnummer), beginn_datum_zeit (Beginn (Datum und Uhrzeit)), mitarbeiter_nachname (Nachname Mitarbeiter (verantwortlich)), mitarbeiter_vorname (Vorname Mitarbeiter (verantwortlich))
 *   - problemerfassung: fertigungsauftrag (Fertigungsauftrag), betroffene_station (Betroffene Station), problemtyp (Problemtyp), problem_datum_zeit (Zeitpunkt des Problems), problem_beschreibung (Problembeschreibung), gemeldet_vorname (Vorname Melder), gemeldet_nachname (Nachname Melder), problem_status (Problemstatus)
 *   - auftragsstatus: gesamtstatus (Gesamtstatus Auftrag), aktuelle_station (Aktuelle Station), fertigungsauftrag (Fertigungsauftrag), letzte_aktualisierung (Letzte Aktualisierung), aktualisiert_vorname (Vorname Bearbeiter), aktualisiert_nachname (Nachname Bearbeiter)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "fertigungsauftrag": "auftragsnummer" | "auftragsdatum" | "prioritaet" | "kunde_vorname" | "kunde_nachname" | "kunde_telefon" | "kunde_email" | "fahrzeugtyp" | "fahrzeugmodell" | "basisfahrzeug" | "fahrzeug_laenge" | "fahrzeug_gewicht" | "geplanter_start" | "geplanter_abschluss" | "projektleiter_nachname" | "auftragsstatus_gesamt" | "soll_stunden_gesamt" | "sonderausstattung" | "bemerkungen" | "projektleiter_vorname";
  "arbeitsvorbereitung": "status_planung" | "benoetigte_mitarbeiter" | "benoetigte_materialien" | "soll_stunden" | "anmerkungen_planung" | "fertigungsauftrag" | "station_nummer" | "station_bezeichnung" | "arbeitsschritt_bezeichnung" | "arbeitsschritt_beschreibung" | "reihenfolge";
  "stationsprotokoll": "fertigstellungsgrad" | "erledigte_arbeiten" | "verwendete_materialien" | "bearbeitungsstatus" | "fertigungsauftrag" | "station_nummer" | "station_bezeichnung_detail" | "beginn_datum_zeit" | "ende_datum_zeit" | "ist_stunden" | "mitarbeiter_nachname" | "weitere_mitarbeiter" | "mitarbeiter_vorname" | "freigabe_vorname" | "freigabe_nachname" | "anmerkungen_station";
  "problemerfassung": "fertigungsauftrag" | "betroffene_station" | "problemtyp" | "problem_datum_zeit" | "problem_beschreibung" | "ursache" | "auswirkung_termin" | "fehlende_artikel" | "gemeldet_vorname" | "gemeldet_nachname" | "verantwortlich_vorname" | "verantwortlich_nachname" | "loesungsmassnahme" | "problem_status" | "behoben_datum";
  "auftragsstatus": "gesamtstatus" | "aktuelle_station" | "fertigstellungsgrad_gesamt" | "fertigungsauftrag" | "soll_stunden_status" | "ist_stunden_status" | "verbleibende_stunden" | "offene_aufgaben" | "offene_probleme" | "fehlende_ressourcen" | "voraussichtlicher_abschluss" | "letzte_aktualisierung" | "aktualisiert_vorname" | "aktualisiert_nachname" | "statuskommentar" | "eskalation_erforderlich";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  fertigungsauftrag: { auftragsnummer: "Bitte eine Auftragsnummer eingeben.", auftragsdatum: "Bitte das Auftragsdatum wählen.", prioritaet: "Bitte die Priorität festlegen.", kunde_vorname: "Bitte den Vornamen des Kunden eingeben.", kunde_nachname: "Bitte den Nachnamen des Kunden eingeben.", fahrzeugtyp: "Bitte den Fahrzeugtyp auswählen.", fahrzeugmodell: "Bitte die Fahrzeugbezeichnung eingeben.", basisfahrzeug: "Bitte das Basisfahrzeug eingeben.", geplanter_start: "Bitte den geplanten Fertigungsstart wählen.", geplanter_abschluss: "Bitte den geplanten Fertigstellungstermin wählen.", projektleiter_nachname: "Bitte den Nachnamen des Projektleiters eingeben.", projektleiter_vorname: "Bitte den Vornamen des Projektleiters eingeben.", auftragsstatus_gesamt: "Bitte den Auftragsstatus wählen." },
  arbeitsvorbereitung: { status_planung: "Bitte den Planungsstatus wählen.", fertigungsauftrag: "Bitte einen Fertigungsauftrag auswählen.", station_nummer: "Bitte die Station wählen.", arbeitsschritt_bezeichnung: "Bitte den Arbeitsschritt benennen." },
  stationsprotokoll: { bearbeitungsstatus: "Bitte den Bearbeitungsstatus wählen.", fertigungsauftrag: "Bitte einen Fertigungsauftrag auswählen.", station_nummer: "Bitte die Station wählen.", beginn_datum_zeit: "Bitte Beginn-Datum und Uhrzeit eingeben.", mitarbeiter_nachname: "Bitte den Nachnamen des verantwortlichen Mitarbeiters eingeben.", mitarbeiter_vorname: "Bitte den Vornamen des verantwortlichen Mitarbeiters eingeben." },
  problemerfassung: { fertigungsauftrag: "Bitte einen Fertigungsauftrag auswählen.", betroffene_station: "Bitte die betroffene Station angeben.", problemtyp: "Bitte die Art des Problems wählen.", problem_datum_zeit: "Bitte Datum und Uhrzeit des Problems eingeben.", problem_beschreibung: "Bitte das Problem beschreiben.", gemeldet_vorname: "Bitte den Vornamen des Melders eingeben.", gemeldet_nachname: "Bitte den Nachnamen des Melders eingeben.", problem_status: "Bitte den aktuellen Problemstatus wählen." },
  auftragsstatus: { gesamtstatus: "Bitte den Gesamtstatus wählen.", aktuelle_station: "Bitte die aktuelle Station angeben.", fertigungsauftrag: "Bitte einen Fertigungsauftrag auswählen.", letzte_aktualisierung: "Bitte Datum und Uhrzeit der Aktualisierung eingeben.", aktualisiert_vorname: "Bitte den Vornamen des Bearbeiters eingeben.", aktualisiert_nachname: "Bitte den Nachnamen des Bearbeiters eingeben." },
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}

/**
 * Occupancy semantics — DECIDED BY THE BUILD AGENT, never by a heuristic.
 *
 * The Phase-2 orchestrator writes its decision to `.intents-staging/occupancy.json`
 * (stay pair, booked resource, statuses that do not occupy); the integration
 * step validates it against the app metadata and renders it into the block
 * below. Scaffold updates keep the block. Do not edit outside the markers.
 *
 * Both doors read this and nothing else: `occupancyFor` (internal flows AND
 * public pages) and the owner service (the public grant's occupancy read).
 * No rule for an entity = no availability calendar, no occupancy claim —
 * a plain date field pair is shown instead.
 *
 * Facts from the metadata — candidates, NOT decisions:
 *   - fertigungsauftrag: lookups prioritaet[normal|hoch|dringend], fahrzeugtyp[alkoven|teilintegriert|vollintegriert|kastenwagen|pickup_aufbau], auftragsstatus_gesamt[neu|in_planung|in_fertigung|qualitaetspruefung|abgeschlossen|storniert]
 *   - arbeitsvorbereitung: applookups fertigungsauftrag→fertigungsauftrag · lookups status_planung[erledigt|blockiert|offen|in_bearbeitung], station_nummer[station_1|station_2|station_3|station_4|station_5]
 *   - stationsprotokoll: applookups fertigungsauftrag→fertigungsauftrag · lookups bearbeitungsstatus[nicht_begonnen|in_bearbeitung|unterbrochen|abgeschlossen|freigegeben], station_nummer[station_1|station_2|station_3|station_4|station_5]
 *   - problemerfassung: applookups fertigungsauftrag→fertigungsauftrag · lookups betroffene_station[station_1|station_2|station_3|station_4|station_5|stationsuebergreifend], problemtyp[verzoegerung|fehlender_artikel|qualitaetsproblem|personalausfall|technischer_defekt|sonstiges], auswirkung_termin[keine_auswirkung|gering|mittel|stark], problem_status[offen|in_klaerung|massnahme_eingeleitet|behoben|eskaliert]
 *   - auftragsstatus: applookups fertigungsauftrag→fertigungsauftrag · lookups gesamtstatus[planmaessig|leichte_verzoegerung|starke_verzoegerung|kritisch|abgeschlossen], aktuelle_station[station_2|station_3|station_4|station_5|abgeschlossen|station_1]
 */
import type { EntityKey } from '@/lib/journey/rules';

export interface OccupancyRule {
  /** Arrival / departure fields (the departure day is exclusive). */
  from: string;
  to: string;
  /** applookup field naming the booked RESOURCE (room, vehicle, court).
   *  Omit when the entity itself is the one resource (a single holiday flat). */
  resource?: string;
  /** lookup field + the keys that mean "does NOT occupy" (cancelled, no-show). */
  statusField?: string;
  freeKeys?: string[];
}

export const OCCUPANCY: Partial<Record<EntityKey, OccupancyRule>> = {
  // <custom:occupancy>
  // </custom:occupancy>
};

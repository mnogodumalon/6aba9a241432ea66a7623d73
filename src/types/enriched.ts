import type { Arbeitsvorbereitung, Auftragsstatus, Problemerfassung, Stationsprotokoll } from './app';

export type EnrichedArbeitsvorbereitung = Arbeitsvorbereitung & {
  fertigungsauftragName: string;
};

export type EnrichedStationsprotokoll = Stationsprotokoll & {
  fertigungsauftragName: string;
};

export type EnrichedProblemerfassung = Problemerfassung & {
  fertigungsauftragName: string;
};

export type EnrichedAuftragsstatus = Auftragsstatus & {
  fertigungsauftragName: string;
};

import type { Stationsprotokoll, Fertigungsauftrag } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';

export interface StationsprotokollDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Stationsprotokoll;
  /** N:1-Ziel „Fertigungsauftrag": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  fertigungsauftragList: Fertigungsauftrag[];
  /** Klick auf die Fertigungsauftrag-Relation → overlay.push auf dessen Detail. */
  onOpenFertigungsauftrag?: (record: Fertigungsauftrag) => void;
}

export function StationsprotokollDetails({
  record,
  fertigungsauftragList,
  onOpenFertigungsauftrag,
}: StationsprotokollDetailsProps) {
  const fertigungsauftragTarget = fertigungsauftragList.find(r => r.record_id === extractRecordId(record.fields.fertigungsauftrag));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('stationsprotokoll', 'fertigstellungsgrad')} value={record.fields.fertigstellungsgrad} format="text" />
        <RecordField label={fieldLabel('stationsprotokoll', 'erledigte_arbeiten')} value={record.fields.erledigte_arbeiten} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('stationsprotokoll', 'verwendete_materialien')} value={record.fields.verwendete_materialien} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('stationsprotokoll', 'bearbeitungsstatus')} value={record.fields.bearbeitungsstatus} format="pill" />
        <RecordField label={fieldLabel('stationsprotokoll', 'station_nummer')} value={record.fields.station_nummer} format="pill" />
        <RecordField label={fieldLabel('stationsprotokoll', 'station_bezeichnung_detail')} value={record.fields.station_bezeichnung_detail} format="text" />
        <RecordField label={fieldLabel('stationsprotokoll', 'beginn_datum_zeit')} value={record.fields.beginn_datum_zeit} format="datetime" />
        <RecordField label={fieldLabel('stationsprotokoll', 'ende_datum_zeit')} value={record.fields.ende_datum_zeit} format="datetime" />
        <RecordField label={fieldLabel('stationsprotokoll', 'ist_stunden')} value={record.fields.ist_stunden} format="text" />
        <RecordField label={fieldLabel('stationsprotokoll', 'mitarbeiter_nachname')} value={record.fields.mitarbeiter_nachname} format="text" />
        <RecordField label={fieldLabel('stationsprotokoll', 'weitere_mitarbeiter')} value={record.fields.weitere_mitarbeiter} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('stationsprotokoll', 'mitarbeiter_vorname')} value={record.fields.mitarbeiter_vorname} format="text" />
        <RecordField label={fieldLabel('stationsprotokoll', 'freigabe_vorname')} value={record.fields.freigabe_vorname} format="text" />
        <RecordField label={fieldLabel('stationsprotokoll', 'freigabe_nachname')} value={record.fields.freigabe_nachname} format="text" />
        <RecordField label={fieldLabel('stationsprotokoll', 'fotos')} className="md:col-span-2">
          {record.fields.fotos ? (
            <MediaThumbnail src={record.fields.fotos as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('stationsprotokoll', 'anmerkungen_station')} value={record.fields.anmerkungen_station} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('stationsprotokoll', 'fertigungsauftrag')}
          name={fertigungsauftragTarget?.fields.auftragsnummer ?? '—'}
          meta={[fertigungsauftragTarget?.fields.kunde_telefon, fertigungsauftragTarget?.fields.kunde_email].filter(Boolean).join(' · ') || undefined}
          onClick={fertigungsauftragTarget && onOpenFertigungsauftrag ? () => onOpenFertigungsauftrag!(fertigungsauftragTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.STATIONSPROTOKOLL} recordId={record.record_id} />
    </>
  );
}

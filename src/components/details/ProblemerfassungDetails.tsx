import type { Problemerfassung, Fertigungsauftrag } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';

export interface ProblemerfassungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Problemerfassung;
  /** N:1-Ziel „Fertigungsauftrag": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  fertigungsauftragList: Fertigungsauftrag[];
  /** Klick auf die Fertigungsauftrag-Relation → overlay.push auf dessen Detail. */
  onOpenFertigungsauftrag?: (record: Fertigungsauftrag) => void;
}

export function ProblemerfassungDetails({
  record,
  fertigungsauftragList,
  onOpenFertigungsauftrag,
}: ProblemerfassungDetailsProps) {
  const fertigungsauftragTarget = fertigungsauftragList.find(r => r.record_id === extractRecordId(record.fields.fertigungsauftrag));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('problemerfassung', 'betroffene_station')} value={record.fields.betroffene_station} format="pill" />
        <RecordField label={fieldLabel('problemerfassung', 'problemtyp')} value={record.fields.problemtyp} format="pill" />
        <RecordField label={fieldLabel('problemerfassung', 'problem_datum_zeit')} value={record.fields.problem_datum_zeit} format="datetime" />
        <RecordField label={fieldLabel('problemerfassung', 'problem_beschreibung')} value={record.fields.problem_beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('problemerfassung', 'ursache')} value={record.fields.ursache} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('problemerfassung', 'auswirkung_termin')} value={record.fields.auswirkung_termin} format="pill" />
        <RecordField label={fieldLabel('problemerfassung', 'fehlende_artikel')} value={record.fields.fehlende_artikel} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('problemerfassung', 'gemeldet_vorname')} value={record.fields.gemeldet_vorname} format="text" />
        <RecordField label={fieldLabel('problemerfassung', 'gemeldet_nachname')} value={record.fields.gemeldet_nachname} format="text" />
        <RecordField label={fieldLabel('problemerfassung', 'verantwortlich_vorname')} value={record.fields.verantwortlich_vorname} format="text" />
        <RecordField label={fieldLabel('problemerfassung', 'verantwortlich_nachname')} value={record.fields.verantwortlich_nachname} format="text" />
        <RecordField label={fieldLabel('problemerfassung', 'loesungsmassnahme')} value={record.fields.loesungsmassnahme} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('problemerfassung', 'problem_status')} value={record.fields.problem_status} format="pill" />
        <RecordField label={fieldLabel('problemerfassung', 'behoben_datum')} value={record.fields.behoben_datum} format="date" />
        <RecordField label={fieldLabel('problemerfassung', 'problem_foto')} className="md:col-span-2">
          {record.fields.problem_foto ? (
            <MediaThumbnail src={record.fields.problem_foto as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('problemerfassung', 'fertigungsauftrag')}
          name={fertigungsauftragTarget?.fields.auftragsnummer ?? '—'}
          meta={[fertigungsauftragTarget?.fields.kunde_telefon, fertigungsauftragTarget?.fields.kunde_email].filter(Boolean).join(' · ') || undefined}
          onClick={fertigungsauftragTarget && onOpenFertigungsauftrag ? () => onOpenFertigungsauftrag!(fertigungsauftragTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.PROBLEMERFASSUNG} recordId={record.record_id} />
    </>
  );
}

import type { Arbeitsvorbereitung, Fertigungsauftrag } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface ArbeitsvorbereitungDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Arbeitsvorbereitung;
  /** N:1-Ziel „Fertigungsauftrag": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  fertigungsauftragList: Fertigungsauftrag[];
  /** Klick auf die Fertigungsauftrag-Relation → overlay.push auf dessen Detail. */
  onOpenFertigungsauftrag?: (record: Fertigungsauftrag) => void;
}

export function ArbeitsvorbereitungDetails({
  record,
  fertigungsauftragList,
  onOpenFertigungsauftrag,
}: ArbeitsvorbereitungDetailsProps) {
  const fertigungsauftragTarget = fertigungsauftragList.find(r => r.record_id === extractRecordId(record.fields.fertigungsauftrag));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'status_planung')} value={record.fields.status_planung} format="pill" />
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'benoetigte_mitarbeiter')} value={record.fields.benoetigte_mitarbeiter} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'benoetigte_materialien')} value={record.fields.benoetigte_materialien} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'soll_stunden')} value={record.fields.soll_stunden} format="text" />
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'anmerkungen_planung')} value={record.fields.anmerkungen_planung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'station_nummer')} value={record.fields.station_nummer} format="pill" />
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'station_bezeichnung')} value={record.fields.station_bezeichnung} format="text" />
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'arbeitsschritt_bezeichnung')} value={record.fields.arbeitsschritt_bezeichnung} format="text" />
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'arbeitsschritt_beschreibung')} value={record.fields.arbeitsschritt_beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('arbeitsvorbereitung', 'reihenfolge')} value={record.fields.reihenfolge} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('arbeitsvorbereitung', 'fertigungsauftrag')}
          name={fertigungsauftragTarget?.fields.auftragsnummer ?? '—'}
          meta={[fertigungsauftragTarget?.fields.kunde_telefon, fertigungsauftragTarget?.fields.kunde_email].filter(Boolean).join(' · ') || undefined}
          onClick={fertigungsauftragTarget && onOpenFertigungsauftrag ? () => onOpenFertigungsauftrag!(fertigungsauftragTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ARBEITSVORBEREITUNG} recordId={record.record_id} />
    </>
  );
}

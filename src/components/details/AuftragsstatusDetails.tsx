import type { Auftragsstatus, Fertigungsauftrag } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface AuftragsstatusDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Auftragsstatus;
  /** N:1-Ziel „Fertigungsauftrag": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  fertigungsauftragList: Fertigungsauftrag[];
  /** Klick auf die Fertigungsauftrag-Relation → overlay.push auf dessen Detail. */
  onOpenFertigungsauftrag?: (record: Fertigungsauftrag) => void;
}

export function AuftragsstatusDetails({
  record,
  fertigungsauftragList,
  onOpenFertigungsauftrag,
}: AuftragsstatusDetailsProps) {
  const fertigungsauftragTarget = fertigungsauftragList.find(r => r.record_id === extractRecordId(record.fields.fertigungsauftrag));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('auftragsstatus', 'gesamtstatus')} value={record.fields.gesamtstatus} format="pill" />
        <RecordField label={fieldLabel('auftragsstatus', 'aktuelle_station')} value={record.fields.aktuelle_station} format="pill" />
        <RecordField label={fieldLabel('auftragsstatus', 'fertigstellungsgrad_gesamt')} value={record.fields.fertigstellungsgrad_gesamt} format="text" />
        <RecordField label={fieldLabel('auftragsstatus', 'soll_stunden_status')} value={record.fields.soll_stunden_status} format="text" />
        <RecordField label={fieldLabel('auftragsstatus', 'ist_stunden_status')} value={record.fields.ist_stunden_status} format="text" />
        <RecordField label={fieldLabel('auftragsstatus', 'verbleibende_stunden')} value={record.fields.verbleibende_stunden} format="text" />
        <RecordField label={fieldLabel('auftragsstatus', 'offene_aufgaben')} value={record.fields.offene_aufgaben} format="text" />
        <RecordField label={fieldLabel('auftragsstatus', 'offene_probleme')} value={record.fields.offene_probleme} format="text" />
        <RecordField label={fieldLabel('auftragsstatus', 'fehlende_ressourcen')} value={record.fields.fehlende_ressourcen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auftragsstatus', 'voraussichtlicher_abschluss')} value={record.fields.voraussichtlicher_abschluss} format="date" />
        <RecordField label={fieldLabel('auftragsstatus', 'letzte_aktualisierung')} value={record.fields.letzte_aktualisierung} format="datetime" />
        <RecordField label={fieldLabel('auftragsstatus', 'aktualisiert_vorname')} value={record.fields.aktualisiert_vorname} format="text" />
        <RecordField label={fieldLabel('auftragsstatus', 'aktualisiert_nachname')} value={record.fields.aktualisiert_nachname} format="text" />
        <RecordField label={fieldLabel('auftragsstatus', 'statuskommentar')} value={record.fields.statuskommentar} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('auftragsstatus', 'eskalation_erforderlich')} value={record.fields.eskalation_erforderlich} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('auftragsstatus', 'fertigungsauftrag')}
          name={fertigungsauftragTarget?.fields.auftragsnummer ?? '—'}
          meta={[fertigungsauftragTarget?.fields.kunde_telefon, fertigungsauftragTarget?.fields.kunde_email].filter(Boolean).join(' · ') || undefined}
          onClick={fertigungsauftragTarget && onOpenFertigungsauftrag ? () => onOpenFertigungsauftrag!(fertigungsauftragTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.AUFTRAGSSTATUS} recordId={record.record_id} />
    </>
  );
}

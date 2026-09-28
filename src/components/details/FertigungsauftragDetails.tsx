import type { Fertigungsauftrag, Arbeitsvorbereitung, Stationsprotokoll, Problemerfassung, Auftragsstatus } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface FertigungsauftragDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Fertigungsauftrag;
  /** 1:N „Arbeitsvorbereitung" (fertigungsauftrag): VOLLE Liste — der Block filtert auf diesen Record. */
  arbeitsvorbereitungList: Arbeitsvorbereitung[];
  /** Zeilen-Klick → overlay.push auf das Arbeitsvorbereitung-Detail (nie der Edit-Dialog). */
  onOpenArbeitsvorbereitung: (record: Arbeitsvorbereitung) => void;
  /** Kontextuelles „+": öffnet den Arbeitsvorbereitung-Dialog mit diesem Record vorgesetzt. */
  onAddArbeitsvorbereitung: () => void;
  /** 1:N „Stationsprotokoll" (fertigungsauftrag): VOLLE Liste — der Block filtert auf diesen Record. */
  stationsprotokollList: Stationsprotokoll[];
  /** Zeilen-Klick → overlay.push auf das Stationsprotokoll-Detail (nie der Edit-Dialog). */
  onOpenStationsprotokoll: (record: Stationsprotokoll) => void;
  /** Kontextuelles „+": öffnet den Stationsprotokoll-Dialog mit diesem Record vorgesetzt. */
  onAddStationsprotokoll: () => void;
  /** 1:N „Problemerfassung" (fertigungsauftrag): VOLLE Liste — der Block filtert auf diesen Record. */
  problemerfassungList: Problemerfassung[];
  /** Zeilen-Klick → overlay.push auf das Problemerfassung-Detail (nie der Edit-Dialog). */
  onOpenProblemerfassung: (record: Problemerfassung) => void;
  /** Kontextuelles „+": öffnet den Problemerfassung-Dialog mit diesem Record vorgesetzt. */
  onAddProblemerfassung: () => void;
  /** 1:N „Auftragsstatus" (fertigungsauftrag): VOLLE Liste — der Block filtert auf diesen Record. */
  auftragsstatusList: Auftragsstatus[];
  /** Zeilen-Klick → overlay.push auf das Auftragsstatus-Detail (nie der Edit-Dialog). */
  onOpenAuftragsstatus: (record: Auftragsstatus) => void;
  /** Kontextuelles „+": öffnet den Auftragsstatus-Dialog mit diesem Record vorgesetzt. */
  onAddAuftragsstatus: () => void;
}

export function FertigungsauftragDetails({
  record,
  arbeitsvorbereitungList,
  onOpenArbeitsvorbereitung,
  onAddArbeitsvorbereitung,
  stationsprotokollList,
  onOpenStationsprotokoll,
  onAddStationsprotokoll,
  problemerfassungList,
  onOpenProblemerfassung,
  onAddProblemerfassung,
  auftragsstatusList,
  onOpenAuftragsstatus,
  onAddAuftragsstatus,
}: FertigungsauftragDetailsProps) {
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('fertigungsauftrag', 'auftragsnummer')} value={record.fields.auftragsnummer} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'auftragsdatum')} value={record.fields.auftragsdatum} format="date" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'prioritaet')} value={record.fields.prioritaet} format="pill" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'kunde_vorname')} value={record.fields.kunde_vorname} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'kunde_nachname')} value={record.fields.kunde_nachname} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'kunde_telefon')} value={record.fields.kunde_telefon} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'kunde_email')} value={record.fields.kunde_email} format="email" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'fahrzeugtyp')} value={record.fields.fahrzeugtyp} format="pill" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'fahrzeugmodell')} value={record.fields.fahrzeugmodell} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'basisfahrzeug')} value={record.fields.basisfahrzeug} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'fahrzeug_laenge')} value={record.fields.fahrzeug_laenge} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'fahrzeug_gewicht')} value={record.fields.fahrzeug_gewicht} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'geplanter_start')} value={record.fields.geplanter_start} format="date" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'geplanter_abschluss')} value={record.fields.geplanter_abschluss} format="date" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'projektleiter_nachname')} value={record.fields.projektleiter_nachname} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'auftragsstatus_gesamt')} value={record.fields.auftragsstatus_gesamt} format="pill" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'soll_stunden_gesamt')} value={record.fields.soll_stunden_gesamt} format="text" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'sonderausstattung')} value={record.fields.sonderausstattung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'bemerkungen')} value={record.fields.bemerkungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('fertigungsauftrag', 'projektleiter_vorname')} value={record.fields.projektleiter_vorname} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('arbeitsvorbereitung')}
        items={arbeitsvorbereitungList.filter(r => extractRecordId(r.fields.fertigungsauftrag) === record.record_id)}
        map={r => ({ name: r.fields.station_bezeichnung ?? appLabel('arbeitsvorbereitung'), meta: undefined })}
        onOpen={onOpenArbeitsvorbereitung}
        onAdd={onAddArbeitsvorbereitung}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('stationsprotokoll')}
        items={stationsprotokollList.filter(r => extractRecordId(r.fields.fertigungsauftrag) === record.record_id)}
        map={r => ({ name: r.fields.station_bezeichnung_detail ?? appLabel('stationsprotokoll'), meta: r.fields.beginn_datum_zeit })}
        onOpen={onOpenStationsprotokoll}
        onAdd={onAddStationsprotokoll}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('problemerfassung')}
        items={problemerfassungList.filter(r => extractRecordId(r.fields.fertigungsauftrag) === record.record_id)}
        map={r => ({ name: r.fields.gemeldet_vorname ?? appLabel('problemerfassung'), meta: r.fields.problem_datum_zeit })}
        onOpen={onOpenProblemerfassung}
        onAdd={onAddProblemerfassung}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('auftragsstatus')}
        items={auftragsstatusList.filter(r => extractRecordId(r.fields.fertigungsauftrag) === record.record_id)}
        map={r => ({ name: r.fields.aktualisiert_vorname ?? appLabel('auftragsstatus'), meta: r.fields.voraussichtlicher_abschluss })}
        onOpen={onOpenAuftragsstatus}
        onAdd={onAddAuftragsstatus}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.FERTIGUNGSAUFTRAG} recordId={record.record_id} />
    </>
  );
}

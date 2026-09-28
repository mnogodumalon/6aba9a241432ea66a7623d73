/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'fertigungsauftrag'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.fertigungsauftrag.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.fertigungsauftrag.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.fertigungsauftrag.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.fertigungsauftrag              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   fertigungsauftrag: auftragsnummer, auftragsdatum, prioritaet, kunde_vorname, kunde_nachname, kunde_telefon, kunde_email, fahrzeugtyp, …  ·  ← arbeitsvorbereitung (list + contextual +) · ← stationsprotokoll (list + contextual +) · ← problemerfassung (list + contextual +) · ← auftragsstatus (list + contextual +)
 *   arbeitsvorbereitung: status_planung, benoetigte_mitarbeiter, benoetigte_materialien, soll_stunden, anmerkungen_planung, fertigungsauftrag, station_nummer, station_bezeichnung, …  ·  → fertigungsauftrag
 *   stationsprotokoll: fertigstellungsgrad, erledigte_arbeiten, verwendete_materialien, bearbeitungsstatus, fertigungsauftrag, station_nummer, station_bezeichnung_detail, beginn_datum_zeit, …  ·  → fertigungsauftrag
 *   problemerfassung: fertigungsauftrag, betroffene_station, problemtyp, problem_datum_zeit, problem_beschreibung, ursache, auswirkung_termin, fehlende_artikel, …  ·  → fertigungsauftrag
 *   auftragsstatus: gesamtstatus, aktuelle_station, fertigstellungsgrad_gesamt, fertigungsauftrag, soll_stunden_status, ist_stunden_status, verbleibende_stunden, offene_aufgaben, …  ·  → fertigungsauftrag
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Fertigungsauftrag, Arbeitsvorbereitung, Stationsprotokoll, Problemerfassung, Auftragsstatus } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl } from '@/services/livingAppsService';
import { enrichArbeitsvorbereitung, enrichStationsprotokoll, enrichProblemerfassung, enrichAuftragsstatus } from '@/lib/enrich';
import type { EnrichedArbeitsvorbereitung, EnrichedStationsprotokoll, EnrichedProblemerfassung, EnrichedAuftragsstatus } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { FertigungsauftragDialog, type FertigungsauftragDialogDefaults } from '@/components/dialogs/FertigungsauftragDialog';
import { FertigungsauftragDetails } from '@/components/details/FertigungsauftragDetails';
import { ArbeitsvorbereitungDialog, type ArbeitsvorbereitungDialogDefaults } from '@/components/dialogs/ArbeitsvorbereitungDialog';
import { ArbeitsvorbereitungDetails } from '@/components/details/ArbeitsvorbereitungDetails';
import { StationsprotokollDialog, type StationsprotokollDialogDefaults } from '@/components/dialogs/StationsprotokollDialog';
import { StationsprotokollDetails } from '@/components/details/StationsprotokollDetails';
import { ProblemerfassungDialog, type ProblemerfassungDialogDefaults } from '@/components/dialogs/ProblemerfassungDialog';
import { ProblemerfassungDetails } from '@/components/details/ProblemerfassungDetails';
import { AuftragsstatusDialog, type AuftragsstatusDialogDefaults } from '@/components/dialogs/AuftragsstatusDialog';
import { AuftragsstatusDetails } from '@/components/details/AuftragsstatusDetails';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'fertigungsauftrag'; record: Fertigungsauftrag }
  | { type: 'arbeitsvorbereitung'; record: EnrichedArbeitsvorbereitung }
  | { type: 'stationsprotokoll'; record: EnrichedStationsprotokoll }
  | { type: 'problemerfassung'; record: EnrichedProblemerfassung }
  | { type: 'auftragsstatus'; record: EnrichedAuftragsstatus };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  fertigungsauftrag: EntityCrudApi<Fertigungsauftrag, FertigungsauftragDialogDefaults>;
  arbeitsvorbereitung: EntityCrudApi<Arbeitsvorbereitung, ArbeitsvorbereitungDialogDefaults>;
  stationsprotokoll: EntityCrudApi<Stationsprotokoll, StationsprotokollDialogDefaults>;
  problemerfassung: EntityCrudApi<Problemerfassung, ProblemerfassungDialogDefaults>;
  auftragsstatus: EntityCrudApi<Auftragsstatus, AuftragsstatusDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { fertigungsauftrag: Fertigungsauftrag[]; arbeitsvorbereitung: EnrichedArbeitsvorbereitung[]; stationsprotokoll: EnrichedStationsprotokoll[]; problemerfassung: EnrichedProblemerfassung[]; auftragsstatus: EnrichedAuftragsstatus[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  const [fertigungsauftragDialog, setFertigungsauftragDialog] = useState<{ defaults?: FertigungsauftragDialogDefaults; editing?: Fertigungsauftrag } | null>(null);
  const [arbeitsvorbereitungDialog, setArbeitsvorbereitungDialog] = useState<{ defaults?: ArbeitsvorbereitungDialogDefaults; editing?: Arbeitsvorbereitung } | null>(null);
  const [stationsprotokollDialog, setStationsprotokollDialog] = useState<{ defaults?: StationsprotokollDialogDefaults; editing?: Stationsprotokoll } | null>(null);
  const [problemerfassungDialog, setProblemerfassungDialog] = useState<{ defaults?: ProblemerfassungDialogDefaults; editing?: Problemerfassung } | null>(null);
  const [auftragsstatusDialog, setAuftragsstatusDialog] = useState<{ defaults?: AuftragsstatusDialogDefaults; editing?: Auftragsstatus } | null>(null);
  const enrichedArbeitsvorbereitung = useMemo(() => enrichArbeitsvorbereitung(data.arbeitsvorbereitung, { fertigungsauftragMap: data.fertigungsauftragMap }), [data.arbeitsvorbereitung, data.fertigungsauftragMap]);
  const enrichedStationsprotokoll = useMemo(() => enrichStationsprotokoll(data.stationsprotokoll, { fertigungsauftragMap: data.fertigungsauftragMap }), [data.stationsprotokoll, data.fertigungsauftragMap]);
  const enrichedProblemerfassung = useMemo(() => enrichProblemerfassung(data.problemerfassung, { fertigungsauftragMap: data.fertigungsauftragMap }), [data.problemerfassung, data.fertigungsauftragMap]);
  const enrichedAuftragsstatus = useMemo(() => enrichAuftragsstatus(data.auftragsstatus, { fertigungsauftragMap: data.fertigungsauftragMap }), [data.auftragsstatus, data.fertigungsauftragMap]);

  function detailFertigungsauftrag(record: Fertigungsauftrag, push = false) {
    const item: OverlayItem = { type: 'fertigungsauftrag', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitFertigungsauftrag(fields: Fertigungsauftrag['fields']) {
    const editing = fertigungsauftragDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setFertigungsauftrag(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateFertigungsauftragEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('fertigungsauftrag')} — ${t('crud_updated')}`, async () => {
        data.setFertigungsauftrag(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateFertigungsauftragEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createFertigungsauftragEntry(fields);
      undoToast(`${appLabel('fertigungsauftrag')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailArbeitsvorbereitung(record: Arbeitsvorbereitung, push = false) {
    const rec = enrichedArbeitsvorbereitung.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'arbeitsvorbereitung', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitArbeitsvorbereitung(fields: Arbeitsvorbereitung['fields']) {
    const editing = arbeitsvorbereitungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setArbeitsvorbereitung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateArbeitsvorbereitungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('arbeitsvorbereitung')} — ${t('crud_updated')}`, async () => {
        data.setArbeitsvorbereitung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateArbeitsvorbereitungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createArbeitsvorbereitungEntry(fields);
      undoToast(`${appLabel('arbeitsvorbereitung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailStationsprotokoll(record: Stationsprotokoll, push = false) {
    const rec = enrichedStationsprotokoll.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'stationsprotokoll', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitStationsprotokoll(fields: Stationsprotokoll['fields']) {
    const editing = stationsprotokollDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setStationsprotokoll(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateStationsprotokollEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('stationsprotokoll')} — ${t('crud_updated')}`, async () => {
        data.setStationsprotokoll(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateStationsprotokollEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createStationsprotokollEntry(fields);
      undoToast(`${appLabel('stationsprotokoll')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailProblemerfassung(record: Problemerfassung, push = false) {
    const rec = enrichedProblemerfassung.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'problemerfassung', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitProblemerfassung(fields: Problemerfassung['fields']) {
    const editing = problemerfassungDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setProblemerfassung(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateProblemerfassungEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('problemerfassung')} — ${t('crud_updated')}`, async () => {
        data.setProblemerfassung(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateProblemerfassungEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createProblemerfassungEntry(fields);
      undoToast(`${appLabel('problemerfassung')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailAuftragsstatus(record: Auftragsstatus, push = false) {
    const rec = enrichedAuftragsstatus.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'auftragsstatus', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAuftragsstatus(fields: Auftragsstatus['fields']) {
    const editing = auftragsstatusDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAuftragsstatus(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAuftragsstatu(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('auftragsstatus')} — ${t('crud_updated')}`, async () => {
        data.setAuftragsstatus(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAuftragsstatu(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAuftragsstatu(fields);
      undoToast(`${appLabel('auftragsstatus')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <FertigungsauftragDialog
        open={fertigungsauftragDialog !== null}
        onClose={() => setFertigungsauftragDialog(null)}
        onSubmit={submitFertigungsauftrag}
        defaultValues={fertigungsauftragDialog?.defaults}
        recordId={fertigungsauftragDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Fertigungsauftrag']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Fertigungsauftrag']}
      />
      <ArbeitsvorbereitungDialog
        open={arbeitsvorbereitungDialog !== null}
        onClose={() => setArbeitsvorbereitungDialog(null)}
        onSubmit={submitArbeitsvorbereitung}
        defaultValues={arbeitsvorbereitungDialog?.defaults}
        recordId={arbeitsvorbereitungDialog?.editing?.record_id}
        fertigungsauftragList={data.fertigungsauftrag}
        enablePhotoScan={AI_PHOTO_SCAN['Arbeitsvorbereitung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Arbeitsvorbereitung']}
      />
      <StationsprotokollDialog
        open={stationsprotokollDialog !== null}
        onClose={() => setStationsprotokollDialog(null)}
        onSubmit={submitStationsprotokoll}
        defaultValues={stationsprotokollDialog?.defaults}
        recordId={stationsprotokollDialog?.editing?.record_id}
        fertigungsauftragList={data.fertigungsauftrag}
        enablePhotoScan={AI_PHOTO_SCAN['Stationsprotokoll']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Stationsprotokoll']}
      />
      <ProblemerfassungDialog
        open={problemerfassungDialog !== null}
        onClose={() => setProblemerfassungDialog(null)}
        onSubmit={submitProblemerfassung}
        defaultValues={problemerfassungDialog?.defaults}
        recordId={problemerfassungDialog?.editing?.record_id}
        fertigungsauftragList={data.fertigungsauftrag}
        enablePhotoScan={AI_PHOTO_SCAN['Problemerfassung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Problemerfassung']}
      />
      <AuftragsstatusDialog
        open={auftragsstatusDialog !== null}
        onClose={() => setAuftragsstatusDialog(null)}
        onSubmit={submitAuftragsstatus}
        defaultValues={auftragsstatusDialog?.defaults}
        recordId={auftragsstatusDialog?.editing?.record_id}
        fertigungsauftragList={data.fertigungsauftrag}
        enablePhotoScan={AI_PHOTO_SCAN['Auftragsstatus']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Auftragsstatus']}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'fertigungsauftrag') {
            return (
              <>
                <RecordHeader title={top.record.fields.auftragsnummer ?? appLabel('fertigungsauftrag')} subtitle={top.record.fields.auftragsdatum ? formatDate(top.record.fields.auftragsdatum) : undefined} />
                <FertigungsauftragDetails
                  record={top.record}
                  arbeitsvorbereitungList={data.arbeitsvorbereitung}
                  onOpenArbeitsvorbereitung={(r) => detailArbeitsvorbereitung(r, true)}
                  onAddArbeitsvorbereitung={() => setArbeitsvorbereitungDialog({ defaults: { fertigungsauftrag: createRecordUrl(APP_IDS.FERTIGUNGSAUFTRAG, top.record.record_id) } })}
                  stationsprotokollList={data.stationsprotokoll}
                  onOpenStationsprotokoll={(r) => detailStationsprotokoll(r, true)}
                  onAddStationsprotokoll={() => setStationsprotokollDialog({ defaults: { fertigungsauftrag: createRecordUrl(APP_IDS.FERTIGUNGSAUFTRAG, top.record.record_id) } })}
                  problemerfassungList={data.problemerfassung}
                  onOpenProblemerfassung={(r) => detailProblemerfassung(r, true)}
                  onAddProblemerfassung={() => setProblemerfassungDialog({ defaults: { fertigungsauftrag: createRecordUrl(APP_IDS.FERTIGUNGSAUFTRAG, top.record.record_id) } })}
                  auftragsstatusList={data.auftragsstatus}
                  onOpenAuftragsstatus={(r) => detailAuftragsstatus(r, true)}
                  onAddAuftragsstatus={() => setAuftragsstatusDialog({ defaults: { fertigungsauftrag: createRecordUrl(APP_IDS.FERTIGUNGSAUFTRAG, top.record.record_id) } })}
                />
              </>
            );
          }
          if (top.type === 'arbeitsvorbereitung') {
            return (
              <>
                <RecordHeader title={top.record.fields.station_bezeichnung ?? appLabel('arbeitsvorbereitung')} subtitle={undefined} />
                <ArbeitsvorbereitungDetails
                  record={top.record}
                  fertigungsauftragList={data.fertigungsauftrag}
                  onOpenFertigungsauftrag={(r) => detailFertigungsauftrag(r, true)}
                />
              </>
            );
          }
          if (top.type === 'stationsprotokoll') {
            return (
              <>
                <RecordHeader title={top.record.fields.station_bezeichnung_detail ?? appLabel('stationsprotokoll')} subtitle={top.record.fields.beginn_datum_zeit ? formatDate(top.record.fields.beginn_datum_zeit) : undefined} />
                <StationsprotokollDetails
                  record={top.record}
                  fertigungsauftragList={data.fertigungsauftrag}
                  onOpenFertigungsauftrag={(r) => detailFertigungsauftrag(r, true)}
                />
              </>
            );
          }
          if (top.type === 'problemerfassung') {
            return (
              <>
                <RecordHeader title={top.record.fields.gemeldet_vorname ?? appLabel('problemerfassung')} subtitle={top.record.fields.problem_datum_zeit ? formatDate(top.record.fields.problem_datum_zeit) : undefined} />
                <ProblemerfassungDetails
                  record={top.record}
                  fertigungsauftragList={data.fertigungsauftrag}
                  onOpenFertigungsauftrag={(r) => detailFertigungsauftrag(r, true)}
                />
              </>
            );
          }
          if (top.type === 'auftragsstatus') {
            return (
              <>
                <RecordHeader title={top.record.fields.aktualisiert_vorname ?? appLabel('auftragsstatus')} subtitle={top.record.fields.voraussichtlicher_abschluss ? formatDate(top.record.fields.voraussichtlicher_abschluss) : undefined} />
                <AuftragsstatusDetails
                  record={top.record}
                  fertigungsauftragList={data.fertigungsauftrag}
                  onOpenFertigungsauftrag={(r) => detailFertigungsauftrag(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'fertigungsauftrag') setFertigungsauftragDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'arbeitsvorbereitung') setArbeitsvorbereitungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'stationsprotokoll') setStationsprotokollDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'problemerfassung') setProblemerfassungDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'auftragsstatus') setAuftragsstatusDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    fertigungsauftrag: {
      openCreate: (defaults?: FertigungsauftragDialogDefaults) => setFertigungsauftragDialog({ defaults }),
      openEdit: (record: Fertigungsauftrag) => setFertigungsauftragDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Fertigungsauftrag) => detailFertigungsauftrag(record, false),
    },
    arbeitsvorbereitung: {
      openCreate: (defaults?: ArbeitsvorbereitungDialogDefaults) => setArbeitsvorbereitungDialog({ defaults }),
      openEdit: (record: Arbeitsvorbereitung) => setArbeitsvorbereitungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Arbeitsvorbereitung) => detailArbeitsvorbereitung(record, false),
    },
    stationsprotokoll: {
      openCreate: (defaults?: StationsprotokollDialogDefaults) => setStationsprotokollDialog({ defaults }),
      openEdit: (record: Stationsprotokoll) => setStationsprotokollDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Stationsprotokoll) => detailStationsprotokoll(record, false),
    },
    problemerfassung: {
      openCreate: (defaults?: ProblemerfassungDialogDefaults) => setProblemerfassungDialog({ defaults }),
      openEdit: (record: Problemerfassung) => setProblemerfassungDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Problemerfassung) => detailProblemerfassung(record, false),
    },
    auftragsstatus: {
      openCreate: (defaults?: AuftragsstatusDialogDefaults) => setAuftragsstatusDialog({ defaults }),
      openEdit: (record: Auftragsstatus) => setAuftragsstatusDialog({ editing: record, defaults: record.fields }),
      openDetail: (record: Auftragsstatus) => detailAuftragsstatus(record, false),
    },
    enriched: { fertigungsauftrag: data.fertigungsauftrag, arbeitsvorbereitung: enrichedArbeitsvorbereitung, stationsprotokoll: enrichedStationsprotokoll, problemerfassung: enrichedProblemerfassung, auftragsstatus: enrichedAuftragsstatus },
  };
}

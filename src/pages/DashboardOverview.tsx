import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { tx } from '@/i18n';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { lookupOption } from '@/types/app';
import { LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import { formatDate, lookupKey } from '@/lib/formatters';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { KanbanWidget } from '@/components/widgets/KanbanWidget';
import type { KanbanCard, KanbanColumn } from '@/components/widgets/KanbanWidget';
import {
  IconAlertTriangle,
  IconPlus,
  IconClipboardList,
  IconTool,
  IconCheckbox,
  IconHourglass,
} from '@tabler/icons-react';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const {
    fertigungsauftrag,
    stationsprotokoll,
    problemerfassung,
    auftragsstatus,
    setFertigungsauftrag,
    fetchAll,
  } = data;

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'fertigungsauftrag') {
        const current = top.record.fields.auftragsstatus_gesamt?.key;
        const nextMap: Record<string, { key: string; label: string }> = {
          'neu': { key: 'in_planung', label: tx('In Planung setzen') },
          'in_planung': { key: 'in_fertigung', label: tx('Fertigung starten') },
          'in_fertigung': { key: 'qualitaetspruefung', label: tx('Zur Qualitätsprüfung') },
          'qualitaetspruefung': { key: 'abgeschlossen', label: tx('Abschließen') },
        };
        if (current && nextMap[current]) {
          const next = nextMap[current];
          return {
            label: next.label,
            onClick: () => advanceAuftrag(top.record.record_id, next.key, top.record.fields.auftragsstatus_gesamt?.label ?? current),
          };
        }
      }
      if (top.type === 'problemerfassung') {
        const status = top.record.fields.problem_status?.key;
        if (status === 'offen') {
          return {
            label: tx('In Klärung setzen'),
            onClick: () => advanceProblem(top.record.record_id, 'in_klaerung'),
          };
        }
        if (status === 'in_klaerung') {
          return {
            label: tx('Maßnahme einleiten'),
            onClick: () => advanceProblem(top.record.record_id, 'massnahme_eingeleitet'),
          };
        }
        if (status === 'massnahme_eingeleitet') {
          return {
            label: tx('Als behoben markieren'),
            onClick: () => advanceProblem(top.record.record_id, 'behoben'),
          };
        }
      }
      return undefined;
    },
  });

  const enrichedArbeitsvorbereitung = crud.enriched.arbeitsvorbereitung;
  const enrichedStationsprotokoll = crud.enriched.stationsprotokoll;
  const enrichedProblemerfassung = crud.enriched.problemerfassung;
  const enrichedAuftragsstatus = crud.enriched.auftragsstatus;

  const clock = useClock();

  // --- Status-Advance Helpers ---
  async function advanceAuftrag(id: string, newStatus: string, fromLabel: string) {
    const prev = fertigungsauftrag.find(r => r.record_id === id);
    if (!prev) return;
    const newLV = lookupOption('fertigungsauftrag', 'auftragsstatus_gesamt', newStatus);
    setFertigungsauftrag(fertigungsauftrag.map(r =>
      r.record_id === id
        ? { ...r, fields: { ...r.fields, auftragsstatus_gesamt: newLV } }
        : r
    ));
    undoToast(
      tx`Status auf ${newLV.label} gesetzt`,
      async () => {
        setFertigungsauftrag(fertigungsauftrag.map(r =>
          r.record_id === id
            ? { ...r, fields: { ...r.fields, auftragsstatus_gesamt: prev.fields.auftragsstatus_gesamt } }
            : r
        ));
        await LivingAppsService.updateFertigungsauftragEntry(id, { auftragsstatus_gesamt: fromLabel });
        fetchAll();
      }
    );
    try {
      await LivingAppsService.updateFertigungsauftragEntry(id, { auftragsstatus_gesamt: newStatus });
    } catch {
      fetchAll();
    }
  }

  async function advanceProblem(id: string, newStatus: string) {
    const prev = problemerfassung.find(r => r.record_id === id);
    if (!prev) return;
    const newLV = lookupOption('problemerfassung', 'problem_status', newStatus);
    data.setProblemerfassung(problemerfassung.map(r =>
      r.record_id === id
        ? { ...r, fields: { ...r.fields, problem_status: newLV } }
        : r
    ));
    undoToast(
      tx`Problem auf ${newLV.label} gesetzt`,
      async () => {
        data.setProblemerfassung(problemerfassung.map(r =>
          r.record_id === id
            ? { ...r, fields: { ...r.fields, problem_status: prev.fields.problem_status } }
            : r
        ));
        await LivingAppsService.updateProblemerfassungEntry(id, { problem_status: prev.fields.problem_status?.key ?? 'offen' });
        fetchAll();
      }
    );
    try {
      await LivingAppsService.updateProblemerfassungEntry(id, { problem_status: newStatus });
    } catch {
      fetchAll();
    }
  }

  // --- KPI Derivations ---
  const inFertigung = fertigungsauftrag.filter(r => r.fields.auftragsstatus_gesamt?.key === 'in_fertigung');
  const kritischeAuftraege = auftragsstatus.filter(r =>
    r.fields.gesamtstatus?.key === 'kritisch' || r.fields.eskalation_erforderlich === true
  );
  const offeneProbleme = problemerfassung.filter(r => {
    const k = r.fields.problem_status?.key;
    return k === 'offen' || k === 'in_klaerung' || k === 'eskaliert';
  });
  const aktiveSessions = stationsprotokoll.filter(r => r.fields.bearbeitungsstatus?.key === 'in_bearbeitung');
  const abgeschlossenHeute = fertigungsauftrag.filter(r => r.fields.auftragsstatus_gesamt?.key === 'abgeschlossen');

  // Hero: kritische Aufträge
  const heroAuftragId = kritischeAuftraege[0]
    ? extractRecordId(kritischeAuftraege[0].fields.fertigungsauftrag)
    : null;
  const heroFertigungsauftrag = heroAuftragId
    ? fertigungsauftrag.find(r => r.record_id === heroAuftragId)
    : null;
  const heroKritischNames = kritischeAuftraege.map(k => {
    const fa = fertigungsauftrag.find(r => r.record_id === extractRecordId(k.fields.fertigungsauftrag));
    return fa ? `${fa.fields.auftragsnummer ?? ''} (${fa.fields.kunde_nachname ?? ''})` : enrichedAuftragsstatus.find(e => e.record_id === k.record_id)?.fertigungsauftragName ?? '';
  }).filter(Boolean);

  // Kontext-Linie
  const activeNames = inFertigung.map(r =>
    r.fields.kunde_nachname ? `${r.fields.kunde_vorname ?? ''} ${r.fields.kunde_nachname}`.trim() : r.fields.auftragsnummer ?? ''
  );
  const contextLine = inFertigung.length === 0
    ? tx('Keine Aufträge in aktiver Fertigung.')
    : inFertigung.length === 1
    ? tx`${namen(activeNames)} ist aktuell in Fertigung.`
    : tx`${namen(activeNames)} sind aktuell in Fertigung.`;

  // Kanban columns & cards — INSIDE component body (locale-aware getters)
  const kanbanColumns: KanbanColumn[] = (LOOKUP_OPTIONS['fertigungsauftrag']?.['auftragsstatus_gesamt'] ?? []).map(o => ({
    key: o.key,
    label: o.label,
    tone: o.key === 'abgeschlossen' ? 'success' as const
      : o.key === 'storniert' ? 'default' as const
      : o.key === 'in_fertigung' ? 'primary' as const
      : 'default' as const,
  }));

  const kanbanCards: KanbanCard[] = fertigungsauftrag
    .sort((a, b) => {
      // Priorität: dringend > hoch > normal
      const pOrder: Record<string, number> = { dringend: 0, hoch: 1, normal: 2 };
      const pa = pOrder[a.fields.prioritaet?.key ?? 'normal'] ?? 2;
      const pb = pOrder[b.fields.prioritaet?.key ?? 'normal'] ?? 2;
      return pa - pb;
    })
    .map(r => {
      const statusKey = lookupKey(r.fields.auftragsstatus_gesamt) ?? '';
      const prio = r.fields.prioritaet?.key;
      const hasKritisch = kritischeAuftraege.some(k => extractRecordId(k.fields.fertigungsauftrag) === r.record_id);
      const tone: KanbanCard['tone'] = hasKritisch ? 'destructive'
        : prio === 'dringend' ? 'warning'
        : 'default';
      const statusInfo = auftragsstatus.find(s => extractRecordId(s.fields.fertigungsauftrag) === r.record_id);
      const progress = statusInfo?.fields.fertigstellungsgrad_gesamt;
      return {
        id: `auftrag:${r.record_id}`,
        column: statusKey,
        title: (
          <span className="font-medium text-sm">
            {r.fields.auftragsnummer ?? tx('Auftrag')}
            {prio === 'dringend' && (
              <span className="ml-1 text-amber-600 text-xs">{tx('DRINGEND')}</span>
            )}
          </span>
        ),
        subtitle: (
          <span className="text-xs text-muted-foreground space-y-0.5">
            <span className="block truncate">
              {r.fields.fahrzeugtyp?.label ?? ''}{r.fields.fahrzeugmodell ? ` · ${r.fields.fahrzeugmodell}` : ''}
            </span>
            <span className="block truncate">
              {r.fields.kunde_vorname} {r.fields.kunde_nachname}
              {r.fields.geplanter_abschluss && (
                <span className="ml-1 text-muted-foreground">· {tx('Termin:')} {formatDate(r.fields.geplanter_abschluss)}</span>
              )}
            </span>
            {progress != null && (
              <span className="block">
                <span className="inline-flex items-center gap-1">
                  <span className="text-xs">{progress}%</span>
                  <span className="h-1 w-16 bg-muted rounded-full overflow-hidden inline-block align-middle">
                    <span
                      className="h-full bg-primary rounded-full block"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </span>
                </span>
              </span>
            )}
          </span>
        ),
        tone,
      };
    });

  // --- onCardMove ---
  async function handleCardMove(cardId: string, newColumn: string) {
    const id = cardId.split(':')[1];
    const record = fertigungsauftrag.find(r => r.record_id === id);
    if (!record) return;
    const prevStatus = record.fields.auftragsstatus_gesamt;
    const newLV = lookupOption('fertigungsauftrag', 'auftragsstatus_gesamt', newColumn);
    // Optimistic update
    setFertigungsauftrag(fertigungsauftrag.map(r =>
      r.record_id === id
        ? { ...r, fields: { ...r.fields, auftragsstatus_gesamt: newLV } }
        : r
    ));
    undoToast(
      tx`${record.fields.auftragsnummer ?? tx('Auftrag')} → ${newLV.label}`,
      async () => {
        setFertigungsauftrag(fertigungsauftrag.map(r =>
          r.record_id === id
            ? { ...r, fields: { ...r.fields, auftragsstatus_gesamt: prevStatus } }
            : r
        ));
        await LivingAppsService.updateFertigungsauftragEntry(id, {
          auftragsstatus_gesamt: prevStatus?.key ?? 'neu',
        });
        fetchAll();
      }
    );
    try {
      await LivingAppsService.updateFertigungsauftragEntry(id, { auftragsstatus_gesamt: newColumn });
    } catch {
      fetchAll();
    }
  }

  // --- WorkList: Offene Probleme ---
  const offeneProblemeItems = offeneProbleme.slice(0, 5).map(r => {
    const fa = fertigungsauftrag.find(f => f.record_id === extractRecordId(r.fields.fertigungsauftrag));
    const isEskaliert = r.fields.problem_status?.key === 'eskaliert';
    return {
      id: r.record_id,
      title: r.fields.problem_beschreibung
        ? r.fields.problem_beschreibung.slice(0, 60) + (r.fields.problem_beschreibung.length > 60 ? '…' : '')
        : tx('Problem'),
      secondLine: (
        <>
          <span className={isEskaliert ? 'font-medium text-destructive' : 'font-medium text-amber-600'}>
            {r.fields.problem_status?.label ?? tx('Offen')}
          </span>
          {fa && <span className="text-muted-foreground"> · {fa.fields.auftragsnummer}</span>}
          {r.fields.betroffene_station && <span className="text-muted-foreground"> · {r.fields.betroffene_station.label.replace(/Station \d+ –\s*/, '')}</span>}
        </>
      ),
      action: r.fields.problem_status?.key === 'offen'
        ? { label: tx('→ Klärung'), onClick: () => advanceProblem(r.record_id, 'in_klaerung') }
        : r.fields.problem_status?.key === 'in_klaerung'
        ? { label: tx('→ Maßnahme'), onClick: () => advanceProblem(r.record_id, 'massnahme_eingeleitet') }
        : undefined,
    };
  });

  // --- WorkList: Aktive Stationen ---
  const aktiveStationItems = aktiveSessions.slice(0, 5).map(r => {
    const fa = fertigungsauftrag.find(f => f.record_id === extractRecordId(r.fields.fertigungsauftrag));
    return {
      id: r.record_id,
      title: r.fields.station_bezeichnung_detail ?? r.fields.station_nummer?.label ?? tx('Station'),
      secondLine: (
        <>
          <span className="font-medium text-primary">{tx('In Bearbeitung')}</span>
          {fa && <span className="text-muted-foreground"> · {fa.fields.auftragsnummer}</span>}
          {r.fields.mitarbeiter_vorname && (
            <span className="text-muted-foreground"> · {r.fields.mitarbeiter_vorname} {r.fields.mitarbeiter_nachname}</span>
          )}
        </>
      ),
      action: {
        label: tx('→ Abschließen'),
        onClick: () => {
          const prevStatus = r.fields.bearbeitungsstatus;
          const newLV = lookupOption('stationsprotokoll', 'bearbeitungsstatus', 'abgeschlossen');
          data.setStationsprotokoll(stationsprotokoll.map(s =>
            s.record_id === r.record_id
              ? { ...s, fields: { ...s.fields, bearbeitungsstatus: newLV } }
              : s
          ));
          undoToast(
            tx`Station als abgeschlossen markiert`,
            async () => {
              data.setStationsprotokoll(stationsprotokoll.map(s =>
                s.record_id === r.record_id
                  ? { ...s, fields: { ...s.fields, bearbeitungsstatus: prevStatus } }
                  : s
              ));
              await LivingAppsService.updateStationsprotokollEntry(r.record_id, {
                bearbeitungsstatus: prevStatus?.key ?? 'in_bearbeitung',
              });
              fetchAll();
            }
          );
          LivingAppsService.updateStationsprotokollEntry(r.record_id, { bearbeitungsstatus: 'abgeschlossen' })
            .catch(() => fetchAll());
        },
      },
    };
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">{gruss(clock)}</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">{contextLine}</p>
        </div>
        <button
          onClick={() => crud.fertigungsauftrag.openCreate({})}
          className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          <IconPlus size={16} className="shrink-0" />
          {tx('Neuer Auftrag')}
        </button>
      </div>

      <DashboardGrid
        variant="wide"
        hero={
          kritischeAuftraege.length > 0 && heroFertigungsauftrag ? (
            <HeroBanner
              icon={<IconAlertTriangle size={18} />}
              action={{
                label: tx('Status aktualisieren'),
                onClick: () => crud.fertigungsauftrag.openDetail(heroFertigungsauftrag),
              }}
            >
              <b>{namen(heroKritischNames)}</b>{' '}
              {kritischeAuftraege.length === 1
                ? tx`ist kritisch oder benötigt Eskalation`
                : tx`sind kritisch oder benötigen Eskalation`}{' '}
              — {tx('sofortiger Handlungsbedarf.')}
            </HeroBanner>
          ) : kritischeAuftraege.length > 0 ? (
            <HeroBanner
              icon={<IconAlertTriangle size={18} />}
              action={{
                label: tx('Probleme ansehen'),
                onClick: () => crud.auftragsstatus.openDetail(kritischeAuftraege[0]),
              }}
            >
              <b>{kritischeAuftraege.length} {tx('kritische Aufträge')}</b> {tx('benötigen sofortige Aufmerksamkeit.')}
            </HeroBanner>
          ) : undefined
        }
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('In Fertigung')}
              value={inFertigung.length}
              icon={<IconTool size={16} />}
              tone={inFertigung.length > 0 ? 'primary' : 'default'}
            />
            <StatStripItem
              title={tx('Offene Probleme')}
              value={offeneProbleme.length}
              icon={<IconAlertTriangle size={16} />}
              tone={offeneProbleme.length > 0 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={tx('Aktive Stationen')}
              value={aktiveSessions.length}
              icon={<IconHourglass size={16} />}
              tone={aktiveSessions.length > 0 ? 'primary' : 'default'}
            />
            <StatStripItem
              title={tx('Abgeschlossen')}
              value={abgeschlossenHeute.length}
              icon={<IconCheckbox size={16} />}
              tone={abgeschlossenHeute.length > 0 ? 'success' : 'default'}
            />
            <StatStripItem
              title={tx('Gesamt')}
              value={fertigungsauftrag.length}
              icon={<IconClipboardList size={16} />}
              tone="default"
            />
          </StatStrip>
        }
        primary={
          fertigungsauftrag.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-2 border-dashed border-border">
              <IconClipboardList size={48} className="text-muted-foreground" stroke={1.5} />
              <div className="text-center">
                <p className="font-semibold text-foreground">{tx('Noch keine Fertigungsaufträge')}</p>
                <p className="text-sm text-muted-foreground mt-1">{tx('Erstelle den ersten Auftrag, um die Fertigung zu starten.')}</p>
              </div>
              <button
                onClick={() => crud.fertigungsauftrag.openCreate({})}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
              >
                <IconPlus size={16} className="shrink-0" />
                {tx('Ersten Auftrag erstellen')}
              </button>
            </div>
          ) : (
            <KanbanWidget
              columns={kanbanColumns}
              cards={kanbanCards}
              defaultCollapsed={['storniert']}
              onCardClick={(card) => {
                const id = card.id.split(':')[1];
                const record = fertigungsauftrag.find(r => r.record_id === id);
                if (record) crud.fertigungsauftrag.openDetail(record);
              }}
              onCardMove={handleCardMove}
              onAddCard={(column) => crud.fertigungsauftrag.openCreate({ auftragsstatus_gesamt: column })}
            />
          )
        }
        aside={
          <>
            <WorkList
              title={tx('Offene Probleme')}
              items={offeneProblemeItems}
              onItemClick={(id) => {
                const record = problemerfassung.find(r => r.record_id === id);
                if (record) crud.problemerfassung.openDetail(record);
              }}
              empty={{
                text: tx('Keine offenen Probleme — alles läuft planmäßig.'),
                action: {
                  label: tx('Problem melden'),
                  onClick: () => crud.problemerfassung.openCreate({}),
                },
              }}
            />
            <WorkList
              title={tx('Aktive Stationen')}
              items={aktiveStationItems}
              onItemClick={(id) => {
                const record = stationsprotokoll.find(r => r.record_id === id);
                if (record) crud.stationsprotokoll.openDetail(record);
              }}
              empty={{
                text: tx('Keine Station aktiv — nächster Eintrag steht aus.'),
                action: {
                  label: tx('Station erfassen'),
                  onClick: () => crud.stationsprotokoll.openCreate({}),
                },
              }}
            />
          </>
        }
      />

      {crud.surfaces}
    </div>
  );
}

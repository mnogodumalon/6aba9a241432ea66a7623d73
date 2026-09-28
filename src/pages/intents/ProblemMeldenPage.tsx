/**
 * Problem melden — 3-Schritt-Wizard.
 * Steps: 1) Auftrag wählen → 2) Problem beschreiben → 3) Details & Melder → 4) Prüfen & anlegen.
 * Reads: fertigungsauftrag. Writes: problemerfassung (creates one entry with fertigungsauftrag-Referenz).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, ChoiceGroup, Field, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Field } from '@/components/blocks/Field';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { StatusBadge } from '@/components/blocks/StatusBadge';
import {
  useRecordSearch,
  useStepForm,
  useJourneySubmit,
  fieldText,
  fieldLookup,
  nowIso,
  combineFilters,
} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

const ELIGIBLE_FILTER = combineFilters(
  "r.v_auftragsstatus_gesamt in ['neu', 'in_planung', 'in_fertigung', 'qualitaetspruefung']",
);

export default function ProblemMeldenPage() {
  const [step, setStep] = useState(1);

  const auftraege = useRecordSearch(servicePort, 'fertigungsauftrag', {
    filter: ELIGIBLE_FILTER,
    where: r => {
      const key = fieldLookup(r, 'auftragsstatus_gesamt')?.key;
      return key === 'neu' || key === 'in_planung' || key === 'in_fertigung' || key === 'qualitaetspruefung';
    },
    searchFields: ['auftragsnummer', 'kunde_nachname', 'fahrzeugmodell'],
    toItem: a => ({
      id: a.id,
      title: `${fieldText(a, 'auftragsnummer')} — ${fieldText(a, 'kunde_nachname')}`,
      subtitle: fieldText(a, 'fahrzeugmodell'),
      status: fieldLookup(a, 'auftragsstatus_gesamt') ?? undefined,
    }),
  });

  const problem = useStepForm('problemerfassung', {
    steps: {
      fertigungsauftrag: 1,
      betroffene_station: 2,
      problemtyp: 2,
      problem_datum_zeit: 2,
      problem_beschreibung: 2,
      ursache: 3,
      auswirkung_termin: 3,
      fehlende_artikel: 3,
      problem_status: 3,
      gemeldet_vorname: 3,
      gemeldet_nachname: 3,
      loesungsmassnahme: 3,
    },
    initial: {
      problem_status: 'offen',
      problem_datum_zeit: nowIso(),
    },
  });

  const submit = useJourneySubmit(servicePort, [
    {
      key: 'problem',
      entity: 'problemerfassung',
      form: problem,
      primary: true,
    },
  ], { draftKey: 'problem-melden' });

  const auftragId = problem.get('fertigungsauftrag') as string | null;
  const auftragRecord = auftragId ? auftraege.recordOf(auftragId) : undefined;

  return (
    <IntentWizardShell
      title={tx('Problem melden')}
      subtitle={tx('Verzögerung, fehlendes Material oder Qualitätsproblem erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[problem]}
      draftKey="problem-melden"
      intro={{
        description: tx('Ein Problem an einer Fertigungsstation für einen laufenden Auftrag erfassen.'),
        needs: [tx('Auftragsnummer oder Kundennachname'), tx('Betroffene Station'), tx('Vor- und Nachname des Melders')],
      }}
    >
      {/* Schritt 1: Auftrag wählen */}
      <WizardStep
        label={tx('Auftrag wählen')}
        description={tx('Nur laufende Aufträge werden angezeigt (nicht storniert, nicht abgeschlossen).')}
      >
        <EntitySelectStep
          {...auftraege.select}
          selectedId={auftragId}
          emptyText={tx('Kein laufender Auftrag gefunden. Stornierte und abgeschlossene Aufträge werden hier nicht angezeigt.')}
          searchPlaceholder={tx('Nach Auftragsnummer, Nachname oder Fahrzeugmodell suchen …')}
          avatar="none"
          onSelect={id => {
            problem.set('fertigungsauftrag', id, auftraege.labelOf(id));
            setStep(2);
          }}
        />
      </WizardStep>

      {/* Schritt 2: Problem beschreiben */}
      <WizardStep
        label={tx('Problem beschreiben')}
        description={tx('Station, Problemtyp, Zeitpunkt und Beschreibung des Problems angeben.')}
        needs={['fertigungsauftrag']}
      >
        <div className="space-y-5">
          {auftragRecord && (
            <div className="flex items-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm">
              <span className="font-medium">{fieldText(auftragRecord, 'auftragsnummer')}</span>
              <span className="text-muted-foreground">—</span>
              <span>{fieldText(auftragRecord, 'kunde_vorname')} {fieldText(auftragRecord, 'kunde_nachname')}</span>
              <StatusBadge statusKey={fieldLookup(auftragRecord, 'auftragsstatus_gesamt')?.key} label={fieldLookup(auftragRecord, 'auftragsstatus_gesamt')?.label} />
            </div>
          )}

          <Bound
            form={problem}
            name="betroffene_station"
            label={tx('Betroffene Station')}
          />

          <Bound
            form={problem}
            name="problemtyp"
            label={tx('Problemtyp')}
          />

          <Bound
            form={problem}
            name="problem_datum_zeit"
          />

          <Bound
            form={problem}
            name="problem_beschreibung"
            label={tx('Problembeschreibung')}
            rows={4}
            placeholder={tx('Was genau ist das Problem? Möglichst konkret beschreiben …')}
          />

          <StepNav
            onBack={() => setStep(1)}
            onNext={() => problem.validate(['betroffene_station', 'problemtyp', 'problem_datum_zeit', 'problem_beschreibung'])}
            nextStepLabel={tx('Details & Melder')}
          />
        </div>
      </WizardStep>

      {/* Schritt 3: Details & Melder */}
      <WizardStep
        label={tx('Details & Melder')}
        description={tx('Ursache, Auswirkung und Angaben zur meldenden Person eintragen.')}
        needs={['betroffene_station', 'problemtyp']}
      >
        <div className="space-y-5">
          <Bound
            form={problem}
            name="ursache"
            rows={3}
            placeholder={tx('Mögliche Ursache des Problems …')}
          />

          <Bound
            form={problem}
            name="auswirkung_termin"
          />

          <Bound
            form={problem}
            name="fehlende_artikel"
            rows={3}
            placeholder={tx('Artikelnummer, Bezeichnung oder Beschreibung der fehlenden Materialien …')}
          />

          <Bound
            form={problem}
            name="problem_status"
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Bound
              form={problem}
              name="gemeldet_vorname"
              placeholder={tx('Vorname')}
            />
            <Bound
              form={problem}
              name="gemeldet_nachname"
              placeholder={tx('Nachname')}
            />
          </div>

          <Bound
            form={problem}
            name="loesungsmassnahme"
            rows={3}
            placeholder={tx('Geplante oder bereits eingeleitete Maßnahme …')}
          />

          <StepNav
            onBack={() => setStep(2)}
            onNext={() => problem.validate(['problem_status', 'gemeldet_vorname', 'gemeldet_nachname'])}
            nextStepLabel={tx('Prüfen & Absenden')}
          />
        </div>
      </WizardStep>

      {/* Schritt 4: Prüfen & Anlegen */}
      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep
            forms={[problem]}
            submit={submit}
            whatHappensNext={tx('Das Problem wird dem Auftrag zugeordnet und erscheint sofort in der Problemübersicht.')}
            confirmLabel={tx('Problem melden')}
          />
        )}
      </WizardStep>

      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[problem]}
          submit={submit}
          restartLabel={tx('Weiteres Problem melden')}
          whatHappensNext={tx('Das gemeldete Problem kann über „Status aktualisieren" weiterverfolgt werden.')}
          next={[
            {
              label: tx('Status aktualisieren'),
              href: '#/intents/auftragsstatus-aktualisieren',
            },
            {
              label: tx('Zum Dashboard'),
              href: '#/',
            },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}

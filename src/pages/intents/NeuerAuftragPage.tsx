/**
 * Neuer Auftrag — 3-Schritt-Wizard zum Anlegen eines Fertigungsauftrags.
 * Steps: 1) Auftragsdaten → 2) Kundendaten & Fahrzeug → 3) Planung & Projektleiter → Prüfen & anlegen.
 * Reads: — (keine externe Entität als Pick-Schritt nötig).
 * Writes: fertigungsauftrag (createFertigungsauftragEntry via plan).
 * Composes: IntentWizardShell, WizardStep, StepNav, SummaryStep, SuccessStep, Bound, ChoiceGroup, Field.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { Bound } from '@/components/blocks/Bound';
import { useStepForm, useJourneySubmit, todayIso } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

export default function NeuerAuftragPage() {
  const [step, setStep] = useState(1);

  const f = useStepForm('fertigungsauftrag', {
    steps: {
      // Schritt 1 — Auftragsdaten
      auftragsnummer: 1,
      auftragsdatum: 1,
      prioritaet: 1,
      auftragsstatus_gesamt: 1,
      // Schritt 2 — Kundendaten & Fahrzeug
      kunde_vorname: 2,
      kunde_nachname: 2,
      kunde_telefon: 2,
      kunde_email: 2,
      fahrzeugtyp: 2,
      fahrzeugmodell: 2,
      basisfahrzeug: 2,
      fahrzeug_laenge: 2,
      fahrzeug_gewicht: 2,
      sonderausstattung: 2,
      // Schritt 3 — Planung & Projektleiter
      geplanter_start: 3,
      geplanter_abschluss: 3,
      projektleiter_vorname: 3,
      projektleiter_nachname: 3,
      soll_stunden_gesamt: 3,
      bemerkungen: 3,
    },
    initial: {
      auftragsdatum: todayIso(),
      auftragsstatus_gesamt: 'neu',
    },
  });

  const submit = useJourneySubmit(
    servicePort,
    [{ key: 'auftrag', entity: 'fertigungsauftrag', form: f, primary: true }],
    { draftKey: 'neuer-auftrag' },
  );

  return (
    <IntentWizardShell
      title={tx('Neuer Fertigungsauftrag')}
      subtitle={tx('Auftrag in 3 Schritten erfassen und anlegen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[f]}
      draftKey="neuer-auftrag"
      intro={{
        description: tx('Einen neuen Fertigungsauftrag mit allen Pflichtfeldern anlegen.'),
        needs: [tx('Auftragsnummer'), tx('Kundendaten'), tx('Fahrzeuginformationen'), tx('Projektleiter')],
      }}
    >
      {/* Schritt 1 — Auftragsdaten */}
      <WizardStep
        label={tx('Auftragsdaten')}
        description={tx('Grundlegende Informationen zum Fertigungsauftrag erfassen.')}
      >
        <div className="space-y-4">
          <Bound form={f} name="auftragsnummer" />
          <Bound form={f} name="auftragsdatum" />
          <Bound form={f} name="prioritaet" />
          <Bound form={f} name="auftragsstatus_gesamt" />
          <StepNav
            hideBack
            onNext={() => f.validate(['auftragsnummer', 'auftragsdatum', 'prioritaet', 'auftragsstatus_gesamt'])}
            nextStepLabel={tx('Kundendaten & Fahrzeug')}
          />
        </div>
      </WizardStep>

      {/* Schritt 2 — Kundendaten & Fahrzeug */}
      <WizardStep
        label={tx('Kundendaten & Fahrzeug')}
        description={tx('Angaben zum Auftraggeber und zum zu fertigenden Fahrzeug eingeben.')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Bound form={f} name="kunde_vorname" />
            <Bound form={f} name="kunde_nachname" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Bound form={f} name="kunde_telefon" />
            <Bound form={f} name="kunde_email" />
          </div>
          <Bound form={f} name="fahrzeugtyp" />
          <Bound form={f} name="fahrzeugmodell" />
          <Bound form={f} name="basisfahrzeug" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Bound form={f} name="fahrzeug_laenge" />
            <Bound form={f} name="fahrzeug_gewicht" />
          </div>
          <Bound form={f} name="sonderausstattung" rows={3} />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() =>
              f.validate([
                'kunde_vorname',
                'kunde_nachname',
                'fahrzeugtyp',
                'fahrzeugmodell',
                'basisfahrzeug',
              ])
            }
            nextStepLabel={tx('Planung & Projektleiter')}
          />
        </div>
      </WizardStep>

      {/* Schritt 3 — Planung & Projektleiter */}
      <WizardStep
        label={tx('Planung & Projektleiter')}
        description={tx('Zeitplan und verantwortliche Person für den Auftrag festlegen.')}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Bound form={f} name="geplanter_start" />
            <Bound form={f} name="geplanter_abschluss" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Bound form={f} name="projektleiter_vorname" />
            <Bound form={f} name="projektleiter_nachname" />
          </div>
          <Bound form={f} name="soll_stunden_gesamt" />
          <Bound form={f} name="bemerkungen" rows={3} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() =>
              f.validate([
                'geplanter_start',
                'geplanter_abschluss',
                'projektleiter_vorname',
                'projektleiter_nachname',
              ])
            }
            nextStepLabel={tx('Prüfen & anlegen')}
          />
        </div>
      </WizardStep>

      {/* Schritt 4 — Zusammenfassung */}
      <WizardStep label={tx('Prüfen & anlegen')}>
        {!submit.done && (
          <SummaryStep
            forms={[f]}
            submit={submit}
            whatHappensNext={tx(
              'Der Fertigungsauftrag wird sofort angelegt und ist für die Stationserfassung bereit.',
            )}
          />
        )}
        {submit.result && (
          <SuccessStep
            result={submit.result}
            forms={[f]}
            submit={submit}
            whatHappensNext={tx(
              'Jetzt können Stationsprotokolle erfasst und der Auftragsstatus aktualisiert werden.',
            )}
            next={[
              {
                label: tx('Stationsprotokoll erfassen'),
                href: '#/intents/stationsprotokoll-erfassen',
              },
              {
                label: tx('Weiteren Auftrag anlegen'),
              },
              { label: tx('Zum Dashboard'), href: '#/' },
            ]}
          />
        )}
      </WizardStep>
    </IntentWizardShell>
  );
}

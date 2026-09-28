/**
 * Stationsprotokoll erfassen — 4-Schritt-Wizard.
 * Steps: 1) Auftrag wählen → 2) Station & Status → 3) Zeiten & Mitarbeiter → 4) Arbeiten & Materialien → 5) Prüfen & anlegen.
 * Reads: fertigungsauftrag. Writes: stationsprotokoll (mit fertigungsauftrag-Referenz).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, ChoiceGroup, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import { useStepForm, useJourneySubmit, useRecordSearch, fieldText, fieldLookup } from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

export default function StationsprotokollErfassenPage() {
  const [step, setStep] = useState(1);

  // Aufträge: nur neu | in_planung | in_fertigung (keine abgeschlossenen oder stornierten)
  const auftraege = useRecordSearch(servicePort, 'fertigungsauftrag', {
    filter: "r.v_auftragsstatus_gesamt in ['neu', 'in_planung', 'in_fertigung']",
    where: r => {
      const key = fieldLookup(r, 'auftragsstatus_gesamt')?.key;
      return key === 'neu' || key === 'in_planung' || key === 'in_fertigung';
    },
    searchFields: ['auftragsnummer', 'kunde_nachname', 'fahrzeugmodell'],
    toItem: a => ({
      id: a.id,
      title: fieldText(a, 'auftragsnummer'),
      subtitle: `${fieldText(a, 'kunde_vorname')} ${fieldText(a, 'kunde_nachname')} — ${fieldText(a, 'fahrzeugmodell')}`.trim(),
      status: fieldLookup(a, 'auftragsstatus_gesamt') ?? undefined,
    }),
    orderby: ['r.v_auftragsnummer asc'],
  });

  // Formular für stationsprotokoll
  const protokoll = useStepForm('stationsprotokoll', {
    steps: {
      fertigungsauftrag: 1,
      station_nummer: 2,
      station_bezeichnung_detail: 2,
      bearbeitungsstatus: 2,
      beginn_datum_zeit: 3,
      ende_datum_zeit: 3,
      ist_stunden: 3,
      mitarbeiter_vorname: 3,
      mitarbeiter_nachname: 3,
      weitere_mitarbeiter: 3,
      fertigstellungsgrad: 4,
      erledigte_arbeiten: 4,
      verwendete_materialien: 4,
      anmerkungen_station: 4,
    },
  });

  const submit = useJourneySubmit(servicePort, [
    {
      key: 'stationsprotokoll',
      entity: 'stationsprotokoll',
      form: protokoll,
      primary: true,
    },
  ], { draftKey: 'stationsprotokoll-erfassen' });

  return (
    <IntentWizardShell
      title={tx('Stationsprotokoll erfassen')}
      currentStep={step}
      onStepChange={setStep}
      forms={[protokoll]}
      draftKey="stationsprotokoll-erfassen"
      intro={{
        description: tx('Bearbeitungsstand einer Fertigungsstation für einen Auftrag dokumentieren.'),
        needs: [tx('Auftragsnummer oder Kundenname'), tx('Stationsnummer und Bearbeitungsstatus'), tx('Name des verantwortlichen Mitarbeiters')],
      }}
    >
      {/* Schritt 1: Auftrag wählen */}
      <WizardStep
        label={tx('Auftrag')}
        heading={tx('Auftrag wählen')}
        description={tx('Nur Aufträge in Bearbeitung werden angezeigt — abgeschlossene und stornierte entfallen.')}
      >
        <EntitySelectStep
          {...auftraege.select}
          selectedId={protokoll.get('fertigungsauftrag') as string | null}
          onSelect={id => {
            protokoll.set('fertigungsauftrag', id, auftraege.labelOf(id));
            setStep(2);
          }}
          searchPlaceholder={tx('Auftragsnummer, Nachname oder Fahrzeugmodell …')}
          emptyText={tx('Keine aktiven Aufträge gefunden. Nur Aufträge mit Status „Neu", „In Planung" oder „In Fertigung" sind wählbar.')}
          create={false}
          avatar="none"
        />
      </WizardStep>

      {/* Schritt 2: Station & Status */}
      <WizardStep
        label={tx('Station & Status')}
        description={tx('Stationsnummer und aktuellen Bearbeitungsstatus festlegen.')}
        needs={['fertigungsauftrag']}
      >
        <div className="space-y-5">
          <Bound form={protokoll} name="station_nummer" />
          <Bound form={protokoll} name="station_bezeichnung_detail" placeholder={tx('z. B. Kühlschrank, Bett, Markise …')} />
          <Bound form={protokoll} name="bearbeitungsstatus" />
          <StepNav
            onBack={() => setStep(1)}
            onNext={() => protokoll.validate(['station_nummer', 'bearbeitungsstatus'])}
            nextStepLabel={tx('Zeiten & Mitarbeiter')}
          />
        </div>
      </WizardStep>

      {/* Schritt 3: Zeiten & Mitarbeiter */}
      <WizardStep
        label={tx('Zeiten & Mitarbeiter')}
        description={tx('Beginn, Ende und verantwortliche Person erfassen.')}
        needs={['station_nummer', 'bearbeitungsstatus']}
      >
        <div className="space-y-5">
          <Bound form={protokoll} name="beginn_datum_zeit" />
          <Bound form={protokoll} name="ende_datum_zeit" />
          <Bound form={protokoll} name="ist_stunden" hint={tx('Tatsächlich geleistete Stunden')} />
          <Bound form={protokoll} name="mitarbeiter_vorname" />
          <Bound form={protokoll} name="mitarbeiter_nachname" />
          <Bound form={protokoll} name="weitere_mitarbeiter" rows={2} placeholder={tx('Weitere beteiligte Mitarbeiter (Name, Name …)')} />
          <StepNav
            onBack={() => setStep(2)}
            onNext={() => protokoll.validate(['beginn_datum_zeit', 'mitarbeiter_vorname', 'mitarbeiter_nachname'])}
            nextStepLabel={tx('Arbeiten & Materialien')}
          />
        </div>
      </WizardStep>

      {/* Schritt 4: Arbeiten & Materialien */}
      <WizardStep
        label={tx('Arbeiten & Materialien')}
        description={tx('Fertigstellungsgrad, erledigte Arbeiten und verwendete Materialien dokumentieren.')}
        needs={['beginn_datum_zeit', 'mitarbeiter_vorname', 'mitarbeiter_nachname']}
      >
        <div className="space-y-5">
          <Bound form={protokoll} name="fertigstellungsgrad" hint={tx('Angabe in Prozent, z. B. 75')} />
          <Bound form={protokoll} name="erledigte_arbeiten" rows={4} placeholder={tx('Welche Arbeiten wurden abgeschlossen?')} />
          <Bound form={protokoll} name="verwendete_materialien" rows={3} placeholder={tx('Materialien und Mengen auflisten …')} />
          <Bound form={protokoll} name="anmerkungen_station" rows={3} placeholder={tx('Hinweise, Besonderheiten, nächste Schritte …')} />
          <StepNav
            onBack={() => setStep(3)}
            onNext={() => protokoll.validate(['fertigstellungsgrad', 'erledigte_arbeiten', 'verwendete_materialien', 'anmerkungen_station'])}
            nextStepLabel={tx('Prüfen & anlegen')}
          />
        </div>
      </WizardStep>

      {/* Schritt 5: Zusammenfassung */}
      <WizardStep label={tx('Prüfen')}>
        {!submit.done && (
          <SummaryStep
            forms={[protokoll]}
            submit={submit}
            whatHappensNext={tx('Das Stationsprotokoll wird sofort im System gespeichert und ist dem Auftrag zugeordnet.')}
          />
        )}
      </WizardStep>

      {/* Erfolgsmeldung */}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[protokoll]}
          submit={submit}
          restartLabel={tx('Weiteres Protokoll erfassen')}
          whatHappensNext={tx('Das Protokoll ist gespeichert. Bei einem Problem kannst du direkt eine Meldung aufgeben.')}
          next={[
            { label: tx('Problem melden'), href: '#/intents/problem-melden' },
            { label: tx('Zum Dashboard'), href: '#/' },
          ]}
        />
      )}
    </IntentWizardShell>
  );
}

/**
 * Auftragsstatus aktualisieren — 4-Schritt-Wizard (+ Review + Success).
 * Steps: 1) Auftrag wählen → 2) Aktueller Status → 3) Stunden & Aufgaben → 4) Bearbeiter & Kommentar → 5) Prüfen & speichern.
 * Reads: fertigungsauftrag, auftragsstatus.
 * Writes: auftragsstatus (createAuftragsstatu wenn neu, updateAuftragsstatu wenn vorhanden).
 * Composes: IntentWizardShell, WizardStep, EntitySelectStep, ChoiceGroup, Bound, StepNav, SummaryStep, SuccessStep.
 */
import { useState } from 'react';
import { IntentWizardShell, WizardStep } from '@/components/blocks/IntentWizardShell';
import { EntitySelectStep } from '@/components/blocks/EntitySelectStep';
import { Bound } from '@/components/blocks/Bound';
import { StepNav } from '@/components/blocks/StepNav';
import { SummaryStep } from '@/components/blocks/SummaryStep';
import { SuccessStep } from '@/components/blocks/SuccessStep';
import {
  useStepForm,
  useJourneySubmit,
  useRecordSearch,
  fieldText,
  fieldLookup,
  refFilter,
  nowIso,
} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { tx } from '@/i18n';

export default function AuftragstatusAktualisierenPage() {
  const [step, setStep] = useState(1);

  // Schritt 1: Auftrag wählen — nur nicht abgeschlossene/stornierte Aufträge
  const auftraege = useRecordSearch(servicePort, 'fertigungsauftrag', {
    filter: "r.v_auftragsstatus_gesamt not in ['abgeschlossen', 'storniert']",
    where: r => {
      const key = fieldLookup(r, 'auftragsstatus_gesamt')?.key;
      return key !== 'abgeschlossen' && key !== 'storniert';
    },
    searchFields: ['auftragsnummer', 'kunde_nachname', 'fahrzeugmodell'],
    toItem: a => ({
      id: a.id,
      title: fieldText(a, 'auftragsnummer'),
      subtitle: `${fieldText(a, 'kunde_nachname')} · ${fieldText(a, 'fahrzeugmodell')}`,
      status: fieldLookup(a, 'auftragsstatus_gesamt') ?? undefined,
    }),
    orderby: ['r.v_auftragsnummer asc'],
  });

  // Bestehenden Auftragsstatus-Eintrag für den gewählten Auftrag suchen
  const auftragId = useState<string | null>(null);
  // eslint-disable-next-line prefer-const
  let [pickedAuftragId, setPickedAuftragId] = auftragId;

  const existingStatus = useRecordSearch(servicePort, 'auftragsstatus', {
    filter: pickedAuftragId ? refFilter('fertigungsauftrag', pickedAuftragId) : undefined,
    where: pickedAuftragId
      ? r => {
          const ref = r.fields['fertigungsauftrag'];
          return typeof ref === 'string' && ref.includes(pickedAuftragId!);
        }
      : undefined,
    searchFields: [],
    orderby: ['r.v_letzte_aktualisierung desc'],
  });

  // Das Formular für den Auftragsstatus-Eintrag
  const statusForm = useStepForm('auftragsstatus', {
    steps: {
      gesamtstatus: 2,
      aktuelle_station: 2,
      fertigstellungsgrad_gesamt: 2,
      soll_stunden_status: 3,
      ist_stunden_status: 3,
      verbleibende_stunden: 3,
      offene_aufgaben: 3,
      offene_probleme: 3,
      fehlende_ressourcen: 3,
      voraussichtlicher_abschluss: 3,
      letzte_aktualisierung: 4,
      aktualisiert_vorname: 4,
      aktualisiert_nachname: 4,
      statuskommentar: 4,
      eskalation_erforderlich: 4,
    },
    initial: {
      letzte_aktualisierung: nowIso(),
    },
  });

  // Existierende Datensatz-ID für UPDATE — null bedeutet CREATE
  const [existingStatusId, setExistingStatusId] = useState<string | null>(null);

  const submit = useJourneySubmit(
    servicePort,
    existingStatusId
      ? [
          {
            key: 'auftragsstatus',
            entity: 'auftragsstatus',
            form: statusForm,
            updates: existingStatusId,
            values: { fertigungsauftrag: pickedAuftragId! },
            primary: true,
            verb: 'update',
          },
        ]
      : [
          {
            key: 'auftragsstatus',
            entity: 'auftragsstatus',
            form: statusForm,
            values: { fertigungsauftrag: pickedAuftragId! },
            primary: true,
            verb: 'create',
          },
        ],
    { draftKey: 'auftragsstatus-aktualisieren' }
  );

  const handleAuftragSelect = (id: string) => {
    setPickedAuftragId(id);
    statusForm.set('fertigungsauftrag', id, auftraege.labelOf(id) ?? id);
    // Nach der Auswahl: warten bis existingStatus geladen ist (passiert reaktiv)
    setStep(2);
  };

  // Wenn der Auftrag gewählt und der Status geladen ist: existierende ID merken
  // und Felder vorausfüllen
  const handleStep2Enter = () => {
    if (!existingStatus.select.loading && existingStatus.records.length > 0) {
      const existing = existingStatus.records[0];
      setExistingStatusId(existing.id);
      // Felder des bestehenden Eintrags vorausfüllen
      const fields = existing.fields as Record<string, unknown>;
      const fk = (key: string) => fieldLookup(existing, key)?.key ?? null;
      if (fk('gesamtstatus')) statusForm.set('gesamtstatus', fk('gesamtstatus')!);
      if (fk('aktuelle_station')) statusForm.set('aktuelle_station', fk('aktuelle_station')!);
      if (fields['fertigstellungsgrad_gesamt'] != null)
        statusForm.set('fertigstellungsgrad_gesamt', String(fields['fertigstellungsgrad_gesamt']));
      if (fields['soll_stunden_status'] != null)
        statusForm.set('soll_stunden_status', String(fields['soll_stunden_status']));
      if (fields['ist_stunden_status'] != null)
        statusForm.set('ist_stunden_status', String(fields['ist_stunden_status']));
      if (fields['verbleibende_stunden'] != null)
        statusForm.set('verbleibende_stunden', String(fields['verbleibende_stunden']));
      if (fields['offene_aufgaben'] != null)
        statusForm.set('offene_aufgaben', String(fields['offene_aufgaben']));
      if (fields['offene_probleme'] != null)
        statusForm.set('offene_probleme', String(fields['offene_probleme']));
      if (fields['fehlende_ressourcen'])
        statusForm.set('fehlende_ressourcen', String(fields['fehlende_ressourcen']));
      if (fields['voraussichtlicher_abschluss'])
        statusForm.set('voraussichtlicher_abschluss', String(fields['voraussichtlicher_abschluss']));
      if (fields['statuskommentar'])
        statusForm.set('statuskommentar', String(fields['statuskommentar']));
    } else if (!existingStatus.select.loading) {
      setExistingStatusId(null);
    }
  };

  const restart = () => {
    submit.reset();
    statusForm.reset();
    setPickedAuftragId(null);
    setExistingStatusId(null);
    setStep(1);
  };

  return (
    <IntentWizardShell
      title={tx('Auftragsstatus aktualisieren')}
      currentStep={step}
      onStepChange={setStep}
      forms={[statusForm]}
      draftKey="auftragsstatus-aktualisieren"
      intro={{
        description: tx('Gesamtstatus, Station und Kennzahlen eines Fertigungsauftrags aktuell halten.'),
        needs: [tx('Auftragsnummer oder Kundenname'), tx('Aktuelle Stunden und Fertigstellungsgrad')],
      }}
    >
      {/* Schritt 1: Auftrag wählen */}
      <WizardStep
        label={tx('Auftrag')}
        description={tx('Fertigungsauftrag wählen, dessen Status aktualisiert werden soll.')}
      >
        <EntitySelectStep
          {...auftraege.select}
          selectedId={pickedAuftragId}
          onSelect={handleAuftragSelect}
          searchPlaceholder={tx('Auftragsnummer, Kundenname oder Modell …')}
          emptyText={tx('Keine offenen Aufträge gefunden. Abgeschlossene und stornierte Aufträge sind ausgeblendet.')}
          create={false}
          columns={1}
        />
      </WizardStep>

      {/* Schritt 2: Aktueller Status */}
      <WizardStep
        label={tx('Aktueller Status')}
        description={tx('Gesamtstatus, aktuelle Station und Fertigstellungsgrad angeben.')}
        needs={['fertigungsauftrag']}
      >
        {pickedAuftragId ? (
          <div className="space-y-5">
            {existingStatusId && (
              <p className="text-sm text-muted-foreground bg-secondary rounded-lg px-3 py-2">
                {tx('Bestehender Statuseintrag wird aktualisiert.')}
              </p>
            )}
            <div
              onFocus={handleStep2Enter}
              onPointerDown={handleStep2Enter}
              onClick={handleStep2Enter}
            />
            <Bound form={statusForm} name="gesamtstatus" />
            <Bound form={statusForm} name="aktuelle_station" />
            <Bound form={statusForm} name="fertigstellungsgrad_gesamt" hint={tx('Prozentwert 0–100')} />
            <StepNav
              onBack={() => setStep(1)}
              onNext={() => statusForm.validate(['gesamtstatus', 'aktuelle_station'])}
              nextStepLabel={tx('Stunden & Aufgaben')}
            />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>

      {/* Schritt 3: Stunden & Aufgaben */}
      <WizardStep
        label={tx('Stunden & Aufgaben')}
        description={tx('Stunden, offene Aufgaben und Probleme sowie Ressourcen eintragen.')}
        needs={['gesamtstatus', 'aktuelle_station']}
      >
        {pickedAuftragId ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Bound form={statusForm} name="soll_stunden_status" hint={tx('Stunden')} />
              <Bound form={statusForm} name="ist_stunden_status" hint={tx('Stunden')} />
              <Bound form={statusForm} name="verbleibende_stunden" hint={tx('Stunden')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Bound form={statusForm} name="offene_aufgaben" />
              <Bound form={statusForm} name="offene_probleme" />
            </div>
            <Bound form={statusForm} name="fehlende_ressourcen" rows={3} />
            <Bound form={statusForm} name="voraussichtlicher_abschluss" />
            <StepNav
              onBack={() => setStep(2)}
              onNext={() => true}
              nextStepLabel={tx('Bearbeiter & Kommentar')}
            />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>

      {/* Schritt 4: Bearbeiter & Kommentar */}
      <WizardStep
        label={tx('Bearbeiter & Kommentar')}
        description={tx('Wer aktualisiert den Status, und gibt es einen Kommentar oder Eskalationsbedarf?')}
        needs={['gesamtstatus', 'aktuelle_station']}
      >
        {pickedAuftragId ? (
          <div className="space-y-5">
            <Bound form={statusForm} name="letzte_aktualisierung" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Bound form={statusForm} name="aktualisiert_vorname" />
              <Bound form={statusForm} name="aktualisiert_nachname" />
            </div>
            <Bound form={statusForm} name="statuskommentar" rows={4} />
            <Bound form={statusForm} name="eskalation_erforderlich" />
            <StepNav
              onBack={() => setStep(3)}
              onNext={() =>
                statusForm.validate([
                  'letzte_aktualisierung',
                  'aktualisiert_vorname',
                  'aktualisiert_nachname',
                ])
              }
              nextStepLabel={tx('Prüfen & speichern')}
            />
          </div>
        ) : (
          <StepNav onBack={() => setStep(1)} nextDisabled>
            {tx('Dieser Schritt braucht die Auswahl aus Schritt 1.')}
          </StepNav>
        )}
      </WizardStep>

      {/* Schritt 5: Prüfen & speichern */}
      <WizardStep label={tx('Prüfen')}>
        {!submit.result && (
          <SummaryStep
            forms={[statusForm]}
            submit={submit}
            items={[
              {
                key: '_auftrag',
                label: tx('Auftrag'),
                value: auftraege.labelOf(pickedAuftragId ?? '') ?? pickedAuftragId ?? '—',
                step: 1,
              },
              {
                key: '_modus',
                label: tx('Vorgang'),
                value: existingStatusId ? tx('Bestehender Eintrag wird aktualisiert') : tx('Neuer Statuseintrag wird angelegt'),
              },
            ]}
            whatHappensNext={tx('Der Auftragsstatus ist sofort im Dashboard sichtbar.')}
            confirmLabel={existingStatusId ? tx('Status aktualisieren') : tx('Status anlegen')}
          />
        )}
      </WizardStep>

      {/* Erfolgsschritt */}
      {submit.result && (
        <SuccessStep
          result={submit.result}
          forms={[statusForm]}
          submit={submit}
          restartLabel={tx('Weiteren Auftrag aktualisieren')}
          whatHappensNext={tx('Du kannst jetzt eine Station erfassen oder ein Problem melden.')}
          next={[
            {
              label: tx('Station erfassen'),
              href: '#/intents/stationsprotokoll-erfassen',
            },
            {
              label: tx('Problem melden'),
              href: '#/intents/problem-melden',
            },
            {
              label: tx('Zum Dashboard'),
              href: '#/',
            },
          ]}
          actions={{ copy: true, print: false }}
        />
      )}
    </IntentWizardShell>
  );
}

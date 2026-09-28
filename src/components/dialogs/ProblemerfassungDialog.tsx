/**
 * ProblemerfassungDialog — pre-generated create/edit dialog for Problemerfassung.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * fertigungsauftragList (full hook array — resolves the Fertigungsauftrag applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * ProblemerfassungDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Problemerfassung['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<ProblemerfassungDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Problemerfassung, Fertigungsauftrag, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, uploadFile, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Problemerfassung';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/Combobox';
import { FertigungsauftragDialog } from '@/components/dialogs/FertigungsauftragDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode, dataUriToBlob } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for ProblemerfassungDialog.defaultValues — see file header. */
export type ProblemerfassungDialogDefaults = Omit<Problemerfassung['fields'], 'betroffene_station' | 'problemtyp' | 'auswirkung_termin' | 'problem_status'> & {
    betroffene_station?: LookupValue | string;
    problemtyp?: LookupValue | string;
    auswirkung_termin?: LookupValue | string;
    problem_status?: LookupValue | string;
  };

interface ProblemerfassungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Problemerfassung['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: ProblemerfassungDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  fertigungsauftragList: Fertigungsauftrag[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  betroffene_station: LOOKUP_OPTIONS['problemerfassung']?.['betroffene_station'] ?? [],
  problemtyp: LOOKUP_OPTIONS['problemerfassung']?.['problemtyp'] ?? [],
  auswirkung_termin: LOOKUP_OPTIONS['problemerfassung']?.['auswirkung_termin'] ?? [],
  problem_status: LOOKUP_OPTIONS['problemerfassung']?.['problem_status'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  fertigungsauftrag: APP_IDS.FERTIGUNGSAUFTRAG,
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  for (const [k, appId] of Object.entries(NORMALIZE_APPLOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string' && v !== '' && !v.startsWith('http')) out[k] = createRecordUrl(appId, v);
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' && x !== '' && !x.startsWith('http') ? createRecordUrl(appId, x) : x));
  }
  return out;
}

export function ProblemerfassungDialog({ open, onClose, onSubmit, defaultValues, recordId, fertigungsauftragList, enablePhotoScan = true, enablePhotoLocation = true }: ProblemerfassungDialogProps) {
  const [fields, setFields] = useState<Partial<Problemerfassung['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  // Inline-Create state for "Fertigungsauftrag" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraFertigungsauftrag` list, and select it in
  // the originating Combobox via the captured `createFertigungsauftragField`.
  const [createFertigungsauftragOpen, setCreateFertigungsauftragOpen] = useState(false);
  const [createFertigungsauftragInitial, setCreateFertigungsauftragInitial] = useState('');
  const [createFertigungsauftragField, setCreateFertigungsauftragField] = useState<string>('');
  const [extraFertigungsauftrag, setExtraFertigungsauftrag] = useState< Fertigungsauftrag[]>([]);
  const fertigungsauftragListAll = useMemo(
    () => [...fertigungsauftragList, ...extraFertigungsauftrag],
    [fertigungsauftragList, extraFertigungsauftrag],
  );
  function openCreateFertigungsauftrag(fieldKey: string, q: string) {
    setCreateFertigungsauftragField(fieldKey);
    setCreateFertigungsauftragInitial(q);
    setCreateFertigungsauftragOpen(true);
  }
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['fertigungsauftrag', 'betroffene_station', 'problemtyp', 'problem_datum_zeit', 'problem_beschreibung', 'gemeldet_vorname', 'gemeldet_nachname', 'problem_status'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
      'fertigungsauftrag': fertigungsauftragList,
    },
  }), [fertigungsauftragList, ]);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Problemerfassung['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'problemerfassung');
      await onSubmit(clean as Problemerfassung['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="fertigungsauftrag" entity="Fertigungsauftrag">\n${JSON.stringify(fertigungsauftragList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "fertigungsauftrag": string | null, // Display name from Fertigungsauftrag (see <available-records>)\n  "betroffene_station": LookupValue | null, // Betroffene Station (select one key: "station_1" | "station_2" | "station_3" | "station_4" | "station_5" | "stationsuebergreifend") mapping: station_1=Station 1 – Rohbau / Basisaufbau, station_2=Station 2 – Elektrik / Sanitär, station_3=Station 3 – Innenausbau, station_4=Station 4 – Außenverkleidung / Lackierung, station_5=Station 5 – Endmontage / Qualitätsprüfung, stationsuebergreifend=Stationsübergreifend\n  "problemtyp": LookupValue | null, // Problemtyp (select one key: "verzoegerung" | "fehlender_artikel" | "qualitaetsproblem" | "personalausfall" | "technischer_defekt" | "sonstiges") mapping: verzoegerung=Verzögerung, fehlender_artikel=Fehlender Artikel / Material, qualitaetsproblem=Qualitätsproblem, personalausfall=Personalausfall, technischer_defekt=Technischer Defekt, sonstiges=Sonstiges\n  "problem_datum_zeit": string | null, // YYYY-MM-DDTHH:MM\n  "problem_beschreibung": string | null, // Problembeschreibung\n  "ursache": string | null, // Ursache\n  "auswirkung_termin": LookupValue | null, // Auswirkung auf Fertigstellungstermin (select one key: "keine_auswirkung" | "gering" | "mittel" | "stark") mapping: keine_auswirkung=Keine Auswirkung, gering=Geringe Verzögerung (< 1 Tag), mittel=Mittlere Verzögerung (1–3 Tage), stark=Starke Verzögerung (> 3 Tage)\n  "fehlende_artikel": string | null, // Fehlende Artikel / Materialien\n  "gemeldet_vorname": string | null, // Vorname Melder\n  "gemeldet_nachname": string | null, // Nachname Melder\n  "verantwortlich_vorname": string | null, // Vorname Verantwortlicher\n  "verantwortlich_nachname": string | null, // Nachname Verantwortlicher\n  "loesungsmassnahme": string | null, // Lösungsmaßnahme\n  "problem_status": LookupValue | null, // Problemstatus (select one key: "offen" | "in_klaerung" | "massnahme_eingeleitet" | "behoben" | "eskaliert") mapping: offen=Offen, in_klaerung=In Klärung, massnahme_eingeleitet=Maßnahme eingeleitet, behoben=Behoben, eskaliert=Eskaliert\n  "behoben_datum": string | null, // YYYY-MM-DD\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["fertigungsauftrag"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const fertigungsauftragName = raw['fertigungsauftrag'] as string | null;
        if (fertigungsauftragName) {
          const fertigungsauftragMatch = fertigungsauftragList.find(r => matchName(fertigungsauftragName!, [String(r.fields.auftragsnummer ?? '')]));
          if (fertigungsauftragMatch) merged['fertigungsauftrag'] = createRecordUrl(APP_IDS.FERTIGUNGSAUFTRAG, fertigungsauftragMatch.record_id);
        }
        return merged as Partial<Problemerfassung['fields']>;
      });
      // Upload scanned file to file fields
      if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        try {
          const blob = dataUriToBlob(uri!);
          const fileUrl = await uploadFile(blob, file.name);
          setFields(prev => ({ ...prev, problem_foto: fileUrl }));
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
        }
      }
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues
    ? t('edit_entity', { entity: appLabel('problemerfassung') })
    : t('new_entity', { entity: appLabel('problemerfassung') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'fertigungsauftrag': (
      <div key="fertigungsauftrag" className="space-y-1.5">
        <Label htmlFor="fertigungsauftrag">{fieldLabel('problemerfassung', 'fertigungsauftrag')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="fertigungsauftrag"
          placeholder="Welcher Auftrag ist betroffen?"
          items={fertigungsauftragListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.auftragsnummer ?? r.record_id),
          }))}
          value={extractRecordId(fields.fertigungsauftrag)}
          onChange={id => setFields(f => ({ ...f, fertigungsauftrag: id ? createRecordUrl(APP_IDS.FERTIGUNGSAUFTRAG, id) : undefined }))}
          onCreateNew={(q) => openCreateFertigungsauftrag("fertigungsauftrag", q)}
          createLabel={t('create_in', { entity: appLabel('fertigungsauftrag') })}
        />
        {showErrors && !fields.fertigungsauftrag && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('problemerfassung', 'fertigungsauftrag')}</p>
        )}
      </div>
    ),
    'betroffene_station': (
      <div key="betroffene_station" className="space-y-1.5">
        <Label htmlFor="betroffene_station">{fieldLabel('problemerfassung', 'betroffene_station')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.betroffene_station) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, betroffene_station: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="betroffene_station" className="max-sm:h-11"><SelectValue placeholder="z. B. Station 2 – Elektrik" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="station_1">{lookupLabel('problemerfassung', 'betroffene_station', 'station_1') ?? 'Station 1 – Rohbau / Basisaufbau'}</SelectItem>
            <SelectItem value="station_2">{lookupLabel('problemerfassung', 'betroffene_station', 'station_2') ?? 'Station 2 – Elektrik / Sanitär'}</SelectItem>
            <SelectItem value="station_3">{lookupLabel('problemerfassung', 'betroffene_station', 'station_3') ?? 'Station 3 – Innenausbau'}</SelectItem>
            <SelectItem value="station_4">{lookupLabel('problemerfassung', 'betroffene_station', 'station_4') ?? 'Station 4 – Außenverkleidung / Lackierung'}</SelectItem>
            <SelectItem value="station_5">{lookupLabel('problemerfassung', 'betroffene_station', 'station_5') ?? 'Station 5 – Endmontage / Qualitätsprüfung'}</SelectItem>
            <SelectItem value="stationsuebergreifend">{lookupLabel('problemerfassung', 'betroffene_station', 'stationsuebergreifend') ?? 'Stationsübergreifend'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.betroffene_station && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('problemerfassung', 'betroffene_station')}</p>
        )}
      </div>
    ),
    'problemtyp': (
      <div key="problemtyp" className="space-y-1.5">
        <Label htmlFor="problemtyp">{fieldLabel('problemerfassung', 'problemtyp')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.problemtyp) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, problemtyp: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="problemtyp" className="max-sm:h-11"><SelectValue placeholder="z. B. Verzögerung, Qualitätsproblem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="verzoegerung">{lookupLabel('problemerfassung', 'problemtyp', 'verzoegerung') ?? 'Verzögerung'}</SelectItem>
            <SelectItem value="fehlender_artikel">{lookupLabel('problemerfassung', 'problemtyp', 'fehlender_artikel') ?? 'Fehlender Artikel / Material'}</SelectItem>
            <SelectItem value="qualitaetsproblem">{lookupLabel('problemerfassung', 'problemtyp', 'qualitaetsproblem') ?? 'Qualitätsproblem'}</SelectItem>
            <SelectItem value="personalausfall">{lookupLabel('problemerfassung', 'problemtyp', 'personalausfall') ?? 'Personalausfall'}</SelectItem>
            <SelectItem value="technischer_defekt">{lookupLabel('problemerfassung', 'problemtyp', 'technischer_defekt') ?? 'Technischer Defekt'}</SelectItem>
            <SelectItem value="sonstiges">{lookupLabel('problemerfassung', 'problemtyp', 'sonstiges') ?? 'Sonstiges'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.problemtyp && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('problemerfassung', 'problemtyp')}</p>
        )}
      </div>
    ),
    'problem_datum_zeit': (
      <div key="problem_datum_zeit" className="space-y-1.5">
        <Label htmlFor="problem_datum_zeit">{fieldLabel('problemerfassung', 'problem_datum_zeit')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="problem_datum_zeit"
          placeholder="Wann ist das Problem aufgetreten?"
          mode="datetime"
          value={fields.problem_datum_zeit ?? null}
          onChange={v => setFields(f => ({ ...f, problem_datum_zeit: v ?? undefined }))}
          required
        />
        {showErrors && !fields.problem_datum_zeit && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('problemerfassung', 'problem_datum_zeit')}</p>
        )}
      </div>
    ),
    'problem_beschreibung': (
      <div key="problem_beschreibung" className="space-y-1.5">
        <Label htmlFor="problem_beschreibung">{fieldLabel('problemerfassung', 'problem_beschreibung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="problem_beschreibung"
          placeholder="Was ist passiert? Detaillierte Schilderung..."
          value={fields.problem_beschreibung ?? ''}
          onChange={e => setFields(f => ({ ...f, problem_beschreibung: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.problem_beschreibung && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('problemerfassung', 'problem_beschreibung')}</p>
        )}
      </div>
    ),
    'ursache': (
      <div key="ursache" className="space-y-1.5">
        <Label htmlFor="ursache">{fieldLabel('problemerfassung', 'ursache')}</Label>
        <Textarea
          id="ursache"
          placeholder="Mögliche oder feststehende Ursache..."
          value={fields.ursache ?? ''}
          onChange={e => setFields(f => ({ ...f, ursache: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'auswirkung_termin': (
      <div key="auswirkung_termin" className="space-y-1.5">
        <Label htmlFor="auswirkung_termin">{fieldLabel('problemerfassung', 'auswirkung_termin')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.auswirkung_termin) === 'keine_auswirkung'}
            onClick={() => setFields(f => ({ ...f, auswirkung_termin: (lookupKey(f.auswirkung_termin) === 'keine_auswirkung' ? undefined : 'keine_auswirkung') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.auswirkung_termin) === 'keine_auswirkung'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('problemerfassung', 'auswirkung_termin', 'keine_auswirkung') ?? 'Keine Auswirkung'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.auswirkung_termin) === 'gering'}
            onClick={() => setFields(f => ({ ...f, auswirkung_termin: (lookupKey(f.auswirkung_termin) === 'gering' ? undefined : 'gering') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.auswirkung_termin) === 'gering'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('problemerfassung', 'auswirkung_termin', 'gering') ?? 'Geringe Verzögerung (< 1 Tag)'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.auswirkung_termin) === 'mittel'}
            onClick={() => setFields(f => ({ ...f, auswirkung_termin: (lookupKey(f.auswirkung_termin) === 'mittel' ? undefined : 'mittel') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.auswirkung_termin) === 'mittel'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('problemerfassung', 'auswirkung_termin', 'mittel') ?? 'Mittlere Verzögerung (1–3 Tage)'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.auswirkung_termin) === 'stark'}
            onClick={() => setFields(f => ({ ...f, auswirkung_termin: (lookupKey(f.auswirkung_termin) === 'stark' ? undefined : 'stark') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.auswirkung_termin) === 'stark'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('problemerfassung', 'auswirkung_termin', 'stark') ?? 'Starke Verzögerung (> 3 Tage)'}
          </button>
        </div>
      </div>
    ),
    'fehlende_artikel': (
      <div key="fehlende_artikel" className="space-y-1.5">
        <Label htmlFor="fehlende_artikel">{fieldLabel('problemerfassung', 'fehlende_artikel')}</Label>
        <Textarea
          id="fehlende_artikel"
          placeholder="Artikel oder Materialien, eine pro Zeile"
          value={fields.fehlende_artikel ?? ''}
          onChange={e => setFields(f => ({ ...f, fehlende_artikel: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'gemeldet_vorname': (
      <div key="gemeldet_vorname" className="space-y-1.5">
        <Label htmlFor="gemeldet_vorname">{fieldLabel('problemerfassung', 'gemeldet_vorname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="gemeldet_vorname"
          placeholder="z. B. Thomas"
          value={fields.gemeldet_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, gemeldet_vorname: e.target.value }))}
          required
        />
        {showErrors && !fields.gemeldet_vorname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('problemerfassung', 'gemeldet_vorname')}</p>
        )}
      </div>
    ),
    'gemeldet_nachname': (
      <div key="gemeldet_nachname" className="space-y-1.5">
        <Label htmlFor="gemeldet_nachname">{fieldLabel('problemerfassung', 'gemeldet_nachname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="gemeldet_nachname"
          placeholder="z. B. Weber"
          value={fields.gemeldet_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, gemeldet_nachname: e.target.value }))}
          required
        />
        {showErrors && !fields.gemeldet_nachname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('problemerfassung', 'gemeldet_nachname')}</p>
        )}
      </div>
    ),
    'verantwortlich_vorname': (
      <div key="verantwortlich_vorname" className="space-y-1.5">
        <Label htmlFor="verantwortlich_vorname">{fieldLabel('problemerfassung', 'verantwortlich_vorname')}</Label>
        <Input
          id="verantwortlich_vorname"
          placeholder="z. B. Peter"
          value={fields.verantwortlich_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, verantwortlich_vorname: e.target.value }))}
        />
      </div>
    ),
    'verantwortlich_nachname': (
      <div key="verantwortlich_nachname" className="space-y-1.5">
        <Label htmlFor="verantwortlich_nachname">{fieldLabel('problemerfassung', 'verantwortlich_nachname')}</Label>
        <Input
          id="verantwortlich_nachname"
          placeholder="z. B. Hoffmann"
          value={fields.verantwortlich_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, verantwortlich_nachname: e.target.value }))}
        />
      </div>
    ),
    'loesungsmassnahme': (
      <div key="loesungsmassnahme" className="space-y-1.5">
        <Label htmlFor="loesungsmassnahme">{fieldLabel('problemerfassung', 'loesungsmassnahme')}</Label>
        <Textarea
          id="loesungsmassnahme"
          placeholder="Geplante oder durchgeführte Lösung..."
          value={fields.loesungsmassnahme ?? ''}
          onChange={e => setFields(f => ({ ...f, loesungsmassnahme: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'problem_status': (
      <div key="problem_status" className="space-y-1.5">
        <Label htmlFor="problem_status">{fieldLabel('problemerfassung', 'problem_status')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.problem_status) === 'offen'}
            onClick={() => setFields(f => ({ ...f, problem_status: (lookupKey(f.problem_status) === 'offen' ? undefined : 'offen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.problem_status) === 'offen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('problemerfassung', 'problem_status', 'offen') ?? 'Offen'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.problem_status) === 'in_klaerung'}
            onClick={() => setFields(f => ({ ...f, problem_status: (lookupKey(f.problem_status) === 'in_klaerung' ? undefined : 'in_klaerung') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.problem_status) === 'in_klaerung'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('problemerfassung', 'problem_status', 'in_klaerung') ?? 'In Klärung'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.problem_status) === 'massnahme_eingeleitet'}
            onClick={() => setFields(f => ({ ...f, problem_status: (lookupKey(f.problem_status) === 'massnahme_eingeleitet' ? undefined : 'massnahme_eingeleitet') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.problem_status) === 'massnahme_eingeleitet'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('problemerfassung', 'problem_status', 'massnahme_eingeleitet') ?? 'Maßnahme eingeleitet'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.problem_status) === 'behoben'}
            onClick={() => setFields(f => ({ ...f, problem_status: (lookupKey(f.problem_status) === 'behoben' ? undefined : 'behoben') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.problem_status) === 'behoben'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('problemerfassung', 'problem_status', 'behoben') ?? 'Behoben'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.problem_status) === 'eskaliert'}
            onClick={() => setFields(f => ({ ...f, problem_status: (lookupKey(f.problem_status) === 'eskaliert' ? undefined : 'eskaliert') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.problem_status) === 'eskaliert'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('problemerfassung', 'problem_status', 'eskaliert') ?? 'Eskaliert'}
          </button>
        </div>
        {showErrors && !fields.problem_status && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('problemerfassung', 'problem_status')}</p>
        )}
      </div>
    ),
    'behoben_datum': (
      <div key="behoben_datum" className="space-y-1.5">
        <Label htmlFor="behoben_datum">{fieldLabel('problemerfassung', 'behoben_datum')}</Label>
        <DatePicker
          id="behoben_datum"
          placeholder="Wann wurde das Problem behoben?"
          mode="date"
          value={fields.behoben_datum ?? null}
          onChange={v => setFields(f => ({ ...f, behoben_datum: v ?? undefined }))}
        />
      </div>
    ),
    'problem_foto': (
      <div key="problem_foto" className="space-y-1.5">
        <Label htmlFor="problem_foto">{fieldLabel('problemerfassung', 'problem_foto')}</Label>
        {fields.problem_foto ? (
          <div className="flex items-center gap-3 rounded-lg border p-2">
            <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <IconFileText size={20} className="text-muted-foreground" />
              </div>
              <img
                src={fields.problem_foto}
                alt=""
                className="relative h-full w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate text-foreground">{fields.problem_foto.split("/").pop()}</p>
              <div className="flex gap-2 mt-1">
                <label
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {t('fr_change')}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fileUrl = await uploadFile(file, file.name);
                        setFields(f => ({ ...f, problem_foto: fileUrl }));
                      } catch (err) { console.error('Upload failed:', err); }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setFields(f => ({ ...f, problem_foto: undefined }))}
                >
                  {t('fr_remove')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <IconUpload size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('fr_upload_file')}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fileUrl = await uploadFile(file, file.name);
                  setFields(f => ({ ...f, problem_foto: fileUrl }));
                } catch (err) { console.error('Upload failed:', err); }
              }}
            />
          </label>
        )}
      </div>
    ),
  };
  const orderedFields = applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"fertigungsauftrag": "Fertigungsauftrag", "betroffene_station": "Betroffene Station", "problemtyp": "Problemtyp", "problem_datum_zeit": "Zeitpunkt des Problems", "problem_beschreibung": "Problembeschreibung", "ursache": "Ursache", "auswirkung_termin": "Auswirkung auf Fertigstellungstermin", "fehlende_artikel": "Fehlende Artikel / Materialien", "gemeldet_vorname": "Vorname Melder", "gemeldet_nachname": "Nachname Melder", "verantwortlich_vorname": "Vorname Verantwortlicher", "verantwortlich_nachname": "Nachname Verantwortlicher", "loesungsmassnahme": "Lösungsmaßnahme", "problem_status": "Problemstatus", "behoben_datum": "Behebungsdatum", "problem_foto": "Foto / Dokument zum Problem"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"fertigungsauftrag": {"auftragsnummer": "Auftragsnummer", "auftragsdatum": "Auftragsdatum", "prioritaet": "Priorität", "kunde_vorname": "Vorname Kunde", "kunde_nachname": "Nachname Kunde", "kunde_telefon": "Telefon Kunde", "kunde_email": "E-Mail Kunde", "fahrzeugtyp": "Fahrzeugtyp", "fahrzeugmodell": "Fahrzeugmodell / Bezeichnung", "basisfahrzeug": "Basisfahrzeug", "fahrzeug_laenge": "Fahrzeuglänge (m)", "fahrzeug_gewicht": "Zulässiges Gesamtgewicht (kg)", "geplanter_start": "Geplanter Fertigungsstart", "geplanter_abschluss": "Geplanter Fertigstellungstermin", "projektleiter_nachname": "Nachname Projektleiter", "auftragsstatus_gesamt": "Auftragsstatus", "soll_stunden_gesamt": "Soll-Stunden gesamt", "sonderausstattung": "Sonderausstattung / Kundenwünsche", "bemerkungen": "Weitere Bemerkungen", "projektleiter_vorname": "Vorname Projektleiter"}};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.PROBLEMERFASSUNG} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {createFertigungsauftragOpen && (
      <FertigungsauftragDialog
        open={createFertigungsauftragOpen}
        onClose={() => setCreateFertigungsauftragOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createFertigungsauftragEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Fertigungsauftrag;
            setExtraFertigungsauftrag(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.FERTIGUNGSAUFTRAG, result.id);
            setFields(prev => ({ ...prev, [createFertigungsauftragField]: url } as any));
          }
          setCreateFertigungsauftragOpen(false);
        }}
        defaultValues={createFertigungsauftragInitial
          ? ({ auftragsnummer: createFertigungsauftragInitial } as any)
          : undefined}
      />
    )}
    </>
  );
}
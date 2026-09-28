/**
 * FertigungsauftragDialog — pre-generated create/edit dialog for Fertigungsauftrag.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * FertigungsauftragDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Fertigungsauftrag['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<FertigungsauftragDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Fertigungsauftrag, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Fertigungsauftrag';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for FertigungsauftragDialog.defaultValues — see file header. */
export type FertigungsauftragDialogDefaults = Omit<Fertigungsauftrag['fields'], 'prioritaet' | 'fahrzeugtyp' | 'auftragsstatus_gesamt'> & {
    prioritaet?: LookupValue | string;
    fahrzeugtyp?: LookupValue | string;
    auftragsstatus_gesamt?: LookupValue | string;
  };

interface FertigungsauftragDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Fertigungsauftrag['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: FertigungsauftragDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  prioritaet: LOOKUP_OPTIONS['fertigungsauftrag']?.['prioritaet'] ?? [],
  fahrzeugtyp: LOOKUP_OPTIONS['fertigungsauftrag']?.['fahrzeugtyp'] ?? [],
  auftragsstatus_gesamt: LOOKUP_OPTIONS['fertigungsauftrag']?.['auftragsstatus_gesamt'] ?? [],
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  return out;
}

export function FertigungsauftragDialog({ open, onClose, onSubmit, defaultValues, recordId, enablePhotoScan = true, enablePhotoLocation = true }: FertigungsauftragDialogProps) {
  const [fields, setFields] = useState<Partial<Fertigungsauftrag['fields']>>({});
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
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['auftragsnummer', 'auftragsdatum', 'prioritaet', 'kunde_vorname', 'kunde_nachname', 'fahrzeugtyp', 'fahrzeugmodell', 'basisfahrzeug', 'geplanter_start', 'geplanter_abschluss', 'projektleiter_nachname', 'auftragsstatus_gesamt', 'projektleiter_vorname'] as const;
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
    },
  }), []);
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
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Fertigungsauftrag['fields']>);
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
      const clean = cleanFieldsForApi(merged, 'fertigungsauftrag');
      await onSubmit(clean as Fertigungsauftrag['fields']);
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
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "auftragsnummer": string | null, // Auftragsnummer\n  "auftragsdatum": string | null, // YYYY-MM-DD\n  "prioritaet": LookupValue | null, // Priorität (select one key: "normal" | "hoch" | "dringend") mapping: normal=Normal, hoch=Hoch, dringend=Dringend\n  "kunde_vorname": string | null, // Vorname Kunde\n  "kunde_nachname": string | null, // Nachname Kunde\n  "kunde_telefon": string | null, // Telefon Kunde\n  "kunde_email": string | null, // E-Mail Kunde\n  "fahrzeugtyp": LookupValue | null, // Fahrzeugtyp (select one key: "alkoven" | "teilintegriert" | "vollintegriert" | "kastenwagen" | "pickup_aufbau") mapping: alkoven=Alkoven, teilintegriert=Teilintegriert, vollintegriert=Vollintegriert, kastenwagen=Kastenwagen, pickup_aufbau=Pickup-Aufbau\n  "fahrzeugmodell": string | null, // Fahrzeugmodell / Bezeichnung\n  "basisfahrzeug": string | null, // Basisfahrzeug\n  "fahrzeug_laenge": number | null, // Fahrzeuglänge (m)\n  "fahrzeug_gewicht": number | null, // Zulässiges Gesamtgewicht (kg)\n  "geplanter_start": string | null, // YYYY-MM-DD\n  "geplanter_abschluss": string | null, // YYYY-MM-DD\n  "projektleiter_nachname": string | null, // Nachname Projektleiter\n  "auftragsstatus_gesamt": LookupValue | null, // Auftragsstatus (select one key: "neu" | "in_planung" | "in_fertigung" | "qualitaetspruefung" | "abgeschlossen" | "storniert") mapping: neu=Neu, in_planung=In Planung, in_fertigung=In Fertigung, qualitaetspruefung=Qualitätsprüfung, abgeschlossen=Abgeschlossen, storniert=Storniert\n  "soll_stunden_gesamt": number | null, // Soll-Stunden gesamt\n  "sonderausstattung": string | null, // Sonderausstattung / Kundenwünsche\n  "bemerkungen": string | null, // Weitere Bemerkungen\n  "projektleiter_vorname": string | null, // Vorname Projektleiter\n}`;
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
        for (const [k, v] of Object.entries(raw)) {
          if (v != null) merged[k] = v;
        }
        return merged as Partial<Fertigungsauftrag['fields']>;
      });
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
    ? t('edit_entity', { entity: appLabel('fertigungsauftrag') })
    : t('new_entity', { entity: appLabel('fertigungsauftrag') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'auftragsnummer': (
      <div key="auftragsnummer" className="space-y-1.5">
        <Label htmlFor="auftragsnummer">{fieldLabel('fertigungsauftrag', 'auftragsnummer')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="auftragsnummer"
          placeholder="z. B. FA-2026-001"
          value={fields.auftragsnummer ?? ''}
          onChange={e => setFields(f => ({ ...f, auftragsnummer: e.target.value }))}
          required
        />
        {showErrors && !fields.auftragsnummer && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'auftragsnummer')}</p>
        )}
      </div>
    ),
    'auftragsdatum': (
      <div key="auftragsdatum" className="space-y-1.5">
        <Label htmlFor="auftragsdatum">{fieldLabel('fertigungsauftrag', 'auftragsdatum')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="auftragsdatum"
          placeholder="Datum des Auftragseingangs"
          mode="date"
          value={fields.auftragsdatum ?? null}
          onChange={v => setFields(f => ({ ...f, auftragsdatum: v ?? undefined }))}
          required
        />
        {showErrors && !fields.auftragsdatum && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'auftragsdatum')}</p>
        )}
      </div>
    ),
    'prioritaet': (
      <div key="prioritaet" className="space-y-1.5">
        <Label htmlFor="prioritaet">{fieldLabel('fertigungsauftrag', 'prioritaet')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'normal'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'normal' ? undefined : 'normal') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'normal'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('fertigungsauftrag', 'prioritaet', 'normal') ?? 'Normal'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'hoch'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'hoch' ? undefined : 'hoch') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'hoch'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('fertigungsauftrag', 'prioritaet', 'hoch') ?? 'Hoch'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'dringend'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'dringend' ? undefined : 'dringend') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'dringend'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('fertigungsauftrag', 'prioritaet', 'dringend') ?? 'Dringend'}
          </button>
        </div>
        {showErrors && !fields.prioritaet && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'prioritaet')}</p>
        )}
      </div>
    ),
    'kunde_vorname': (
      <div key="kunde_vorname" className="space-y-1.5">
        <Label htmlFor="kunde_vorname">{fieldLabel('fertigungsauftrag', 'kunde_vorname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="kunde_vorname"
          placeholder="z. B. Hans"
          value={fields.kunde_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, kunde_vorname: e.target.value }))}
          required
        />
        {showErrors && !fields.kunde_vorname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'kunde_vorname')}</p>
        )}
      </div>
    ),
    'kunde_nachname': (
      <div key="kunde_nachname" className="space-y-1.5">
        <Label htmlFor="kunde_nachname">{fieldLabel('fertigungsauftrag', 'kunde_nachname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="kunde_nachname"
          placeholder="z. B. Müller"
          value={fields.kunde_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, kunde_nachname: e.target.value }))}
          required
        />
        {showErrors && !fields.kunde_nachname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'kunde_nachname')}</p>
        )}
      </div>
    ),
    'kunde_telefon': (
      <div key="kunde_telefon" className="space-y-1.5">
        <Label htmlFor="kunde_telefon">{fieldLabel('fertigungsauftrag', 'kunde_telefon')}</Label>
        <Input
          id="kunde_telefon"
          type="tel"
          inputMode="tel"
          placeholder=""
          value={fields.kunde_telefon ?? ''}
          onChange={e => setFields(f => ({ ...f, kunde_telefon: e.target.value }))}
        />
      </div>
    ),
    'kunde_email': (
      <div key="kunde_email" className="space-y-1.5">
        <Label htmlFor="kunde_email">{fieldLabel('fertigungsauftrag', 'kunde_email')}</Label>
        <Input
          id="kunde_email"
          type="email"
          inputMode="email"
          placeholder="z. B. hans@beispiel.de"
          value={fields.kunde_email ?? ''}
          onChange={e => setFields(f => ({ ...f, kunde_email: e.target.value }))}
        />
      </div>
    ),
    'fahrzeugtyp': (
      <div key="fahrzeugtyp" className="space-y-1.5">
        <Label htmlFor="fahrzeugtyp">{fieldLabel('fertigungsauftrag', 'fahrzeugtyp')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.fahrzeugtyp) === 'alkoven'}
            onClick={() => setFields(f => ({ ...f, fahrzeugtyp: (lookupKey(f.fahrzeugtyp) === 'alkoven' ? undefined : 'alkoven') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.fahrzeugtyp) === 'alkoven'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('fertigungsauftrag', 'fahrzeugtyp', 'alkoven') ?? 'Alkoven'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.fahrzeugtyp) === 'teilintegriert'}
            onClick={() => setFields(f => ({ ...f, fahrzeugtyp: (lookupKey(f.fahrzeugtyp) === 'teilintegriert' ? undefined : 'teilintegriert') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.fahrzeugtyp) === 'teilintegriert'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('fertigungsauftrag', 'fahrzeugtyp', 'teilintegriert') ?? 'Teilintegriert'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.fahrzeugtyp) === 'vollintegriert'}
            onClick={() => setFields(f => ({ ...f, fahrzeugtyp: (lookupKey(f.fahrzeugtyp) === 'vollintegriert' ? undefined : 'vollintegriert') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.fahrzeugtyp) === 'vollintegriert'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('fertigungsauftrag', 'fahrzeugtyp', 'vollintegriert') ?? 'Vollintegriert'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.fahrzeugtyp) === 'kastenwagen'}
            onClick={() => setFields(f => ({ ...f, fahrzeugtyp: (lookupKey(f.fahrzeugtyp) === 'kastenwagen' ? undefined : 'kastenwagen') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.fahrzeugtyp) === 'kastenwagen'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('fertigungsauftrag', 'fahrzeugtyp', 'kastenwagen') ?? 'Kastenwagen'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.fahrzeugtyp) === 'pickup_aufbau'}
            onClick={() => setFields(f => ({ ...f, fahrzeugtyp: (lookupKey(f.fahrzeugtyp) === 'pickup_aufbau' ? undefined : 'pickup_aufbau') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.fahrzeugtyp) === 'pickup_aufbau'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('fertigungsauftrag', 'fahrzeugtyp', 'pickup_aufbau') ?? 'Pickup-Aufbau'}
          </button>
        </div>
        {showErrors && !fields.fahrzeugtyp && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'fahrzeugtyp')}</p>
        )}
      </div>
    ),
    'fahrzeugmodell': (
      <div key="fahrzeugmodell" className="space-y-1.5">
        <Label htmlFor="fahrzeugmodell">{fieldLabel('fertigungsauftrag', 'fahrzeugmodell')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="fahrzeugmodell"
          placeholder="z. B. WM-Luxury 750"
          value={fields.fahrzeugmodell ?? ''}
          onChange={e => setFields(f => ({ ...f, fahrzeugmodell: e.target.value }))}
          required
        />
        {showErrors && !fields.fahrzeugmodell && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'fahrzeugmodell')}</p>
        )}
      </div>
    ),
    'basisfahrzeug': (
      <div key="basisfahrzeug" className="space-y-1.5">
        <Label htmlFor="basisfahrzeug">{fieldLabel('fertigungsauftrag', 'basisfahrzeug')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="basisfahrzeug"
          placeholder="z. B. Mercedes Sprinter"
          value={fields.basisfahrzeug ?? ''}
          onChange={e => setFields(f => ({ ...f, basisfahrzeug: e.target.value }))}
          required
        />
        {showErrors && !fields.basisfahrzeug && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'basisfahrzeug')}</p>
        )}
      </div>
    ),
    'fahrzeug_laenge': (
      <div key="fahrzeug_laenge" className="space-y-1.5">
        <Label htmlFor="fahrzeug_laenge">{fieldLabel('fertigungsauftrag', 'fahrzeug_laenge')}</Label>
        <Input
          id="fahrzeug_laenge"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'fahrzeug_laenge')}
          placeholder="z. B. 7,5"
          value={fields.fahrzeug_laenge !== undefined ? fields.fahrzeug_laenge : (computedValues['fahrzeug_laenge'] ?? '')}
          onChange={e => setFields(f => ({ ...f, fahrzeug_laenge: clampNumberValue(formEnhancements, 'fahrzeug_laenge', e.target.value) }))}
        />
      </div>
    ),
    'fahrzeug_gewicht': (
      <div key="fahrzeug_gewicht" className="space-y-1.5">
        <Label htmlFor="fahrzeug_gewicht">{fieldLabel('fertigungsauftrag', 'fahrzeug_gewicht')}</Label>
        <Input
          id="fahrzeug_gewicht"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'fahrzeug_gewicht')}
          placeholder="z. B. 3500"
          value={fields.fahrzeug_gewicht !== undefined ? fields.fahrzeug_gewicht : (computedValues['fahrzeug_gewicht'] ?? '')}
          onChange={e => setFields(f => ({ ...f, fahrzeug_gewicht: clampNumberValue(formEnhancements, 'fahrzeug_gewicht', e.target.value) }))}
        />
      </div>
    ),
    'geplanter_start': (
      <div key="geplanter_start" className="space-y-1.5">
        <Label htmlFor="geplanter_start">{fieldLabel('fertigungsauftrag', 'geplanter_start')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="geplanter_start"
          placeholder="Wann soll die Fertigung starten?"
          mode="date"
          value={fields.geplanter_start ?? null}
          onChange={v => setFields(f => ({ ...f, geplanter_start: v ?? undefined }))}
          required
        />
        {showErrors && !fields.geplanter_start && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'geplanter_start')}</p>
        )}
      </div>
    ),
    'geplanter_abschluss': (
      <div key="geplanter_abschluss" className="space-y-1.5">
        <Label htmlFor="geplanter_abschluss">{fieldLabel('fertigungsauftrag', 'geplanter_abschluss')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="geplanter_abschluss"
          placeholder="Fertigstellungstermin"
          mode="date"
          value={fields.geplanter_abschluss ?? null}
          onChange={v => setFields(f => ({ ...f, geplanter_abschluss: v ?? undefined }))}
          required
        />
        {showErrors && !fields.geplanter_abschluss && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'geplanter_abschluss')}</p>
        )}
      </div>
    ),
    'projektleiter_nachname': (
      <div key="projektleiter_nachname" className="space-y-1.5">
        <Label htmlFor="projektleiter_nachname">{fieldLabel('fertigungsauftrag', 'projektleiter_nachname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="projektleiter_nachname"
          placeholder="z. B. Schmidt"
          value={fields.projektleiter_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, projektleiter_nachname: e.target.value }))}
          required
        />
        {showErrors && !fields.projektleiter_nachname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'projektleiter_nachname')}</p>
        )}
      </div>
    ),
    'auftragsstatus_gesamt': (
      <div key="auftragsstatus_gesamt" className="space-y-1.5">
        <Label htmlFor="auftragsstatus_gesamt">{fieldLabel('fertigungsauftrag', 'auftragsstatus_gesamt')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.auftragsstatus_gesamt) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, auftragsstatus_gesamt: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="auftragsstatus_gesamt" className="max-sm:h-11"><SelectValue placeholder="z. B. Neu, In Fertigung" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="neu">{lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', 'neu') ?? 'Neu'}</SelectItem>
            <SelectItem value="in_planung">{lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', 'in_planung') ?? 'In Planung'}</SelectItem>
            <SelectItem value="in_fertigung">{lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', 'in_fertigung') ?? 'In Fertigung'}</SelectItem>
            <SelectItem value="qualitaetspruefung">{lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', 'qualitaetspruefung') ?? 'Qualitätsprüfung'}</SelectItem>
            <SelectItem value="abgeschlossen">{lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', 'abgeschlossen') ?? 'Abgeschlossen'}</SelectItem>
            <SelectItem value="storniert">{lookupLabel('fertigungsauftrag', 'auftragsstatus_gesamt', 'storniert') ?? 'Storniert'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.auftragsstatus_gesamt && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'auftragsstatus_gesamt')}</p>
        )}
      </div>
    ),
    'soll_stunden_gesamt': (
      <div key="soll_stunden_gesamt" className="space-y-1.5">
        <Label htmlFor="soll_stunden_gesamt">{fieldLabel('fertigungsauftrag', 'soll_stunden_gesamt')}</Label>
        <Input
          id="soll_stunden_gesamt"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'soll_stunden_gesamt')}
          placeholder="z. B. 480"
          value={fields.soll_stunden_gesamt !== undefined ? fields.soll_stunden_gesamt : (computedValues['soll_stunden_gesamt'] ?? '')}
          onChange={e => setFields(f => ({ ...f, soll_stunden_gesamt: clampNumberValue(formEnhancements, 'soll_stunden_gesamt', e.target.value) }))}
        />
      </div>
    ),
    'sonderausstattung': (
      <div key="sonderausstattung" className="space-y-1.5">
        <Label htmlFor="sonderausstattung">{fieldLabel('fertigungsauftrag', 'sonderausstattung')}</Label>
        <Textarea
          id="sonderausstattung"
          placeholder="Spezialausstattungen, Kundenwünsche, Extras..."
          value={fields.sonderausstattung ?? ''}
          onChange={e => setFields(f => ({ ...f, sonderausstattung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'bemerkungen': (
      <div key="bemerkungen" className="space-y-1.5">
        <Label htmlFor="bemerkungen">{fieldLabel('fertigungsauftrag', 'bemerkungen')}</Label>
        <Textarea
          id="bemerkungen"
          placeholder="Hinweise zur Fertigung, besondere Anforderungen..."
          value={fields.bemerkungen ?? ''}
          onChange={e => setFields(f => ({ ...f, bemerkungen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'projektleiter_vorname': (
      <div key="projektleiter_vorname" className="space-y-1.5">
        <Label htmlFor="projektleiter_vorname">{fieldLabel('fertigungsauftrag', 'projektleiter_vorname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="projektleiter_vorname"
          placeholder="z. B. Robert"
          value={fields.projektleiter_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, projektleiter_vorname: e.target.value }))}
          required
        />
        {showErrors && !fields.projektleiter_vorname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('fertigungsauftrag', 'projektleiter_vorname')}</p>
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
  const FIELD_LABELS: Record<string, string> = {"auftragsnummer": "Auftragsnummer", "auftragsdatum": "Auftragsdatum", "prioritaet": "Priorität", "kunde_vorname": "Vorname Kunde", "kunde_nachname": "Nachname Kunde", "kunde_telefon": "Telefon Kunde", "kunde_email": "E-Mail Kunde", "fahrzeugtyp": "Fahrzeugtyp", "fahrzeugmodell": "Fahrzeugmodell / Bezeichnung", "basisfahrzeug": "Basisfahrzeug", "fahrzeug_laenge": "Fahrzeuglänge (m)", "fahrzeug_gewicht": "Zulässiges Gesamtgewicht (kg)", "geplanter_start": "Geplanter Fertigungsstart", "geplanter_abschluss": "Geplanter Fertigstellungstermin", "projektleiter_nachname": "Nachname Projektleiter", "auftragsstatus_gesamt": "Auftragsstatus", "soll_stunden_gesamt": "Soll-Stunden gesamt", "sonderausstattung": "Sonderausstattung / Kundenwünsche", "bemerkungen": "Weitere Bemerkungen", "projektleiter_vorname": "Vorname Projektleiter"};
  const CURRENCY_KEYS = new Set<string>(["fahrzeug_gewicht", "soll_stunden_gesamt"]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {};
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
                <AttachmentsSection appId={APP_IDS.FERTIGUNGSAUFTRAG} recordId={recordId} />
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
    </>
  );
}
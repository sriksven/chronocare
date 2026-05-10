import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { adminAddPatient, type AdminAddResponse } from '../lib/api';
import { DEMO_PATIENTS } from '../lib/patients';

const SAMPLE_BUNDLE = `{
  "resourceType": "Bundle",
  "type": "transaction",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "11111111-2222-3333-4444-555555555555",
        "name": [{ "family": "Sample", "given": ["New"] }],
        "birthDate": "1970-01-01",
        "gender": "female"
      },
      "request": { "method": "POST", "url": "Patient" }
    }
  ]
}`;

export default function Admin() {
  const [adminKey, setAdminKey] = useState('');
  const [authed, setAuthed] = useState(false);
  const [bundleText, setBundleText] = useState('');
  const [fhirUrl, setFhirUrl] = useState('https://hapi.fhir.org/baseR4');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AdminAddResponse | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('chronocare-admin-key');
    if (stored) {
      setAdminKey(stored);
      setAuthed(true);
    }
  }, []);

  function saveKey() {
    if (!adminKey.trim()) return;
    localStorage.setItem('chronocare-admin-key', adminKey.trim());
    setAuthed(true);
  }

  function clearKey() {
    localStorage.removeItem('chronocare-admin-key');
    setAdminKey('');
    setAuthed(false);
    setResult(null);
  }

  async function handleSubmit() {
    setParseError(null);
    setResult(null);

    let bundle: object;
    try {
      bundle = JSON.parse(bundleText);
    } catch (e: any) {
      setParseError(`JSON parse error: ${e?.message ?? e}`);
      return;
    }

    setSubmitting(true);
    try {
      const r = await adminAddPatient(adminKey, bundle, fhirUrl.trim());
      setResult(r);
    } catch (e: any) {
      setResult({ ok: false, error: `network error: ${e?.message || e}` });
    } finally {
      setSubmitting(false);
    }
  }

  function loadSample() {
    setBundleText(SAMPLE_BUNDLE);
    setResult(null);
    setParseError(null);
  }

  function clearForm() {
    setBundleText('');
    setResult(null);
    setParseError(null);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    setBundleText(text);
    setResult(null);
    setParseError(null);
  }

  if (!authed) {
    return (
      <div className="max-w-[520px] mx-auto px-8 py-32">
        <div className="eyebrow mb-4">Admin access</div>
        <h1 className="font-serif text-[40px] leading-[1.05] tracking-tightest font-bold mb-4">
          Restricted area
        </h1>
        <p className="text-[15px] text-ink-2 mb-8 leading-[1.6]">
          The admin dashboard lets you add new patients to the demo. Enter the admin key
          (set as the <code className="font-mono text-[13px] bg-rule px-1.5 py-0.5 rounded-sm">ADMIN_KEY</code> env var on Railway).
          The key is stored locally in your browser only.
        </p>
        <div className="border border-rule bg-paper rounded-sm p-6">
          <label className="block text-[10px] uppercase tracking-widest text-muted font-semibold mb-2">
            Admin key
          </label>
          <input
            value={adminKey}
            onChange={e => setAdminKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && saveKey()}
            type="password"
            className="w-full px-4 py-3 bg-bg border border-rule rounded-sm font-mono text-[13px] focus:outline-none focus:border-teal-deep mb-4"
            placeholder="paste admin key…"
          />
          <button onClick={saveKey} className="btn-primary w-full justify-center">
            Continue →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <section className="max-w-[1100px] mx-auto px-8 pt-24 pb-8">
        <div className="flex items-baseline justify-between mb-6">
          <div className="eyebrow">Admin dashboard</div>
          <button onClick={clearKey} className="text-[12px] text-muted hover:text-ink link-underline">
            Sign out
          </button>
        </div>
        <h1 className="font-serif text-[48px] md:text-[64px] leading-[0.98] tracking-tightest font-bold mb-6">
          Manage demo patients.
        </h1>
        <p className="text-[16px] text-ink-2 leading-[1.6] max-w-[640px] mb-12">
          Upload a FHIR R4 transaction Bundle. The server validates it, rewrites POST entries to
          PUT (preserving your IDs), and uploads to the configured FHIR server.
        </p>
      </section>

      <section className="max-w-[1100px] mx-auto px-8 pb-12">
        <div className="border border-rule bg-paper rounded-sm p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="eyebrow">FHIR R4 transaction Bundle</div>
            <div className="flex gap-3 items-center text-[12px]">
              <label className="text-teal-deep cursor-pointer hover:underline">
                Upload .json
                <input type="file" accept=".json,application/json" onChange={handleFile} className="hidden" />
              </label>
              <span className="text-muted">·</span>
              <button onClick={loadSample} className="text-teal-deep hover:underline">
                Insert sample
              </button>
              <span className="text-muted">·</span>
              <button onClick={clearForm} className="text-muted hover:text-ink">
                Clear
              </button>
            </div>
          </div>
          <textarea
            value={bundleText}
            onChange={e => setBundleText(e.target.value)}
            disabled={submitting}
            className="w-full h-[280px] px-4 py-3 bg-bg border border-rule rounded-sm font-mono text-[12px] leading-[1.5] focus:outline-none focus:border-teal-deep transition-colors resize-y"
            placeholder='Paste a FHIR R4 transaction Bundle JSON here…'
          />

          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end mt-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted font-semibold mb-2">
                Target FHIR server
              </label>
              <input
                value={fhirUrl}
                onChange={e => setFhirUrl(e.target.value)}
                disabled={submitting}
                className="w-full px-4 py-3 bg-bg border border-rule rounded-sm font-mono text-[13px] focus:outline-none focus:border-teal-deep transition-colors"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting || !bundleText.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {submitting ? 'Uploading…' : 'Add patient'}
              <span aria-hidden>→</span>
            </button>
          </div>

          {parseError && (
            <div className="mt-5 p-4 border-l-2 border-risk-high bg-risk-high/5 text-risk-high text-[13px] rounded-sm">
              {parseError}
            </div>
          )}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-6"
            >
              {result.ok ? (
                <div className="border-l-4 border-risk-low bg-paper border border-rule rounded-sm p-6">
                  <div className="text-[10px] uppercase tracking-widest text-risk-low font-bold mb-2">
                    Upload successful
                  </div>
                  <div className="font-serif text-[22px] font-bold tracking-tighter mb-3">
                    {result.name}
                  </div>
                  <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-[13px]">
                    <div className="flex gap-3">
                      <dt className="text-muted w-24">Patient ID</dt>
                      <dd className="font-mono text-[12px]">{result.patient_id}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-muted w-24">FHIR server</dt>
                      <dd className="font-mono text-[12px] truncate">{result.fhir_base_url}</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-muted w-24">Entries</dt>
                      <dd>{result.entries_uploaded} / {result.entries_total} uploaded</dd>
                    </div>
                    <div className="flex gap-3">
                      <dt className="text-muted w-24">PUT rewrites</dt>
                      <dd>{result.post_to_put_rewrites}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 text-[12px] text-muted">
                    To make this patient visible in the picker, add an entry to{' '}
                    <code className="font-mono text-[11px] bg-rule px-1.5 py-0.5 rounded-sm">frontend/src/lib/patients.ts</code>{' '}
                    and rebuild.
                  </div>
                </div>
              ) : (
                <div className="border-l-4 border-risk-high bg-paper border border-rule rounded-sm p-6">
                  <div className="text-[10px] uppercase tracking-widest text-risk-high font-bold mb-2">
                    Upload failed
                  </div>
                  <div className="font-mono text-[13px] text-ink-2">{result.error}</div>
                  {result.body && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-[12px] text-muted">Server response</summary>
                      <pre className="mt-2 text-[11px] font-mono text-ink-2 bg-bg p-3 rounded-sm overflow-auto whitespace-pre-wrap">{result.body}</pre>
                    </details>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Existing patients */}
      <section className="max-w-[1100px] mx-auto px-8 pb-32">
        <div className="eyebrow mb-4">Currently registered patients</div>
        <p className="text-[14px] text-muted mb-6">
          Static catalog from <code className="font-mono text-[12px]">frontend/src/lib/patients.ts</code>.
          Newly uploaded patients won't appear here until added to the catalog and the frontend is rebuilt.
        </p>
        <div className="border border-rule bg-paper rounded-sm divide-y divide-rule">
          {DEMO_PATIENTS.map(p => (
            <div key={p.id} className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-4 px-6 py-4 items-center">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-[12px] text-muted font-mono">{p.id}</div>
              </div>
              <div className="text-[13px] text-ink-2">{p.story}</div>
              <a
                href={`https://hapi.fhir.org/baseR4/Patient/${p.id}`}
                target="_blank"
                rel="noopener"
                className="text-[12px] text-teal-deep link-underline whitespace-nowrap"
              >
                View on FHIR ↗
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

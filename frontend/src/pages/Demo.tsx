import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PIPELINE_STEPS,
  playBrief,
  runAnalysis,
  type ToolTrace,
  type UnifiedBrief,
} from '../lib/api';
import { DEMO_PATIENTS } from '../lib/patients';

type StepStatus = 'pending' | 'active' | 'done' | 'error';

export default function Demo() {
  const [patientId, setPatientId] = useState(DEMO_PATIENTS[0].id);
  const [fhirUrl, setFhirUrl] = useState('https://hapi.fhir.org/baseR4');
  const [running, setRunning] = useState(false);
  const [stepStatus, setStepStatus] = useState<Record<string, StepStatus>>({});
  const [brief, setBrief] = useState<UnifiedBrief | null>(null);
  const [trace, setTrace] = useState<ToolTrace[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setBrief(null);
    setTrace(null);

    // Simulate progressive ticking through pipeline steps
    const initStatus: Record<string, StepStatus> = {};
    PIPELINE_STEPS.forEach(s => (initStatus[s.tool] = 'pending'));
    setStepStatus(initStatus);

    let currentIdx = 0;
    setStepStatus(s => ({ ...s, [PIPELINE_STEPS[0].tool]: 'active' }));
    const tickTimer = setInterval(() => {
      setStepStatus(prev => {
        if (currentIdx >= PIPELINE_STEPS.length - 1) return prev;
        const next = { ...prev };
        next[PIPELINE_STEPS[currentIdx].tool] = 'done';
        currentIdx += 1;
        next[PIPELINE_STEPS[currentIdx].tool] = 'active';
        return next;
      });
    }, 2400);

    try {
      const result = await runAnalysis(patientId.trim(), fhirUrl.trim());
      clearInterval(tickTimer);

      // Replace simulated status with real results
      const realStatus: Record<string, StepStatus> = {};
      PIPELINE_STEPS.forEach(s => (realStatus[s.tool] = 'pending'));
      (result.trace || []).forEach(t => {
        realStatus[t.tool] = t.ok ? 'done' : 'error';
      });
      setStepStatus(realStatus);

      if (!result.ok) {
        setError(result.error || 'Pipeline failed.');
      } else {
        setBrief(result.brief || null);
        setTrace(result.trace || null);
      }
    } catch (e: any) {
      clearInterval(tickTimer);
      setError(`${e?.message || 'Network error'}. Server may be cold-starting, retry in 30s.`);
    } finally {
      setRunning(false);
    }
  }

  function reset() {
    setBrief(null);
    setTrace(null);
    setError(null);
    setStepStatus({});
  }

  return (
    <div>
      <section className="max-w-[1100px] mx-auto px-8 pt-24 pb-8">
        <div className="eyebrow mb-6">Live demo</div>
        <h1 className="font-serif text-[48px] md:text-[64px] leading-[0.98] tracking-tightest font-bold mb-6">
          Run analysis on a patient.
        </h1>
        <p className="text-[16px] text-ink-2 leading-[1.6] max-w-[640px] mb-10">
          Hits the live MCP server on Railway. The 13-step pipeline runs server-side; the UI
          shows each tool's status as it completes. The 13-step reasoning pipeline runs server-side. Total wall time: <strong>25-35 seconds.</strong>
        </p>
      </section>

      {/* Quick-copy patient IDs */}
      <section className="max-w-[1100px] mx-auto px-8 pb-6">
        <details className="group">
          <summary className="cursor-pointer flex items-center gap-3 text-[12px] text-muted hover:text-ink list-none">
            <span className="eyebrow">Quick reference: patient IDs</span>
            <span className="text-muted group-open:rotate-90 transition-transform">›</span>
          </summary>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px]">
            {DEMO_PATIENTS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigator.clipboard?.writeText(p.id)}
                className="text-left flex items-center justify-between gap-3 px-3 py-2 bg-paper border border-rule rounded-sm hover:border-teal-deep transition-colors group/btn"
                title="Click to copy ID"
              >
                <span className="font-medium text-ink-2 whitespace-nowrap">
                  {p.name} <span className="text-muted font-normal">({p.age}, {p.sex})</span>
                </span>
                <span className="font-mono text-[10px] text-muted truncate">
                  {p.id}
                  <span className="text-teal-deep ml-2 opacity-0 group-hover/btn:opacity-100">⧉</span>
                </span>
              </button>
            ))}
          </div>
        </details>
      </section>

      <section className="max-w-[1100px] mx-auto px-8 pb-12">
        <div className="border border-rule bg-paper rounded-sm p-8">
          <div className="mb-6">
            <label className="block text-[10px] uppercase tracking-widest text-muted font-semibold mb-3">
              Choose a demo patient
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {DEMO_PATIENTS.map(p => {
                const selected = p.id === patientId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => !running && setPatientId(p.id)}
                    disabled={running}
                    className={`text-left p-4 border rounded-sm transition-all ${
                      selected
                        ? 'border-teal-deep bg-teal-soft/40 ring-1 ring-teal-deep/20'
                        : 'border-rule bg-bg hover:border-ink-3 hover:bg-paper'
                    } ${running ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-baseline justify-between gap-3 mb-1">
                      <div className="font-serif text-[18px] font-bold tracking-tighter">{p.name}</div>
                      <div className="text-[12px] text-muted whitespace-nowrap">
                        {p.age} / {p.sex}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {p.conditions.map(c => (
                        <span
                          key={c}
                          className="text-[10px] uppercase tracking-widest font-semibold text-teal-deep bg-teal-soft px-2 py-0.5 rounded-sm"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div className="text-[13px] text-ink-2 leading-[1.5]">{p.story}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end pt-6 border-t border-rule">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted font-semibold mb-2">
                Patient ID (FHIR)
              </label>
              <input
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                disabled={running}
                className="w-full px-4 py-3 bg-bg border border-rule rounded-sm font-mono text-[13px] focus:outline-none focus:border-teal-deep transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-muted font-semibold mb-2">
                FHIR Server
              </label>
              <input
                value={fhirUrl}
                onChange={e => setFhirUrl(e.target.value)}
                disabled={running}
                className="w-full px-4 py-3 bg-bg border border-rule rounded-sm font-mono text-[13px] focus:outline-none focus:border-teal-deep transition-colors"
              />
            </div>
            <button
              onClick={handleRun}
              disabled={running}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {running ? 'Running…' : 'Run analysis'}
              <span aria-hidden>→</span>
            </button>
          </div>

          {(running || Object.keys(stepStatus).length > 0) && (
            <div className="mt-8 pt-8 border-t border-rule">
              <div className="eyebrow mb-4">Pipeline trace</div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1.5">
                {PIPELINE_STEPS.map((s, i) => {
                  const status = stepStatus[s.tool] || 'pending';
                  const traceItem = trace?.find(t => t.tool === s.tool);
                  return (
                    <li
                      key={s.tool}
                      className={`flex items-center gap-3 text-[13px] py-1 ${
                        status === 'done'
                          ? 'text-ink'
                          : status === 'active'
                          ? 'text-ink font-medium'
                          : status === 'error'
                          ? 'text-risk-high'
                          : 'text-muted'
                      }`}
                    >
                      <StepIcon status={status} />
                      <span className="font-mono text-[10px] text-muted w-5">{String(i + 1).padStart(2, '0')}</span>
                      <span className="flex-1">{s.label}</span>
                      {traceItem?.latency_ms !== undefined && (
                        <span className="font-mono text-[11px] text-muted">
                          {traceItem.latency_ms}ms
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {error && (
            <div className="mt-6 p-4 border-l-2 border-risk-high bg-risk-high/5 text-risk-high text-[13px] rounded-sm">
              {error}
            </div>
          )}
        </div>
      </section>

      <AnimatePresence>
        {brief && (
          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-[1100px] mx-auto px-8 pb-32"
          >
            <BriefView brief={brief} trace={trace} onReset={reset} />
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done') {
    return (
      <span className="inline-flex w-4 h-4 items-center justify-center text-risk-low font-bold">
        ✓
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex w-4 h-4 items-center justify-center text-risk-high font-bold">
        ✗
      </span>
    );
  }
  if (status === 'active') {
    return (
      <span className="inline-flex w-3 h-3 rounded-full border-2 border-teal-deep border-t-transparent animate-spin" />
    );
  }
  return <span className="inline-block w-1.5 h-1.5 rounded-full bg-rule" />;
}

function BriefView({
  brief,
  trace,
  onReset,
}: {
  brief: UnifiedBrief;
  trace: ToolTrace[] | null;
  onReset: () => void;
}) {
  const p = brief.patient_summary || {};
  const ew = brief.early_warning || {};
  const risk = (ew.risk_level || 'unknown').toLowerCase();
  const riskColors: Record<string, string> = {
    low: 'bg-risk-low/10 text-risk-low',
    medium: 'bg-risk-med/10 text-risk-med',
    high: 'bg-risk-high/10 text-risk-high',
    emergent: 'bg-risk-high/15 text-risk-high',
    unknown: 'bg-rule text-muted',
  };

  // Voice playback state
  const [voiceState, setVoiceState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const [voiceError, setVoiceError] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleListen() {
    if (voiceState === 'playing') {
      audioRef.current?.pause();
      audioRef.current = null;
      setVoiceState('idle');
      return;
    }
    setVoiceState('loading');
    setVoiceError('');
    try {
      const r = await playBrief(brief);
      if (!r.ok || !r.supported || !r.audio_bytes) {
        setVoiceState('error');
        setVoiceError(r.error || 'Voice synthesis unavailable on the server');
        return;
      }
      const audioBlob = base64ToBlob(r.audio_bytes, 'audio/mpeg');
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      audio.onended = () => {
        setVoiceState('idle');
        URL.revokeObjectURL(url);
        audioRef.current = null;
      };
      audio.onerror = () => {
        setVoiceState('error');
        setVoiceError('Audio playback failed');
        URL.revokeObjectURL(url);
      };
      audioRef.current = audio;
      await audio.play();
      setVoiceState('playing');
    } catch (e: any) {
      setVoiceState('error');
      setVoiceError(e?.message || 'Network error');
    }
  }

  return (
    <div>
      <div className="border border-rule bg-paper rounded-sm p-8 border-l-4 border-l-teal-deep mb-6">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="font-serif text-[36px] font-bold tracking-tighter">{p.name || '-'}</div>
            <div className="flex flex-wrap gap-x-8 gap-y-1 text-[13px] text-muted mt-2">
              <span>DOB <strong className="text-ink font-medium">{p.birth_date || '-'}</strong></span>
              <span>Sex <strong className="text-ink font-medium">{p.gender || '-'}</strong></span>
              <span className="font-mono">{p.id || '-'}</span>
            </div>
          </div>
          <button
            onClick={handleListen}
            disabled={voiceState === 'loading'}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-sm border text-[13px] font-medium transition-all ${
              voiceState === 'playing'
                ? 'bg-teal-deep text-bg border-teal-deep'
                : 'border-teal-deep text-teal-deep hover:bg-teal-deep hover:text-bg'
            } ${voiceState === 'loading' ? 'opacity-60 cursor-wait' : ''}`}
            title="Invokes the text_to_speech_brief MCP tool (the optional 14th tool)"
          >
            {voiceState === 'loading' ? (
              <>
                <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                Synthesizing...
              </>
            ) : voiceState === 'playing' ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <rect x="3" y="3" width="3" height="8" />
                  <rect x="8" y="3" width="3" height="8" />
                </svg>
                Stop
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                  <path d="M7 1a3 3 0 0 0-3 3v3a3 3 0 1 0 6 0V4a3 3 0 0 0-3-3zM3 7a4 4 0 0 0 8 0M7 11v2M5 13h4" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </svg>
                Listen to brief
              </>
            )}
          </button>
        </div>
        {voiceState === 'error' && (
          <div className="mt-3 text-[12px] text-risk-high">{voiceError}</div>
        )}
        {voiceState === 'playing' && (
          <div className="mt-3 text-[11px] uppercase tracking-widest text-muted">
            playing via text_to_speech_brief, OpenAI TTS
          </div>
        )}
      </div>

      {/* At-a-glance metrics row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat
          label="Risk level"
          value={(brief.early_warning?.risk_level || 'unknown')}
          tone={
            risk === 'low' ? 'low' : risk === 'medium' ? 'med' : risk === 'high' || risk === 'emergent' ? 'high' : 'neutral'
          }
        />
        <Stat
          label="Turning points"
          value={String((brief.turning_points || []).length)}
        />
        <Stat
          label="Recommendations"
          value={String((brief.recommendations || []).length)}
        />
        <Stat
          label="Guideline matches"
          value={String((brief.guideline_matches || []).length)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 mb-6">
        <Card title="Clinical narrative">
          <div className="font-serif text-[17px] leading-[1.7] text-ink-2 space-y-3">
            {(brief.clinical_narrative || '-').split(/\n\n+/).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </Card>
        <div className="border border-rule bg-paper rounded-sm overflow-hidden">
          <div className="p-7">
            <div className="eyebrow mb-3">Early warning</div>
            <span className={`inline-block px-3 py-1 rounded-sm text-[11px] uppercase tracking-widest font-bold ${riskColors[risk]}`}>
              {risk}
            </span>
            <div className="font-serif text-[17px] leading-[1.55] text-ink-2 mt-4">
              {ew.summary || 'No summary generated.'}
            </div>
          </div>
          <dl className="border-t border-rule p-7 grid grid-cols-[auto_1fr] gap-y-2 gap-x-4 text-[13px]">
            <dt className="text-[10px] uppercase tracking-widest text-muted font-semibold pt-1">Trend</dt>
            <dd>{ew.trend_direction || '-'}</dd>
            <dt className="text-[10px] uppercase tracking-widest text-muted font-semibold pt-1">Time</dt>
            <dd>{ew.time_sensitivity || '-'}</dd>
            <dt className="text-[10px] uppercase tracking-widest text-muted font-semibold pt-1">Signals</dt>
            <dd className="font-mono text-[12px]">
              {(ew.key_signals || []).length ? (ew.key_signals || []).join(', ') : '-'}
            </dd>
            <dt className="text-[10px] uppercase tracking-widest text-muted font-semibold pt-1">Monitor</dt>
            <dd>{ew.recommended_monitoring || '-'}</dd>
          </dl>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-6 mb-6">
        <Card title="Clinical turning points">
          {(brief.turning_points || []).length === 0 ? (
            <div className="text-muted text-[14px]">No turning points identified.</div>
          ) : (
            <div className="divide-y divide-rule">
              {(brief.turning_points || []).map((t, i) => (
                <div key={i} className="py-4 first:pt-0 last:pb-0">
                  <div className="font-mono text-[12px] text-teal-deep tracking-wider mb-1">{t.date}</div>
                  <div className="font-medium text-[15px] mb-1">{t.event}</div>
                  <div className="text-[14px] text-ink-2 leading-[1.6]">{t.significance}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card title="Recommendations">
          {(brief.recommendations || []).length === 0 ? (
            <div className="text-muted text-[14px]">No recommendations generated.</div>
          ) : (
            <div className="space-y-3">
              {(brief.recommendations || []).map((r, i) => {
                const u = (r.urgency || 'routine').toLowerCase();
                const uColors: Record<string, string> = {
                  routine: 'bg-rule text-ink-2',
                  urgent: 'bg-risk-med/15 text-risk-med',
                  emergent: 'bg-risk-high/12 text-risk-high',
                };
                return (
                  <div key={i} className="border border-rule p-4 rounded-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-[15px] text-teal-deep">{r.priority ?? i + 1}</span>
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm ${uColors[u]}`}>
                        {r.urgency || 'routine'}
                      </span>
                    </div>
                    <div className="font-medium text-[14px] mb-1">{r.action}</div>
                    {r.rationale && <div className="text-[13px] text-ink-2 leading-[1.55]">{r.rationale}</div>}
                    {r.specific_finding && (
                      <div className="font-mono text-[11px] text-muted mt-2 px-2 py-1 bg-bg rounded-sm">
                        {r.specific_finding}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-6 mb-6">
        <Card title="Causal hypothesis">
          <div className="font-serif text-[16px] leading-[1.65] text-ink-2">
            {brief.causal_hypothesis || 'No causal hypothesis generated.'}
          </div>
        </Card>
        <Card title="Guideline matches">
          {(brief.guideline_matches || []).length === 0 ? (
            <div className="text-muted text-[14px]">No guideline matches.</div>
          ) : (
            <div className="divide-y divide-rule">
              {(brief.guideline_matches || []).map((g, i) => {
                const s = (g.current_status || 'unknown').toLowerCase();
                const c =
                  s === 'met'
                    ? 'bg-risk-low/10 text-risk-low'
                    : s === 'gap'
                    ? 'bg-risk-high/10 text-risk-high'
                    : 'bg-rule text-muted';
                return (
                  <div key={i} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[11px] text-teal-deep">{g.guideline}</span>
                      <span className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm ${c}`}>
                        {g.current_status || 'unknown'}
                      </span>
                    </div>
                    <div className="text-[14px] mt-1 text-ink-2">{g.recommendation}</div>
                    {g.note && <div className="text-[12px] text-muted mt-1">{g.note}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <Card title="Comorbidity interactions">
        {(brief.comorbidity_map || []).length === 0 ? (
          <div className="text-muted text-[14px]">No comorbidity interactions identified for this patient.</div>
        ) : (
          <div className="divide-y divide-rule">
            {(brief.comorbidity_map || []).map((c, i) => {
              const s = (c.clinical_significance || 'unknown').toLowerCase();
              const cls =
                s === 'high'
                  ? 'bg-risk-high/10 text-risk-high'
                  : s === 'medium'
                  ? 'bg-risk-med/10 text-risk-med'
                  : 'bg-rule text-muted';
              return (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-[11px] text-teal-deep">
                      {c.condition_a} ↔ {c.condition_b}
                    </span>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded-sm ${cls}`}>
                      {c.clinical_significance || 'unknown'}
                    </span>
                  </div>
                  <div className="text-[14px] mt-1 text-ink-2">{c.interaction}</div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {trace && (
        <details className="mt-6">
          <summary className="cursor-pointer eyebrow py-3 border-t border-rule">
            Tool execution trace, raw timing data
          </summary>
          <div className="font-mono text-[12px] py-3 grid grid-cols-[auto_1fr_auto] gap-x-4 gap-y-1">
            {trace.map((t, i) => (
              <div key={i} className="contents">
                <span className={t.ok ? 'text-risk-low' : 'text-risk-high'}>{t.ok ? '✓' : '✗'}</span>
                <span>{t.tool}</span>
                <span className="text-muted">{t.latency_ms}ms</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="mt-12 text-center">
        <button onClick={onReset} className="text-[13px] text-muted hover:text-ink link-underline">
          Run again with a different patient
        </button>
      </div>
    </div>
  );
}

function base64ToBlob(b64: string, mime: string): Blob {
  const byteString = atob(b64);
  const buffer = new ArrayBuffer(byteString.length);
  const arr = new Uint8Array(buffer);
  for (let i = 0; i < byteString.length; i++) arr[i] = byteString.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-rule bg-paper rounded-sm p-7">
      <div className="eyebrow mb-3">{title}</div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'low' | 'med' | 'high' | 'neutral';
}) {
  const toneClass: Record<string, string> = {
    low: 'border-l-risk-low',
    med: 'border-l-risk-med',
    high: 'border-l-risk-high',
    neutral: 'border-l-teal-deep',
  };
  return (
    <div className={`bg-paper border border-rule border-l-2 ${toneClass[tone]} rounded-sm px-5 py-4`}>
      <div className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-1">{label}</div>
      <div className="font-serif text-[28px] font-bold tracking-tighter capitalize">{value}</div>
    </div>
  );
}

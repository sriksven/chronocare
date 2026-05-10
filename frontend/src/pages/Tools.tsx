import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TOOLS = [
  { num: '01', name: 'get_full_patient_history', engine: 'FHIR', phase: 'Reconstruct', desc: 'Parallel-fetches Patient + 6 resource types from a FHIR R4 server. Normalizes LOINC, ICD-10, and RxNorm codes. Returns a flat, sorted event timeline.' },
  { num: '02', name: 'order_events_chronologically', engine: 'Pure Python', phase: 'Reconstruct', desc: 'Sorts and dedupes the timeline by date. No LLM — deterministic.' },
  { num: '03', name: 'identify_clinical_turning_points', engine: 'Llama-3.3-70b', phase: 'Reconstruct', desc: '3–5 inflection moments where the trajectory changed: HTN diagnosed, eGFR crossed 60, dose adjusted. With dates and rationale.' },
  { num: '04', name: 'generate_patient_narrative', engine: 'GPT-4o', phase: 'Reconstruct', desc: '200–300 word clinical narrative — the "story" handoff a clinician would tell a colleague. Cites specific dates and labs.' },
  { num: '05', name: 'get_recent_signals', engine: 'Pure Python', phase: 'Detect', desc: 'Filters timeline to events within the past N days (default 90). Sets the window for deterioration analysis.' },
  { num: '06', name: 'analyze_weak_patterns', engine: 'GPT-4o', phase: 'Detect', desc: 'The core AI step. Holistic multi-signal reasoning — looks at BP, creatinine, BMI, HbA1c together, not one at a time. Catches drift that thresholds miss.' },
  { num: '07', name: 'generate_early_warning_report', engine: 'Llama-3.3-70b', phase: 'Detect', desc: 'Formalizes pattern analysis into a structured risk report: risk_level, key_signals, trend_direction, time_sensitivity.' },
  { num: '08', name: 'correlate_events', engine: 'Llama-3.3-70b', phase: 'Explain', desc: 'Identifies plausible causal pairs across the timeline: "uncontrolled HTN 2021 → CKD diagnosis 2022."' },
  { num: '09', name: 'generate_causal_hypothesis', engine: 'GPT-4o', phase: 'Explain', desc: '~150-word causal narrative synthesized from the top correlations. Explains the trajectory.' },
  { num: '10', name: 'map_comorbidities', engine: 'Llama-3.3-70b', phase: 'Recommend', desc: 'Maps interactions between active conditions: HTN ↔ CKD acceleration, T2DM ↔ HTN compounding effects.' },
  { num: '11', name: 'match_clinical_guidelines', engine: 'GPT-4o-mini', phase: 'Recommend', desc: 'Cross-checks the patient profile against ADA, JNC, KDIGO, ACC/AHA. Flags actions per guideline as met or gap.' },
  { num: '12', name: 'generate_recommendations', engine: 'GPT-4o', phase: 'Recommend', desc: '3–5 patient-specific actions with priority, urgency, rationale, and the specific finding that triggered it.' },
  { num: '13', name: 'generate_unified_brief', engine: 'Pure Python', phase: 'Synthesize', desc: 'Assembles all prior outputs into the final structured brief (schema v1.0). No LLM — deterministic JSON assembly.' },
  { num: '14', name: 'text_to_speech_brief', engine: 'OpenAI TTS', phase: 'Voice', desc: 'Optional. Renders selected brief sections to speech. OpenAI TTS primary (uses existing key), Google Cloud TTS as fallback.' },
];

const phaseColor: Record<string, string> = {
  Reconstruct: 'bg-teal-soft text-teal-deep',
  Detect: 'bg-[#fdf6e7] text-[#a86c14]',
  Explain: 'bg-[#f4eedd] text-[#7a5e1a]',
  Recommend: 'bg-[#ecdfd2] text-[#774e2a]',
  Synthesize: 'bg-[#d9d2c5] text-[#3d3d3d]',
  Voice: 'bg-[#e8e8f5] text-[#3d4a8a]',
};

export default function Tools() {
  return (
    <div>
      <section className="max-w-[1100px] mx-auto px-8 pt-24 pb-12">
        <div className="eyebrow mb-6">The catalog</div>
        <h1 className="font-serif text-[56px] md:text-[72px] leading-[0.98] tracking-tightest font-bold mb-8 max-w-[900px]">
          Fourteen tools.
          <br />
          <em className="text-teal-deep">Each does one thing well.</em>
        </h1>
        <p className="text-[18px] text-ink-2 leading-[1.6] max-w-[720px] mb-12">
          Every tool is exposed via the Model Context Protocol over Streamable HTTP. Authentication
          via the <span className="font-mono text-[15px]">X-ChronoCare-Key</span> header. Live
          schemas are served from the running MCP server at{' '}
          <a
            href="https://attractive-ambition-production-5fd7.up.railway.app/mcp/"
            target="_blank"
            rel="noopener"
            className="text-teal-deep link-underline"
          >
            /mcp/
          </a>
          .
        </p>
      </section>

      <section className="max-w-[1100px] mx-auto px-8 pb-24">
        <div className="space-y-3">
          {TOOLS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: Math.min(i * 0.025, 0.4) }}
              className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 border border-rule bg-paper p-6 rounded-sm"
            >
              <div className="md:col-span-1 font-mono text-[26px] text-teal-deep tracking-tighter">
                {t.num}
              </div>
              <div className="md:col-span-4">
                <div className="font-mono text-[14px] font-medium text-ink mb-2">{t.name}</div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm ${phaseColor[t.phase] || 'bg-rule text-ink-2'}`}>
                    {t.phase}
                  </span>
                  <span className="text-[11px] text-muted font-mono">{t.engine}</span>
                </div>
              </div>
              <div className="md:col-span-7 text-[14px] text-ink-2 leading-[1.65]">{t.desc}</div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="border-t border-rule bg-paper">
        <div className="max-w-[1100px] mx-auto px-8 py-20 text-center">
          <p className="font-serif text-[32px] tracking-tighter font-bold mb-6">
            Run all 13 reasoning tools on a patient.
          </p>
          <Link to="/demo" className="btn-primary text-[15px]">
            Try the live demo
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

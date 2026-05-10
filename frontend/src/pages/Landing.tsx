import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="grain">
      {/* HERO */}
      <section className="max-w-[1200px] mx-auto px-8 pt-28 pb-32 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="eyebrow mb-8">A clinical reasoning engine · Built for Agents Assemble</div>
          <h1 className="font-serif text-[64px] md:text-[88px] leading-[0.95] tracking-tightest font-bold max-w-[1000px]">
            Understand the past.
            <br />
            <span className="italic text-teal-deep">Prevent the future.</span>
          </h1>
          <p className="mt-10 text-[19px] md:text-[20px] text-ink-2 leading-[1.55] max-w-[680px] font-medium">
            ChronoCare reconstructs a patient's full medical story across years of FHIR data
            and detects silent deterioration that thresholds miss — synthesizing an
            evidence-grounded clinical brief in under 35 seconds.
          </p>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link to="/demo" className="btn-primary">
              Try the live demo
              <span aria-hidden>→</span>
            </Link>
            <Link to="/how" className="btn-secondary">See how it works</Link>
          </div>
        </motion.div>

        {/* FLOATING METRICS */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
          className="mt-32 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-rule pt-12"
        >
          {[
            { num: '13', label: 'MCP tools chained' },
            { num: '8', label: 'LLM reasoning calls' },
            { num: '54', label: 'FHIR events analyzed' },
            { num: '<35s', label: 'end-to-end latency' },
          ].map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="font-serif text-[42px] font-bold tracking-tightest">{m.num}</div>
              <div className="text-xs uppercase tracking-widest text-muted mt-1">{m.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* THE PROBLEM */}
      <section className="border-t border-rule">
        <div className="max-w-[1200px] mx-auto px-8 py-32">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
            <div className="md:col-span-4">
              <div className="eyebrow mb-4">The problem</div>
              <h2 className="font-serif text-[40px] leading-[1.05] tracking-tighter font-bold">
                Modern EHRs answer
                <br />
                <em className="text-teal-deep">"what is happening"</em>
                <br />
                — not <em>"what has been"</em>
                <br />
                — and not <em>"what's coming."</em>
              </h2>
            </div>
            <div className="md:col-span-7 md:col-start-6 space-y-10">
              <div>
                <div className="font-serif italic text-[22px] leading-[1.45] text-ink-2 mb-3">
                  "Every individual reading was within reference range — but the trajectory was
                  catastrophic."
                </div>
                <p className="text-[15px] text-muted leading-[1.65] max-w-md">
                  A patient's creatinine drifts from 0.9 → 1.3 mg/dL over 36 months. Each lab is
                  flagged "normal." The slope is invisible.
                </p>
              </div>
              <div>
                <div className="font-serif italic text-[22px] leading-[1.45] text-ink-2 mb-3">
                  "Hypertension diagnosed in 2019 became Stage 2 CKD by 2022."
                </div>
                <p className="text-[15px] text-muted leading-[1.65] max-w-md">
                  Three different clinicians saw three snapshots. None saw the cascade.
                </p>
              </div>
              <div>
                <div className="font-serif italic text-[22px] leading-[1.45] text-ink-2 mb-3">
                  "The chart has the answer. No one has time to read it."
                </div>
                <p className="text-[15px] text-muted leading-[1.65] max-w-md">
                  Hundreds of FHIR resources. A 12-minute visit. A reasoning gap that gets paid in
                  late diagnoses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* THE PIPELINE — the wow visual */}
      <section className="border-t border-rule bg-paper">
        <div className="max-w-[1200px] mx-auto px-8 py-32">
          <div className="eyebrow mb-4">How it works</div>
          <h2 className="font-serif text-[44px] md:text-[56px] leading-[1.02] tracking-tighter font-bold mb-6 max-w-[800px]">
            One prompt. Thirteen tools. Eight reasoning steps. One brief.
          </h2>
          <p className="text-[17px] text-ink-2 max-w-[640px] leading-[1.6] mb-16">
            A clinician asks for analysis. ChronoCore — an A2A agent on Prompt Opinion — chains
            our MCP server's tools in deliberate sequence. Each step's output feeds the next.
          </p>

          <PipelineFlow />

          <div className="mt-16 flex justify-center">
            <Link to="/how" className="text-sm font-medium text-teal-deep link-underline">
              Read the full architecture →
            </Link>
          </div>
        </div>
      </section>

      {/* WHAT YOU GET */}
      <section className="border-t border-rule">
        <div className="max-w-[1200px] mx-auto px-8 py-32">
          <div className="eyebrow mb-4">What you get</div>
          <h2 className="font-serif text-[44px] leading-[1.05] tracking-tighter font-bold mb-16 max-w-[700px]">
            A clinical brief that cites <em className="text-teal-deep">specific dates</em> and
            <em className="text-teal-deep"> specific values</em>.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                t: 'Patient narrative',
                d: '200–300 word clinical story with cited dates and labs. No generic summaries.',
                tag: 'GPT-4o',
              },
              {
                t: 'Early warning',
                d: 'Holistic multi-signal pattern detection. Catches drift across BP, creatinine, BMI together.',
                tag: 'GPT-4o',
              },
              {
                t: 'Turning points',
                d: '3–5 inflection moments where the trajectory changed. With dates and rationale.',
                tag: 'Llama-3.3',
              },
              {
                t: 'Causal hypothesis',
                d: 'Plausible cause-effect chains across the chronological timeline.',
                tag: 'GPT-4o',
              },
              {
                t: 'Guideline gaps',
                d: 'Cross-checks ADA, JNC, KDIGO, ACC/AHA. Flags missed actions per guideline.',
                tag: 'GPT-4o-mini',
              },
              {
                t: 'Recommendations',
                d: '3–5 patient-specific actions with priority, urgency, and the finding that triggered it.',
                tag: 'GPT-4o',
              },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="border border-rule p-8 bg-paper rounded-sm"
              >
                <div className="text-xs uppercase tracking-widest text-muted mb-3">{c.tag}</div>
                <div className="font-serif text-[24px] font-bold tracking-tighter mb-3">{c.t}</div>
                <div className="text-[14px] text-ink-2 leading-[1.6]">{c.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT WITH */}
      <section className="border-t border-rule bg-paper">
        <div className="max-w-[1200px] mx-auto px-8 py-24">
          <div className="eyebrow mb-10 text-center">Built on</div>
          <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 font-serif text-[28px] text-ink-2 tracking-tighter font-bold">
            <span>MCP</span>
            <span className="text-rule">·</span>
            <span>A2A</span>
            <span className="text-rule">·</span>
            <span>FHIR R4</span>
            <span className="text-rule">·</span>
            <span>OpenAI</span>
            <span className="text-rule">·</span>
            <span>Groq</span>
            <span className="text-rule">·</span>
            <span>Prompt Opinion</span>
            <span className="text-rule">·</span>
            <span>Railway</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-rule">
        <div className="max-w-[1200px] mx-auto px-8 py-32 text-center">
          <h2 className="font-serif text-[56px] md:text-[80px] leading-[0.95] tracking-tightest font-bold mb-8">
            See it analyze
            <br />
            <em className="text-teal-deep">a real patient.</em>
          </h2>
          <p className="text-[17px] text-ink-2 max-w-[520px] mx-auto leading-[1.55] mb-12">
            John Doe, 62, hypertension diagnosed 2019, CKD progressing. Live FHIR data, live LLM
            reasoning, live result.
          </p>
          <Link to="/demo" className="btn-primary text-[16px] px-8 py-4">
            Run analysis
            <span aria-hidden>→</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

function PipelineFlow() {
  const stages: { phase: string; tools: string[]; tint: string }[] = [
    { phase: 'Reconstruct', tools: ['get_full_patient_history', 'order_events_chronologically', 'identify_clinical_turning_points', 'generate_patient_narrative'], tint: 'bg-teal-soft' },
    { phase: 'Detect', tools: ['get_recent_signals', 'analyze_weak_patterns', 'generate_early_warning_report'], tint: 'bg-[#fdf6e7]' },
    { phase: 'Explain', tools: ['correlate_events', 'generate_causal_hypothesis'], tint: 'bg-[#f4eedd]' },
    { phase: 'Recommend', tools: ['map_comorbidities', 'match_clinical_guidelines', 'generate_recommendations'], tint: 'bg-[#ecdfd2]' },
    { phase: 'Synthesize', tools: ['generate_unified_brief'], tint: 'bg-[#d9d2c5]' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {stages.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          className={`border border-rule p-6 rounded-sm ${s.tint}`}
        >
          <div className="text-xs uppercase tracking-widest text-ink-2 font-semibold mb-4">
            {String(i + 1).padStart(2, '0')} · {s.phase}
          </div>
          <ul className="space-y-2">
            {s.tools.map(t => (
              <li key={t} className="font-mono text-[11px] text-ink-2">
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}

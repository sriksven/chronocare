import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="grain">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rule">
        {/* Backdrop is absolute and constrained to the right half */}
        <div className="absolute inset-y-0 right-0 w-full md:w-[55%] pointer-events-none">
          <HeroBackdrop />
        </div>

        <div className="max-w-[1200px] mx-auto px-8 pt-24 pb-28 relative z-10">
          {/* Top status row */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 mb-12"
          >
            <span className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold text-risk-low bg-risk-low/10 px-3 py-1.5 rounded-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-risk-low animate-pulse" />
              live system
            </span>
            <span className="eyebrow">a clinical reasoning engine for FHIR</span>
          </motion.div>

          {/* Headline — staggered word-by-word reveal */}
          <h1 className="font-serif text-[60px] md:text-[92px] leading-[0.96] tracking-tightest font-bold max-w-[900px]">
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              Understand the past.
            </motion.span>
            <motion.span
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="block"
            >
              <span className="highlight delay-2">Prevent the future.</span>
            </motion.span>
          </h1>

          {/* Body — three short statements */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.6 }}
            className="mt-12 max-w-[600px] space-y-3 text-[18px] md:text-[19px] text-ink-2 leading-[1.5] font-medium"
          >
            <p>
              <span className="text-teal-deep font-semibold">Reconstruct</span>{' '}
              a patient's full medical story across years of FHIR data.
            </p>
            <p>
              <span className="text-teal-deep font-semibold">Detect</span>{' '}
              silent deterioration that thresholds miss.
            </p>
            <p>
              <span className="text-teal-deep font-semibold">Deliver</span>{' '}
              an evidence-grounded clinical brief in 35 seconds.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-3"
          >
            <Link to="/demo" className="btn-primary">
              Try the live demo
              <span aria-hidden>→</span>
            </Link>
            <Link to="/how" className="btn-secondary">See how it works</Link>
            <span className="hidden md:inline-block text-[12px] text-muted ml-3">
              25 to 35 seconds end-to-end
            </span>
          </motion.div>

          {/* Floating metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0, duration: 1 }}
            className="mt-24 grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-8 border-t border-rule pt-10 max-w-[920px]"
          >
            {METRICS.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 + i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="font-serif text-[42px] font-bold tracking-tightest text-ink">
                  {m.num}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted mt-1 font-semibold">
                  {m.tooltip ? (
                    <span className="tip">
                      {m.label}
                      <span className="tip-body">{m.tooltip}</span>
                    </span>
                  ) : (
                    m.label
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="border-t border-rule relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto px-8 py-32 relative">
          <div className="max-w-[920px] mb-20">
            <div className="eyebrow mb-6">The problem</div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="font-serif text-[44px] md:text-[68px] leading-[1.02] tracking-tighter font-bold"
            >
              EHRs answer one question.
              <br />
              They <span className="highlight">miss two</span>.
            </motion.h2>
          </div>

          <ThreeTenses />

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="mt-16 max-w-[680px] font-serif text-[20px] md:text-[22px] leading-[1.5] text-ink-2"
          >
            ChronoCare fills the two missing tenses. It reconstructs the past
            from FHIR data and projects the future from weak-signal patterns
            today's thresholds miss.
          </motion.p>
        </div>
      </section>

      {/* THE PIPELINE */}
      <section className="border-t border-rule bg-paper">
        <div className="max-w-[1200px] mx-auto px-8 py-32">
          <div className="eyebrow mb-4">How it works</div>
          <h2 className="font-serif text-[44px] md:text-[56px] leading-[1.02] tracking-tighter font-bold mb-6 max-w-[800px]">
            One prompt. Thirteen tools. Eight reasoning steps. One brief.
          </h2>
          <p className="text-[17px] text-ink-2 max-w-[640px] leading-[1.6] mb-16">
            A clinician asks for analysis. ChronoCore (an A2A agent on Prompt Opinion)
            chains our MCP server's tools in deliberate sequence. Each step's output
            feeds the next.
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
          <h2 className="font-serif text-[44px] leading-[1.05] tracking-tighter font-bold mb-16 max-w-[800px]">
            A clinical brief that cites <span className="highlight">specific dates</span> and{' '}
            <span className="highlight delay-2">specific values</span>.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {OUTPUTS.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="border border-rule p-8 bg-paper rounded-sm hover:border-teal-deep transition-colors"
              >
                <div className="text-xs uppercase tracking-widest text-muted mb-3">{c.tag}</div>
                <div className="font-serif text-[24px] font-bold tracking-tighter mb-3">{c.t}</div>
                <div className="text-[14px] text-ink-2 leading-[1.6]">{c.d}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BUILT ON */}
      <section className="border-t border-rule bg-paper">
        <div className="max-w-[1200px] mx-auto px-8 py-24">
          <div className="eyebrow mb-12 text-center">Built on</div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-x-2 gap-y-10 items-center justify-items-center">
            {BUILT_ON.map((b, i) => (
              <motion.div
                key={b.name}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="flex flex-col items-center"
                title={b.tag}
              >
                <div className="font-serif text-[24px] font-bold tracking-tighter text-ink-2 hover:text-teal-deep transition-colors">
                  {b.name}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-muted mt-1">{b.tag}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-rule">
        <div className="max-w-[1200px] mx-auto px-8 py-32 text-center">
          <h2 className="font-serif text-[56px] md:text-[80px] leading-[0.95] tracking-tightest font-bold mb-8">
            See it analyze
            <br />
            <span className="highlight delay-2">a real patient.</span>
          </h2>
          <p className="text-[17px] text-ink-2 max-w-[520px] mx-auto leading-[1.55] mb-12">
            John Doe, 62, hypertension diagnosed 2019, CKD progressing. Live FHIR data,
            live LLM reasoning, live result.
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

const METRICS = [
  { num: '13', label: 'MCP tools chained', tooltip: '' },
  { num: '8', label: 'LLM reasoning calls', tooltip: '' },
  { num: '54', label: 'FHIR events analyzed', tooltip: '' },
  {
    num: '<35s',
    label: 'end-to-end latency',
    tooltip: 'Wall-clock from request to brief: 7 parallel FHIR fetches + 8 LLM calls + JSON assembly. Verified in production.',
  },
];

const OUTPUTS = [
  { t: 'Patient narrative', d: 'A 200 to 300 word clinical story with cited dates and labs. No generic summaries.', tag: 'GPT-4o' },
  { t: 'Early warning', d: 'Holistic multi-signal pattern detection. Catches drift across BP, creatinine, BMI together.', tag: 'GPT-4o' },
  { t: 'Turning points', d: 'Three to five inflection moments where the trajectory changed. With dates and rationale.', tag: 'Llama-3.3' },
  { t: 'Causal hypothesis', d: 'Plausible cause-effect chains across the chronological timeline.', tag: 'GPT-4o' },
  { t: 'Guideline gaps', d: 'Cross-checks ADA, JNC, KDIGO, ACC/AHA. Flags missed actions per guideline.', tag: 'GPT-4o-mini' },
  { t: 'Recommendations', d: 'Three to five patient-specific actions with priority, urgency, and the finding that triggered it.', tag: 'GPT-4o' },
];

const BUILT_ON = [
  { name: 'MCP', tag: 'protocol' },
  { name: 'A2A', tag: 'agent handoff' },
  { name: 'FHIR R4', tag: 'data standard' },
  { name: 'OpenAI', tag: 'GPT-4o' },
  { name: 'Groq', tag: 'Llama-3.3' },
  { name: 'Prompt Opinion', tag: 'platform' },
  { name: 'Railway', tag: 'hosting' },
];

function ThreeTenses() {
  const tenses = [
    {
      label: 'Past',
      question: 'What has been happening?',
      status: 'gap' as const,
      sub: 'Lost in the chart',
      detail: 'Hundreds of FHIR resources across years. Three clinicians saw three snapshots. Nobody saw the cascade.',
    },
    {
      label: 'Present',
      question: 'What is happening?',
      status: 'covered' as const,
      sub: 'EHRs are good at this',
      detail: 'Vitals, recent labs, current meds, today\'s problems. The snapshot is excellent.',
    },
    {
      label: 'Future',
      question: 'What is coming?',
      status: 'gap' as const,
      sub: 'Invisible until it isn\'t',
      detail: 'Creatinine drift inside the reference range. Trajectory is catastrophic. Each individual reading reads "normal."',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {tenses.map((t, i) => {
        const isCovered = t.status === 'covered';
        return (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: i * 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`relative border rounded-sm overflow-hidden ${
              isCovered
                ? 'border-teal-deep bg-teal-soft/40'
                : 'border-rule bg-bg'
            }`}
          >
            <div className="px-7 pt-7 pb-5 flex items-start justify-between gap-3">
              <div className="text-[10px] uppercase tracking-widest text-muted font-bold">
                {t.label}
              </div>
              <motion.div
                initial={{ scale: 0, rotate: -90 }}
                whileInView={{ scale: 1, rotate: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, delay: i * 0.18 + 0.6, ease: [0.16, 1, 0.3, 1] }}
                className={`flex items-center justify-center w-7 h-7 rounded-full text-[13px] font-bold ${
                  isCovered
                    ? 'bg-teal-deep text-bg'
                    : 'bg-bg border border-ink-3 text-ink-3'
                }`}
                aria-hidden
              >
                {isCovered ? '✓' : '✕'}
              </motion.div>
            </div>
            <div className="px-7 pb-7">
              <div className="font-serif text-[26px] leading-[1.15] tracking-tighter font-bold mb-3">
                "{t.question}"
              </div>
              <div className={`text-[12px] uppercase tracking-widest font-semibold mb-4 ${isCovered ? 'text-teal-deep' : 'text-muted'}`}>
                {t.sub}
              </div>
              <p className="text-[14px] text-ink-2 leading-[1.55]">{t.detail}</p>
            </div>
            {isCovered && (
              <motion.div
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 1, delay: i * 0.18 + 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="absolute bottom-0 left-0 right-0 h-1 bg-teal-deep origin-left"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function HeroBackdrop() {
  return (
    <svg
      aria-hidden
      className="absolute inset-0 w-full h-full opacity-80"
      viewBox="0 0 680 600"
      preserveAspectRatio="xMaxYMid meet"
      fill="none"
    >
      <defs>
        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1a5762" stopOpacity="0" />
          <stop offset="50%" stopColor="#1a5762" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#1a5762" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="lineGradient2" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a86c14" stopOpacity="0" />
          <stop offset="60%" stopColor="#a86c14" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a86c14" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[80, 200, 320, 440, 560].map((x, i) => (
        <line
          key={i}
          x1={x}
          x2={x}
          y1={20}
          y2={400}
          stroke="#0e1622"
          strokeOpacity={0.06}
          strokeDasharray="2 6"
        />
      ))}
      <motion.path
        d="M 30 320 Q 110 318 180 312 T 320 295 T 460 270 T 620 230"
        stroke="url(#lineGradient)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.5, delay: 0.3, ease: 'easeOut' }}
      />
      <motion.path
        d="M 30 200 Q 90 180 160 195 T 290 200 T 420 175 T 560 165 T 640 150"
        stroke="url(#lineGradient2)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 2.5, delay: 0.7, ease: 'easeOut' }}
      />
      {[
        { x: 110, y: 318, label: '2019' },
        { x: 240, y: 295, label: '2021' },
        { x: 400, y: 275, label: '2023' },
        { x: 560, y: 245, label: '2026' },
      ].map((e, i) => (
        <motion.g
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1.2 + i * 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <circle cx={e.x} cy={e.y} r="5" fill="#0f3a44" />
          <circle cx={e.x} cy={e.y} r="11" fill="#0f3a44" fillOpacity="0.12" />
          <text
            x={e.x}
            y={e.y + 30}
            fontSize="10"
            fontFamily="JetBrains Mono, monospace"
            fill="#5a6478"
            textAnchor="middle"
            letterSpacing="0.05em"
          >
            {e.label}
          </text>
        </motion.g>
      ))}
      <motion.line
        x1="640"
        y1="60"
        x2="640"
        y2="380"
        stroke="#0e1622"
        strokeOpacity="0.18"
        strokeDasharray="4 4"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1, delay: 2 }}
      />
      <motion.text
        x="640"
        y="48"
        fontSize="9"
        fontFamily="Inter, sans-serif"
        fontWeight="600"
        letterSpacing="0.16em"
        fill="#0e1622"
        textAnchor="end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ delay: 2.4 }}
      >
        TODAY
      </motion.text>
    </svg>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {stages.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          className={`border border-rule p-5 rounded-sm ${s.tint} min-w-0`}
        >
          <div className="text-[10px] uppercase tracking-widest text-ink-2 font-semibold mb-4">
            {String(i + 1).padStart(2, '0')} <span className="text-muted">/</span> {s.phase}
          </div>
          <ul className="space-y-2">
            {s.tools.map(t => (
              <li
                key={t}
                className="font-mono text-[10px] text-ink-2 leading-[1.5] break-all"
              >
                {t}
              </li>
            ))}
          </ul>
        </motion.div>
      ))}
    </div>
  );
}

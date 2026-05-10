import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DEMO_PATIENTS } from '../lib/patients';

export default function HowItWorks() {
  return (
    <div>
      <section className="max-w-[1100px] mx-auto px-8 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="eyebrow mb-6">How it works</div>
          <h1 className="font-serif text-[56px] md:text-[72px] leading-[0.98] tracking-tightest font-bold mb-8 max-w-[900px]">
            One prompt in.
            <br />
            <span className="highlight delay-2">One brief out.</span>
          </h1>
          <p className="text-[18px] text-ink-2 leading-[1.6] max-w-[680px]">
            You give us a patient. We do the rest. Below is the same system
            explained three ways: in plain English, as a request lifecycle, and
            as a system architecture.
          </p>
        </motion.div>
      </section>

      {/* PLAIN ENGLISH */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">In plain English</div>
          <h2 className="font-serif text-[40px] md:text-[48px] leading-[1.05] tracking-tighter font-bold mb-14 max-w-[760px]">
            Four steps. Thirty seconds. One brief.
          </h2>
          <PlainEnglishSteps />
        </div>
      </section>

      <section className="max-w-[1100px] mx-auto px-8 pt-24 pb-12">
        <div className="eyebrow mb-4">System diagram</div>
        <h2 className="font-serif text-[36px] leading-[1.1] tracking-tighter font-bold mb-8 max-w-[760px]">
          Four moving parts. Each replaceable.
        </h2>
        <ArchitectureDiagram />
      </section>

      {/* REQUEST LIFECYCLE */}
      <section className="border-t border-rule mt-16 bg-paper">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">Request lifecycle</div>
          <h2 className="font-serif text-[44px] md:text-[52px] leading-[1.05] tracking-tighter font-bold mb-6 max-w-[820px]">
            What happens when you click <span className="highlight">"Run analysis."</span>
          </h2>
          <p className="text-[16px] text-ink-2 max-w-[640px] leading-[1.6] mb-12">
            One HTTP POST kicks off the 13-step reasoning pipeline. Eight LLM
            calls, seven FHIR queries, roughly 25 to 35 seconds of wall time.
            Each step's output feeds the next.
          </p>
          <RequestLifecycle />
        </div>
      </section>

      {/* THE 14 TOOLS */}
      <section id="tools" className="border-t border-rule scroll-mt-16">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">The catalog</div>
          <h2 className="font-serif text-[44px] md:text-[52px] leading-[1.05] tracking-tighter font-bold mb-6 max-w-[820px]">
            Fourteen tools. <span className="highlight">Each does one thing well.</span>
          </h2>
          <p className="text-[16px] text-ink-2 max-w-[700px] leading-[1.6] mb-12">
            Thirteen run as the pipeline whenever you click "Run analysis."
            One is optional and runs only when you ask for audio output.
            Every tool is exposed via MCP over Streamable HTTP at{' '}
            <a
              href="https://attractive-ambition-production-5fd7.up.railway.app/mcp/"
              target="_blank"
              rel="noopener"
              className="text-teal-deep link-underline font-mono text-[14px]"
            >
              /mcp/
            </a>.
          </p>
          <ToolsCatalog />
        </div>
      </section>

      {/* PER-LAYER WALK */}
      <section className="border-t border-rule bg-paper">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">The four layers</div>
          <h2 className="font-serif text-[40px] leading-[1.05] tracking-tighter font-bold mb-12">
            Deeper dive into each layer.
          </h2>
          <div className="space-y-24">
            {LAYERS.map((l, i) => (
              <motion.div
                key={l.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-100px' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="grid grid-cols-1 md:grid-cols-12 gap-8"
              >
                <div className="md:col-span-3">
                  <div className="font-mono text-[42px] text-teal-deep font-medium tracking-tighter">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="font-serif text-[28px] font-bold tracking-tighter mt-2">{l.name}</div>
                  <div className="text-xs uppercase tracking-widest text-muted mt-1">
                    {l.role}
                  </div>
                </div>
                <div className="md:col-span-9 space-y-4">
                  <p className="text-[16px] text-ink-2 leading-[1.65]">{l.desc}</p>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2">
                    {l.tags.map(t => (
                      <span key={t} className="font-mono text-[12px] text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ADMIN FLOW */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">Admin flow</div>
          <h2 className="font-serif text-[44px] leading-[1.05] tracking-tighter font-bold mb-6 max-w-[820px]">
            Bringing a new patient into the system.
          </h2>
          <p className="text-[16px] text-ink-2 max-w-[640px] leading-[1.6] mb-12">
            Admins upload synthetic FHIR R4 bundles via the dashboard. The server
            validates, rewrites POST entries to PUT (preserving IDs), and pushes
            the data to the configured FHIR server. Patient records propagate
            instantly. The next analyze run sees them.
          </p>
          <AdminFlow />
          <div className="mt-10">
            <Link to="/admin" className="text-sm font-medium text-teal-deep link-underline">
              Open the admin dashboard →
            </Link>
          </div>
        </div>
      </section>

      {/* DEMO PATIENT IDS */}
      <section className="border-t border-rule bg-paper">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">Demo patients on HAPI</div>
          <h2 className="font-serif text-[36px] leading-[1.1] tracking-tighter font-bold mb-6">
            Copy any ID and use it on the demo page.
          </h2>
          <p className="text-[14px] text-muted mb-8">
            Click an ID to copy it. All four are fully synthetic (no PHI) and live on
            <code className="font-mono text-[12px] mx-1 bg-rule px-1.5 py-0.5 rounded-sm">
              hapi.fhir.org/baseR4
            </code>.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEMO_PATIENTS.map(p => (
              <PatientIdCard key={p.id} pid={p.id} name={p.name} story={p.story} age={p.age} sex={p.sex} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-8 py-24 text-center">
          <p className="font-serif text-[36px] tracking-tighter font-bold mb-6">
            Ready to see it run?
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

// ───────────────────────────────────────────────────────────────────────────
// Plain English: a four-step explanation with icons and one-line per step
// ───────────────────────────────────────────────────────────────────────────

function PlainEnglishSteps() {
  const steps = [
    {
      number: '01',
      title: 'You give us a patient',
      simple: 'Just a patient ID. Nothing else.',
      detail: 'No setup, no installation, no model fine-tuning. Pick from four demo patients on HAPI public R4, or paste any FHIR R4 patient ID.',
    },
    {
      number: '02',
      title: 'We pull every record',
      simple: "Years of FHIR data, fetched in parallel.",
      detail: 'Conditions, observations, medications, encounters, diagnostic reports. Codes (LOINC, ICD-10, RxNorm) decoded into human-readable names. Sorted into one chronological timeline.',
    },
    {
      number: '03',
      title: 'AI reads it together',
      simple: 'Eight focused calls. Whole-patient view, not one lab at a time.',
      detail: "Some calls are GPT-4o for prose and deep reasoning, some are Llama-3.3-70b for fast structured output. Each looks at the whole timeline so it can catch patterns that single-visit thresholds miss.",
    },
    {
      number: '04',
      title: 'You get a brief',
      simple: 'Specific dates. Specific values. Specific recommendations.',
      detail: 'Patient narrative, early-warning risk assessment, turning points, causal hypothesis, comorbidity map, guideline gaps, prioritized recommendations. Cited from the data, not generic advice.',
    },
  ];

  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 md:grid-cols-[80px_1fr_1fr] gap-6 md:gap-10 items-start border border-rule bg-paper rounded-sm px-6 py-6 hover:border-teal-deep transition-colors"
        >
          <div className="font-mono text-[36px] text-teal-deep font-medium tracking-tighter leading-[1]">
            {s.number}
          </div>
          <div>
            <div className="font-serif text-[24px] font-bold tracking-tighter leading-[1.15] mb-2">
              {s.title}
            </div>
            <div className="text-[15px] text-ink-2 leading-[1.55]">{s.simple}</div>
          </div>
          <div className="text-[13px] text-muted leading-[1.6]">
            {s.detail}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Tools catalog: 13-step pipeline + 1 optional voice tool
// ───────────────────────────────────────────────────────────────────────────

const PIPELINE_TOOLS = [
  { num: '01', name: 'get_full_patient_history', engine: 'FHIR', phase: 'Reconstruct', desc: 'Parallel-fetches Patient + 6 resource types from a FHIR R4 server. Normalizes LOINC, ICD-10, and RxNorm codes. Returns a flat, sorted event timeline.' },
  { num: '02', name: 'order_events_chronologically', engine: 'Pure Python', phase: 'Reconstruct', desc: 'Sorts and dedupes the timeline by date. No LLM, deterministic.' },
  { num: '03', name: 'identify_clinical_turning_points', engine: 'Llama-3.3-70b', phase: 'Reconstruct', desc: 'Three to five inflection moments where the trajectory changed: HTN diagnosed, eGFR crossed 60, dose adjusted. With dates and rationale.' },
  { num: '04', name: 'generate_patient_narrative', engine: 'GPT-4o', phase: 'Reconstruct', desc: '200 to 300 word clinical narrative, the "story" handoff a clinician would tell a colleague. Cites specific dates and labs.' },
  { num: '05', name: 'get_recent_signals', engine: 'Pure Python', phase: 'Detect', desc: 'Filters timeline to events within the past N days (default 90). Sets the window for deterioration analysis.' },
  { num: '06', name: 'analyze_weak_patterns', engine: 'GPT-4o', phase: 'Detect', desc: 'The core AI step. Holistic multi-signal reasoning, looks at BP, creatinine, BMI, HbA1c together, not one at a time. Catches drift that thresholds miss.' },
  { num: '07', name: 'generate_early_warning_report', engine: 'Llama-3.3-70b', phase: 'Detect', desc: 'Formalizes pattern analysis into a structured risk report: risk_level, key_signals, trend_direction, time_sensitivity.' },
  { num: '08', name: 'correlate_events', engine: 'Llama-3.3-70b', phase: 'Explain', desc: 'Identifies plausible causal pairs across the timeline: "uncontrolled HTN 2021 -> CKD diagnosis 2022."' },
  { num: '09', name: 'generate_causal_hypothesis', engine: 'GPT-4o', phase: 'Explain', desc: 'About 150 words of causal narrative synthesized from the top correlations. Explains the trajectory.' },
  { num: '10', name: 'map_comorbidities', engine: 'Llama-3.3-70b', phase: 'Recommend', desc: 'Maps interactions between active conditions: HTN with CKD acceleration, T2DM with HTN compounding effects.' },
  { num: '11', name: 'match_clinical_guidelines', engine: 'GPT-4o-mini', phase: 'Recommend', desc: 'Cross-checks the patient profile against ADA, JNC, KDIGO, ACC/AHA. Flags actions per guideline as met or gap.' },
  { num: '12', name: 'generate_recommendations', engine: 'GPT-4o', phase: 'Recommend', desc: 'Three to five patient-specific actions with priority, urgency, rationale, and the specific finding that triggered it.' },
  { num: '13', name: 'generate_unified_brief', engine: 'Pure Python', phase: 'Synthesize', desc: 'Assembles all prior outputs into the final structured brief (schema v1.0). No LLM, deterministic JSON assembly.' },
];

const VOICE_TOOL = {
  num: '14',
  name: 'text_to_speech_brief',
  engine: 'OpenAI TTS',
  phase: 'Voice',
  desc: 'Optional. Renders selected brief sections to speech. OpenAI TTS primary (uses existing key), Google Cloud TTS as fallback.',
};

const PHASE_COLOR: Record<string, string> = {
  Reconstruct: 'bg-teal-soft text-teal-deep',
  Detect: 'bg-[#fdf6e7] text-[#a86c14]',
  Explain: 'bg-[#f4eedd] text-[#7a5e1a]',
  Recommend: 'bg-[#ecdfd2] text-[#774e2a]',
  Synthesize: 'bg-[#d9d2c5] text-[#3d3d3d]',
  Voice: 'bg-[#e8e8f5] text-[#3d4a8a]',
};

function ToolsCatalog() {
  return (
    <>
      {/* 13-step pipeline */}
      <div className="mb-6 inline-flex items-center gap-3 text-[11px] uppercase tracking-widest text-teal-deep font-bold bg-teal-soft px-3 py-1.5 rounded-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-deep" />
        13-step pipeline (auto-runs on Run analysis)
      </div>

      <div className="space-y-3 mb-12">
        {PIPELINE_TOOLS.map((t, i) => (
          <ToolRow key={t.name} tool={t} index={i} />
        ))}
      </div>

      {/* Optional voice tool — visually separated */}
      <div className="mb-6 inline-flex items-center gap-3 text-[11px] uppercase tracking-widest text-muted font-bold bg-rule/60 px-3 py-1.5 rounded-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-muted" />
        Optional, on-demand only
      </div>

      <ToolRow tool={VOICE_TOOL} index={13} />

      <div className="mt-6 max-w-[760px] border-l-2 border-teal-deep/40 pl-5 py-2">
        <div className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-2">
          Where voice gets triggered
        </div>
        <p className="text-[14px] text-ink-2 leading-[1.6] mb-3">
          The voice tool is not part of the auto-pipeline. It only runs when
          something explicitly asks for it. There are two paths:
        </p>
        <ul className="space-y-2 text-[14px] text-ink-2 leading-[1.55]">
          <li className="flex gap-2">
            <span className="text-teal-deep mt-0.5">›</span>
            <span>
              <strong className="text-ink">In the Demo page:</strong>{' '}
              click the <em className="font-medium">Listen to brief</em> button
              in the patient banner after the brief renders. The button calls{' '}
              <code className="font-mono text-[12px]">POST /api/demo/voice</code>,
              which invokes <code className="font-mono text-[12px]">text_to_speech_brief</code>{' '}
              with the narrative + early warning + recommendations sections.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-teal-deep mt-0.5">›</span>
            <span>
              <strong className="text-ink">Programmatically:</strong>{' '}
              call the MCP endpoint at{' '}
              <code className="font-mono text-[12px]">/mcp/</code>{' '}
              with the tool name and the brief as input. Useful for shift-change
              handoff, accessibility, or any agent that wants audio output.
            </span>
          </li>
        </ul>
        <p className="text-[13px] text-muted leading-[1.55] mt-3">
          Returns a base64 audio payload (MP3) plus a transcript fallback for
          environments where audio playback isn't available.
        </p>
      </div>
    </>
  );
}

function ToolRow({
  tool,
  index,
}: {
  tool: { num: string; name: string; engine: string; phase: string; desc: string };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.025, 0.4) }}
      className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 border border-rule bg-paper p-6 rounded-sm hover:border-teal-deep transition-colors"
    >
      <div className="md:col-span-1 font-mono text-[26px] text-teal-deep tracking-tighter">
        {tool.num}
      </div>
      <div className="md:col-span-4">
        <div className="font-mono text-[14px] font-medium text-ink mb-2 break-all">{tool.name}</div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-sm ${PHASE_COLOR[tool.phase] || 'bg-rule text-ink-2'}`}>
            {tool.phase}
          </span>
          <span className="text-[11px] text-muted font-mono">{tool.engine}</span>
        </div>
      </div>
      <div className="md:col-span-7 text-[14px] text-ink-2 leading-[1.65]">{tool.desc}</div>
    </motion.div>
  );
}

const LAYERS = [
  {
    name: 'Prompt Opinion',
    role: 'Frontend & A2A platform',
    desc: 'The clinician\'s chat surface. Routes user prompts to specialist agents via A2A handoff. Hosts ChronoCore alongside its own General Chat, with the FHIR Context extension automatically injecting patient context per request.',
    tags: ['SHARP A2A spec', 'X-FHIR-Server-URL header injection', 'Streamable HTTP MCP client'],
  },
  {
    name: 'ChronoCore',
    role: 'Orchestration agent',
    desc: 'A2A agent on Prompt Opinion. Reads the user\'s ask, decides which MCP tools to call and in what order. The system prompt encodes the 13-step pipeline; the model (GPT-4.1) handles tool chaining and intermediate reasoning.',
    tags: ['Agent skill: analyze_patient_clinical_history', 'GPT-4.1', 'Sequential tool chaining'],
  },
  {
    name: 'ChronoCare MCP server',
    role: 'Reasoning backend',
    desc: 'The Python server in this repo, deployed on Railway. Exposes 14 MCP tools over Streamable HTTP. Each tool either deterministically transforms data, fetches FHIR resources in parallel, or makes a focused LLM call with a tightly scoped prompt. Also exposes /api/demo/analyze and /api/admin/patients for the React frontend.',
    tags: ['Python 3.11', 'starlette + uvicorn', 'mcp.server.streamable_http', 'CORS-enabled HTTP routes'],
  },
  {
    name: 'FHIR R4 + LLMs',
    role: 'Data + reasoning capacity',
    desc: 'Patient data lives in any FHIR R4 server (the demo uses HAPI public R4). Reasoning capacity routes across two providers: OpenAI for prose and deep reasoning, Groq for fast structured JSON. Multi-provider also gives partial-failure resilience.',
    tags: ['HAPI FHIR R4', 'OpenAI gpt-4o, gpt-4o-mini', 'Groq llama-3.3-70b-versatile'],
  },
];

function ArchitectureDiagram() {
  // Each layer animates in top-to-bottom in a single sweep when scrolled into view.
  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 14 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' as const },
    transition: { duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  });

  const drawArrow = (delay: number) => ({
    initial: { scaleY: 0, opacity: 0 },
    whileInView: { scaleY: 1, opacity: 1 },
    viewport: { once: true, margin: '-80px' as const },
    transition: { duration: 0.4, delay, ease: 'easeOut' as const },
  });

  return (
    <div className="border border-rule bg-paper rounded-sm p-8 md:p-12 dotted">
      {/* Row 1: User -> Frontend */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <motion.div {...reveal(0)}><Box label="USER" tag="clinician / admin" subtle /></motion.div>
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
          className="origin-left"
        >
          <Arrow />
        </motion.div>
        <motion.div {...reveal(0.25)}><Box label="FRONTEND" tag="React app or Prompt Opinion chat" /></motion.div>
      </div>

      {/* arrows down */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-6">
        <div />
        <motion.div {...drawArrow(0.4)} className="flex justify-center origin-top"><Down /></motion.div>
        <motion.div {...drawArrow(0.5)} className="flex justify-center origin-top"><Down /></motion.div>
      </div>

      {/* Row 2: ChronoCore + FHIR Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-6">
        <div />
        <motion.div {...reveal(0.55)}>
          <Box label="ChronoCore" tag="A2A agent, GPT-4.1" highlight pulse />
        </motion.div>
        <motion.div {...reveal(0.7)}><Box label="FHIR Context" tag="patient_id + token" /></motion.div>
      </div>

      <motion.div {...drawArrow(0.85)} className="flex justify-center mt-6 origin-top"><Down /></motion.div>

      {/* Center hub */}
      <motion.div {...reveal(1.0)} className="mt-6 max-w-[640px] mx-auto">
        <Box
          label="ChronoCare MCP server (Railway)"
          tag="14 MCP tools, /mcp/ + /api/demo/analyze + /api/admin/patients"
          highlight
          big
          pulse
        />
      </motion.div>

      {/* arrows down to bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-6">
        <motion.div {...drawArrow(1.2)} className="flex justify-center origin-top"><Down /></motion.div>
        <motion.div {...drawArrow(1.3)} className="flex justify-center origin-top"><Down /></motion.div>
        <motion.div {...drawArrow(1.4)} className="flex justify-center origin-top"><Down /></motion.div>
      </div>

      {/* Bottom row: data + LLM providers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-6">
        <motion.div {...reveal(1.5)}><Box label="HAPI FHIR R4" tag="patient data, synthetic" /></motion.div>
        <motion.div {...reveal(1.6)}><Box label="OpenAI" tag="gpt-4o, gpt-4o-mini" /></motion.div>
        <motion.div {...reveal(1.7)}><Box label="Groq" tag="llama-3.3-70b" /></motion.div>
      </div>
    </div>
  );
}

function RequestLifecycle() {
  const steps = [
    { actor: 'Browser', text: 'User clicks "Run analysis"', detail: 'POST /api/demo/analyze body: {patient_id, fhir_base_url}' },
    { actor: 'Railway server', text: 'Validates request, dispatches to pipeline', detail: 'Sets up FHIR context, traces each tool call' },
    { actor: 'Tools 1 to 2', text: 'Fetch and normalize patient history', detail: '7 parallel HTTP GETs to HAPI, LOINC/ICD-10/RxNorm decoding, single sorted timeline' },
    { actor: 'Tools 3-4', text: 'Identify turning points + write narrative', detail: 'Llama-3.3-70b for structured JSON , GPT-4o for prose handoff' },
    { actor: 'Tools 5-7', text: 'Detect silent deterioration', detail: 'Filter to recent 90d , holistic multi-signal pattern analysis (GPT-4o) , structured early warning report' },
    { actor: 'Tools 8-9', text: 'Reason about cause', detail: 'Find causal pairs (Llama) , synthesize causal narrative (GPT-4o)' },
    { actor: 'Tools 10-12', text: 'Map context + recommend', detail: 'Comorbidity interactions , cross-check ADA/JNC/KDIGO/ACC-AHA , 3-5 cited recommendations' },
    { actor: 'Tool 13', text: 'Assemble unified brief', detail: 'Pure-Python JSON assembly , schema v1.0 , no LLM call' },
    { actor: 'Browser', text: 'Render the brief', detail: 'Animated trace becomes "all done." Patient banner, narrative, risk panel, recommendation cards' },
  ];

  return (
    <div className="relative">
      {/* vertical track */}
      <div className="absolute left-[14px] top-3 bottom-3 w-px bg-rule" aria-hidden />
      <ol className="space-y-4">
        {steps.map((s, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.5, delay: i * 0.04 }}
            className="grid grid-cols-[32px_1fr] gap-5 items-start"
          >
            <div className="relative flex items-center justify-center pt-2">
              <span className="block w-2 h-2 rounded-full bg-teal-deep ring-4 ring-bg" />
            </div>
            <div className="border border-rule bg-paper rounded-sm px-5 py-4">
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="font-mono text-[11px] uppercase tracking-widest text-teal-deep font-semibold">
                  {s.actor}
                </div>
                <div className="font-mono text-[10px] text-muted">step {i + 1}/9</div>
              </div>
              <div className="font-medium text-[15px] mt-1">{s.text}</div>
              <div className="text-[13px] text-ink-2 leading-[1.5] mt-1">{s.detail}</div>
            </div>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function AdminFlow() {
  const lanes = [
    { step: 1, actor: 'Admin', side: 'left' as const, items: ['Opens /admin', 'Pastes admin key', 'Pastes / uploads bundle'] },
    { step: 2, actor: 'Browser', side: 'left' as const, items: ['Stores key in localStorage', 'POST /api/admin/patients with X-Admin-Key'] },
    { step: 3, actor: 'Server', side: 'right' as const, items: ['Verifies X-Admin-Key', 'Validates Bundle (must have Patient + id)', 'Rewrites POST to PUT to preserve IDs', 'POSTs to HAPI / configured FHIR'] },
    { step: 4, actor: 'FHIR', side: 'right' as const, items: ['Stores resources', 'Returns per-entry status (201/200)'] },
    { step: 5, actor: 'Server to Browser', side: 'right' as const, items: ['{ ok, patient_id, entries_uploaded }', 'Dashboard shows success card'] },
  ];

  const STAGGER = 0.4;

  type RowItem =
    | { kind: 'lane'; lane: typeof lanes[number]; index: number }
    | { kind: 'down'; col: 'left' | 'right'; afterIndex: number }
    | { kind: 'cross'; afterIndex: number };

  const rows: RowItem[] = [
    { kind: 'lane', lane: lanes[0], index: 0 },
    { kind: 'down', col: 'left', afterIndex: 0 },
    { kind: 'lane', lane: lanes[1], index: 1 },
    { kind: 'cross', afterIndex: 1 },
    { kind: 'lane', lane: lanes[2], index: 2 },
    { kind: 'down', col: 'right', afterIndex: 2 },
    { kind: 'lane', lane: lanes[3], index: 3 },
    { kind: 'down', col: 'right', afterIndex: 3 },
    { kind: 'lane', lane: lanes[4], index: 4 },
  ];

  return (
    <div className="border border-rule bg-bg rounded-sm p-8 md:p-10 dotted">
      <div className="space-y-4">
        {rows.map((r, k) => {
          if (r.kind === 'lane') {
            const l = r.lane;
            const baseDelay = r.index * STAGGER;
            return (
              <div key={k} className="grid grid-cols-2 gap-x-12">
                <motion.div
                  initial={{ opacity: 0, x: l.side === 'left' ? -30 : 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, delay: baseDelay, ease: [0.16, 1, 0.3, 1] }}
                  className={`${l.side === 'right' ? 'col-start-2' : 'col-start-1'} relative bg-paper border border-rule rounded-sm px-5 py-4`}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: baseDelay + 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute -top-3 -left-3 w-7 h-7 bg-teal-deep text-bg rounded-full flex items-center justify-center font-mono text-[11px] font-bold shadow-sm"
                    aria-hidden
                  >
                    {l.step}
                  </motion.div>

                  <div className="font-mono text-[11px] uppercase tracking-widest text-teal-deep font-semibold mb-2">
                    {l.actor}
                  </div>
                  <ul className="space-y-1.5">
                    {l.items.map((item, j) => (
                      <motion.li
                        key={j}
                        initial={{ opacity: 0, x: -6 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{
                          duration: 0.35,
                          delay: baseDelay + 0.3 + j * 0.08,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className="text-[13px] text-ink-2 leading-[1.5] flex gap-2"
                      >
                        <span className="text-teal-deep">›</span>
                        <span>{item}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            );
          }

          if (r.kind === 'down') {
            const arrowDelay = (r.afterIndex + 1) * STAGGER - 0.15;
            return (
              <div key={k} className="grid grid-cols-2 gap-x-12">
                <DownArrow
                  side={r.col}
                  delay={arrowDelay}
                  label={r.col === 'left' && r.afterIndex === 0 ? 'send' : undefined}
                />
              </div>
            );
          }

          // Cross arrow: Browser (left) -> Server (right)
          const crossDelay = (r.afterIndex + 1) * STAGGER - 0.2;
          return <CrossArrow key={k} delay={crossDelay} label="POST request" />;
        })}
      </div>
    </div>
  );
}

function DownArrow({
  side,
  delay,
  label,
}: {
  side: 'left' | 'right';
  delay: number;
  label?: string;
}) {
  return (
    <div className={`${side === 'right' ? 'col-start-2' : 'col-start-1'} flex items-center justify-start gap-3 py-1`}>
      <svg width="32" height="36" viewBox="0 0 32 36" className="overflow-visible">
        <motion.line
          x1="16"
          y1="0"
          x2="16"
          y2="28"
          stroke="#1a5762"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay, ease: 'easeOut' }}
        />
        <motion.polyline
          points="10,22 16,30 22,22"
          stroke="#1a5762"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          fill="none"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.3, delay: delay + 0.4 }}
        />
      </svg>
      {label && (
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: delay + 0.3 }}
          className="font-mono text-[10px] uppercase tracking-widest text-muted"
        >
          {label}
        </motion.span>
      )}
    </div>
  );
}

function CrossArrow({ delay, label }: { delay: number; label?: string }) {
  return (
    <div className="grid grid-cols-2 gap-x-12 items-center py-2">
      <div className="flex justify-end items-center gap-2">
        {label && (
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.4, delay: delay + 0.3 }}
            className="font-mono text-[10px] uppercase tracking-widest text-muted"
          >
            {label}
          </motion.span>
        )}
      </div>
      <div className="flex items-center">
        <svg width="120" height="44" viewBox="0 0 120 44" className="overflow-visible -ml-12">
          <motion.path
            d="M 0 8 C 30 8, 50 36, 100 36"
            stroke="#1a5762"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.7, delay, ease: 'easeOut' }}
          />
          <motion.polyline
            points="92,30 100,36 96,44"
            stroke="#1a5762"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
            fill="none"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.3, delay: delay + 0.6 }}
          />
        </svg>
      </div>
    </div>
  );
}

function PatientIdCard({
  pid,
  name,
  story,
  age,
  sex,
}: {
  pid: string;
  name: string;
  story: string;
  age: string;
  sex: string;
}) {
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard?.writeText(pid)}
      className="text-left border border-rule bg-paper rounded-sm p-5 hover:border-teal-deep transition-all group"
      title="Click to copy ID"
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <div className="font-serif text-[18px] font-bold tracking-tighter">{name}</div>
        <div className="text-[11px] text-muted whitespace-nowrap">
          {age} , {sex}
        </div>
      </div>
      <div className="text-[12px] text-ink-2 mb-3 leading-[1.5]">{story}</div>
      <div className="flex items-center gap-2 font-mono text-[11px] text-muted bg-bg group-hover:bg-rule transition-colors px-3 py-1.5 rounded-sm">
        <span className="truncate flex-1">{pid}</span>
        <span className="text-teal-deep opacity-60 group-hover:opacity-100">⧉ copy</span>
      </div>
    </button>
  );
}

function Box({
  label,
  tag,
  highlight,
  subtle,
  big,
  pulse,
}: {
  label: string;
  tag: string;
  highlight?: boolean;
  subtle?: boolean;
  big?: boolean;
  pulse?: boolean;
}) {
  return (
    <div
      className={`relative border ${
        highlight ? 'border-teal-deep bg-teal-soft' : subtle ? 'border-rule bg-bg' : 'border-rule bg-paper'
      } rounded-sm ${big ? 'px-8 py-6' : 'px-5 py-4'} text-center`}
    >
      {pulse && (
        <motion.span
          aria-hidden
          className="absolute inset-0 rounded-sm border-2 border-teal-deep pointer-events-none"
          animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.04, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <div className={`font-serif font-bold tracking-tighter ${big ? 'text-[20px]' : 'text-[16px]'}`}>
        {label}
      </div>
      <div className="font-mono text-[11px] text-muted mt-1">{tag}</div>
    </div>
  );
}

function Arrow() {
  return <div className="text-center text-muted text-xl select-none">→</div>;
}
function Down() {
  return <div className="text-muted text-lg select-none">↓</div>;
}

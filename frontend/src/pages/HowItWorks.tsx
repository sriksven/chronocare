import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { DEMO_PATIENTS } from '../lib/patients';

export default function HowItWorks() {
  return (
    <div>
      <section className="max-w-[1100px] mx-auto px-8 pt-24 pb-12">
        <div className="eyebrow mb-6">Architecture</div>
        <h1 className="font-serif text-[56px] md:text-[72px] leading-[0.98] tracking-tightest font-bold mb-8 max-w-[900px]">
          Four moving parts.
          <br />
          <em className="text-teal-deep">One outcome.</em>
        </h1>
        <p className="text-[18px] text-ink-2 leading-[1.6] max-w-[680px]">
          ChronoCare separates the front-end (Prompt Opinion or this React app),
          the orchestration layer, the reasoning server (this repo), and the data
          store (FHIR R4). Each is replaceable; the whole is composable.
        </p>
      </section>

      <section className="max-w-[1100px] mx-auto px-8 py-12">
        <ArchitectureDiagram />
      </section>

      {/* REQUEST LIFECYCLE — the cinematic explanation */}
      <section className="border-t border-rule mt-16 bg-paper">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">Request lifecycle</div>
          <h2 className="font-serif text-[44px] md:text-[52px] leading-[1.05] tracking-tighter font-bold mb-6 max-w-[820px]">
            What happens when you click <em className="text-teal-deep">"Run analysis."</em>
          </h2>
          <p className="text-[16px] text-ink-2 max-w-[640px] leading-[1.6] mb-12">
            One HTTP POST kicks off a 13-step pipeline. Eight LLM calls, seven
            FHIR queries, ~25–35s of wall time. Each step's output feeds the next.
          </p>
          <RequestLifecycle />
        </div>
      </section>

      {/* PER-LAYER WALK */}
      <section className="border-t border-rule">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">The four layers</div>
          <h2 className="font-serif text-[40px] leading-[1.05] tracking-tighter font-bold mb-12">
            Each does one thing well.
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
      <section className="border-t border-rule bg-paper">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">Admin flow</div>
          <h2 className="font-serif text-[44px] leading-[1.05] tracking-tighter font-bold mb-6 max-w-[820px]">
            Bringing a new patient into the system.
          </h2>
          <p className="text-[16px] text-ink-2 max-w-[640px] leading-[1.6] mb-12">
            Admins upload synthetic FHIR R4 bundles via the dashboard. The server
            validates, rewrites POST entries to PUT (preserving IDs), and pushes
            the data to the configured FHIR server. Patient records propagate
            instantly — the next analyze run sees them.
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
      <section className="border-t border-rule">
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
      <section className="border-t border-rule bg-paper">
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
    desc: 'Patient data lives in any FHIR R4 server (the demo uses HAPI public R4). Reasoning capacity routes across two providers — OpenAI for prose and deep reasoning, Groq for fast structured JSON. Multi-provider also gives partial-failure resilience.',
    tags: ['HAPI FHIR R4', 'OpenAI gpt-4o, gpt-4o-mini', 'Groq llama-3.3-70b-versatile'],
  },
];

function ArchitectureDiagram() {
  return (
    <div className="border border-rule bg-paper rounded-sm p-8 md:p-12 dotted">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <Box label="USER" tag="clinician / admin" subtle />
        <Arrow />
        <Box label="FRONTEND" tag="this React app · or Prompt Opinion chat" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-6">
        <div />
        <div className="flex justify-center">
          <Down />
        </div>
        <div className="flex justify-center">
          <Down />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-6">
        <div />
        <Box label="ChronoCore" tag="A2A agent · GPT-4.1" highlight />
        <Box label="FHIR Context" tag="patient_id + token" />
      </div>
      <div className="flex justify-center mt-6">
        <Down />
      </div>
      <div className="mt-6 max-w-[640px] mx-auto">
        <Box
          label="ChronoCare MCP server (Railway)"
          tag="14 MCP tools · /mcp/ + /api/demo/analyze + /api/admin/patients"
          highlight
          big
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-6">
        <div className="flex justify-center"><Down /></div>
        <div className="flex justify-center"><Down /></div>
        <div className="flex justify-center"><Down /></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mt-6">
        <Box label="HAPI FHIR R4" tag="patient data · synthetic" />
        <Box label="OpenAI" tag="gpt-4o, gpt-4o-mini" />
        <Box label="Groq" tag="llama-3.3-70b" />
      </div>
    </div>
  );
}

function RequestLifecycle() {
  const steps = [
    { actor: 'Browser', text: 'User clicks "Run analysis"', detail: 'POST /api/demo/analyze body: {patient_id, fhir_base_url}' },
    { actor: 'Railway server', text: 'Validates request, dispatches to pipeline', detail: 'Sets up FHIR context, traces each tool call' },
    { actor: 'Tools 1–2', text: 'Fetch + normalize patient history', detail: '7 parallel HTTP GETs to HAPI · LOINC/ICD-10/RxNorm decoding · single sorted timeline' },
    { actor: 'Tools 3–4', text: 'Identify turning points + write narrative', detail: 'Llama-3.3-70b for structured JSON · GPT-4o for prose handoff' },
    { actor: 'Tools 5–7', text: 'Detect silent deterioration', detail: 'Filter to recent 90d · holistic multi-signal pattern analysis (GPT-4o) · structured early warning report' },
    { actor: 'Tools 8–9', text: 'Reason about cause', detail: 'Find causal pairs (Llama) · synthesize causal narrative (GPT-4o)' },
    { actor: 'Tools 10–12', text: 'Map context + recommend', detail: 'Comorbidity interactions · cross-check ADA/JNC/KDIGO/ACC-AHA · 3–5 cited recommendations' },
    { actor: 'Tool 13', text: 'Assemble unified brief', detail: 'Pure-Python JSON assembly · schema v1.0 · no LLM call' },
    { actor: 'Browser', text: 'Render the brief', detail: 'Animated trace becomes "all done" — patient banner, narrative, risk panel, recs cards' },
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
    { actor: 'Admin', side: 'left' as const, items: ['Opens /admin', 'Pastes admin key', 'Pastes / uploads bundle'] },
    { actor: 'Browser', side: 'left' as const, items: ['Stores key in localStorage', 'POST /api/admin/patients with X-Admin-Key'] },
    { actor: 'Server', side: 'right' as const, items: ['Verifies X-Admin-Key', 'Validates Bundle (must have Patient + id)', 'Rewrites POST → PUT to preserve IDs', 'POSTs to HAPI / configured FHIR'] },
    { actor: 'FHIR', side: 'right' as const, items: ['Stores resources', 'Returns per-entry status (201/200)'] },
    { actor: 'Server → Browser', side: 'right' as const, items: ['{ ok, patient_id, entries_uploaded }', 'Dashboard shows success card'] },
  ];

  return (
    <div className="border border-rule bg-bg rounded-sm p-8 md:p-10 dotted">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        {lanes.map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className={`${l.side === 'right' ? 'md:col-start-2' : 'md:col-start-1'} bg-paper border border-rule rounded-sm px-5 py-4`}
          >
            <div className="font-mono text-[11px] uppercase tracking-widest text-teal-deep font-semibold mb-2">
              {l.actor}
            </div>
            <ul className="space-y-1.5">
              {l.items.map((item, j) => (
                <li key={j} className="text-[13px] text-ink-2 leading-[1.5] flex gap-2">
                  <span className="text-teal-deep">›</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
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
          {age} · {sex}
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
}: {
  label: string;
  tag: string;
  highlight?: boolean;
  subtle?: boolean;
  big?: boolean;
}) {
  return (
    <div
      className={`border ${
        highlight ? 'border-teal-deep bg-teal-soft' : subtle ? 'border-rule bg-bg' : 'border-rule bg-paper'
      } rounded-sm ${big ? 'px-8 py-6' : 'px-5 py-4'} text-center`}
    >
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

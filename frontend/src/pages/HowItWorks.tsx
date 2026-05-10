import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

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
          ChronoCare separates the front-end (Prompt Opinion), the orchestration agent
          (ChronoCore), the reasoning server (this repo), and the data store (FHIR R4). Each is
          replaceable; the whole is composable.
        </p>
      </section>

      <section className="max-w-[1100px] mx-auto px-8 py-12">
        <ArchitectureDiagram />
      </section>

      {/* PER-LAYER WALK */}
      <section className="border-t border-rule mt-16">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
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

      {/* CALL FLOW */}
      <section className="border-t border-rule bg-paper">
        <div className="max-w-[1100px] mx-auto px-8 py-24">
          <div className="eyebrow mb-4">Call sequence</div>
          <h2 className="font-serif text-[40px] leading-[1.05] tracking-tighter font-bold mb-12">
            What happens when a clinician hits send.
          </h2>
          <ol className="space-y-8">
            {CALL_FLOW.map((c, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="grid grid-cols-[40px_1fr] gap-6 items-baseline pb-8 border-b border-rule last:border-b-0"
              >
                <div className="font-mono text-[20px] text-teal-deep font-medium">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div className="font-medium text-[17px] mb-1">{c.title}</div>
                  <div className="text-[14px] text-ink-2 leading-[1.65]">{c.detail}</div>
                </div>
              </motion.li>
            ))}
          </ol>
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
    desc: 'The Python server in this repo, deployed on Railway. Exposes 14 MCP tools over Streamable HTTP. Each tool either deterministically transforms data, fetches FHIR resources in parallel, or makes a focused LLM call with a tightly scoped prompt.',
    tags: ['Python 3.11', 'starlette + uvicorn', 'mcp.server.streamable_http', 'CORS-enabled /api/demo/analyze'],
  },
  {
    name: 'FHIR R4 + LLMs',
    role: 'Data + reasoning capacity',
    desc: 'Patient data lives in any FHIR R4 server (the demo uses HAPI public R4). Reasoning capacity routes across two providers — OpenAI for prose and deep reasoning, Groq for fast structured JSON. Multi-provider also gives partial-failure resilience.',
    tags: ['HAPI FHIR R4', 'OpenAI gpt-4o, gpt-4o-mini', 'Groq llama-3.3-70b-versatile'],
  },
];

const CALL_FLOW = [
  {
    title: 'User asks for a clinical analysis in Prompt Opinion General Chat.',
    detail: '"I need a full clinical analysis of patient d0be5a00-…" — sent to the workspace\'s General Chat agent.',
  },
  {
    title: 'General Chat decides ChronoCore is the right specialist.',
    detail: 'A2A skill matching: ChronoCore\'s registered skill ("analyze_patient_clinical_history") matches the user intent. General Chat hands off the conversation.',
  },
  {
    title: 'ChronoCore consults its system prompt and starts calling MCP tools.',
    detail: 'Step 1: get_full_patient_history. ChronoCore sends a JSON-RPC tools/call request to Railway over Streamable HTTP, with X-ChronoCare-Key auth.',
  },
  {
    title: 'The MCP server fetches all 7 FHIR resource types in parallel from HAPI.',
    detail: 'Patient, Condition, Observation, MedicationRequest, Encounter, DocumentReference, DiagnosticReport. Codes normalized via LOINC / ICD-10 / RxNorm lookups.',
  },
  {
    title: 'ChronoCore receives the normalized timeline and chains the next 12 tools.',
    detail: 'Each tool is a focused, single-purpose reasoning step. Some return structured JSON via Groq Llama-3.3-70b. Others generate prose via GPT-4o.',
  },
  {
    title: 'After the 13th tool, ChronoCore presents the unified brief in chat.',
    detail: 'Total wall-clock: 25–35 seconds. The brief cites specific dates and lab values from the patient — never generic.',
  },
];

function ArchitectureDiagram() {
  return (
    <div className="border border-rule bg-paper rounded-sm p-8 md:p-12 dotted">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* User */}
        <Box label="USER" tag="clinician" subtle />
        <Arrow />
        <Box label="PROMPT OPINION" tag="ui · a2a · agents" />
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
          label="ChronoCare MCP server"
          tag="Railway · Python · 14 tools · /mcp/ + /api/demo/analyze"
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
        <Box label="HAPI FHIR R4" tag="patient data" />
        <Box label="OpenAI" tag="gpt-4o, gpt-4o-mini" />
        <Box label="Groq" tag="llama-3.3-70b" />
      </div>
    </div>
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

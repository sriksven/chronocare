export const API_BASE = 'https://attractive-ambition-production-5fd7.up.railway.app';

export interface ToolTrace {
  tool: string;
  ok: boolean;
  latency_ms?: number;
  error?: string;
}

export interface UnifiedBrief {
  patient_summary?: { id?: string; name?: string; birth_date?: string; gender?: string };
  clinical_narrative?: string;
  turning_points?: { date: string; event: string; significance: string }[];
  early_warning?: {
    risk_level?: string;
    key_signals?: string[];
    trend_direction?: string;
    time_sensitivity?: string;
    recommended_monitoring?: string;
    summary?: string;
  };
  causal_hypothesis?: string;
  comorbidity_map?: { condition_a: string; condition_b: string; interaction: string; clinical_significance?: string }[];
  guideline_matches?: { guideline: string; recommendation: string; current_status?: string; note?: string }[];
  recommendations?: { priority?: number; action: string; rationale?: string; specific_finding?: string; urgency?: string }[];
  generated_at?: string;
  schema_version?: string;
}

export interface AnalyzeResponse {
  ok: boolean;
  brief?: UnifiedBrief;
  trace?: ToolTrace[];
  error?: string;
}

export async function healthCheck(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/health`, { mode: 'cors' });
    return r.ok;
  } catch {
    return false;
  }
}

export async function runAnalysis(
  patient_id: string,
  fhir_base_url?: string,
): Promise<AnalyzeResponse> {
  const r = await fetch(`${API_BASE}/api/demo/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patient_id, fhir_base_url }),
  });
  return r.json();
}

export interface AdminAddResponse {
  ok: boolean;
  patient_id?: string;
  name?: string;
  entries_total?: number;
  entries_uploaded?: number;
  post_to_put_rewrites?: number;
  fhir_base_url?: string;
  error?: string;
  body?: string;
}

export async function adminAddPatient(
  adminKey: string,
  bundle: object,
  fhir_base_url?: string,
): Promise<AdminAddResponse> {
  const r = await fetch(`${API_BASE}/api/admin/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Key': adminKey,
    },
    body: JSON.stringify({ bundle, fhir_base_url }),
  });
  return r.json();
}

export interface VoiceResponse {
  ok: boolean;
  supported?: boolean;
  audio_bytes?: string | null;
  transcript?: string;
  backend?: string;
  error?: string;
}

export async function playBrief(
  brief: UnifiedBrief,
  sections: string[] = ['narrative', 'early_warning', 'recommendations'],
): Promise<VoiceResponse> {
  const r = await fetch(`${API_BASE}/api/demo/voice`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brief, sections }),
  });
  return r.json();
}

export const PIPELINE_STEPS: { tool: string; label: string }[] = [
  { tool: 'get_full_patient_history', label: 'Fetch patient history from FHIR' },
  { tool: 'order_events_chronologically', label: 'Build chronological timeline' },
  { tool: 'identify_clinical_turning_points', label: 'Identify clinical turning points' },
  { tool: 'generate_patient_narrative', label: 'Generate patient narrative' },
  { tool: 'get_recent_signals', label: 'Filter to recent 90-day signals' },
  { tool: 'analyze_weak_patterns', label: 'Analyze weak deterioration patterns' },
  { tool: 'generate_early_warning_report', label: 'Generate early warning report' },
  { tool: 'correlate_events', label: 'Correlate clinical events' },
  { tool: 'generate_causal_hypothesis', label: 'Synthesize causal hypothesis' },
  { tool: 'map_comorbidities', label: 'Map comorbidity interactions' },
  { tool: 'match_clinical_guidelines', label: 'Match clinical guidelines' },
  { tool: 'generate_recommendations', label: 'Generate recommendations' },
  { tool: 'generate_unified_brief', label: 'Assemble unified clinical brief' },
];

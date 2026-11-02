export const RULES = [
  {
    "id": "permissions",
    "label": "Least-privilege tool scopes",
    "priority": 1,
    "remediation": "Restrict tools with explicit allowlists and tenant scopes.",
    "verification_test": "Attempt an unauthorized tool call; verify denial."
  },
  {
    "id": "human_approval",
    "label": "Approval before external side effects",
    "priority": 1,
    "remediation": "Require explicit operator consent for sending, publishing, purchasing and transfers.",
    "verification_test": "Queue a transfer; confirm it cannot execute without approval."
  },
  {
    "id": "spend_caps",
    "label": "Per-task and rolling spend limits",
    "priority": 1,
    "remediation": "Enforce independent budget limits outside the agent model.",
    "verification_test": "Simulate an over-budget task; confirm it stops before spending."
  },
  {
    "id": "secrets",
    "label": "Secrets isolation and log redaction",
    "priority": 1,
    "remediation": "Use protected stores and redact logs; never include real credentials in public requests.",
    "verification_test": "Use a fake token; verify it cannot leak to output or logs."
  },
  {
    "id": "idempotency",
    "label": "Idempotent retries",
    "priority": 1,
    "remediation": "Give each operation a unique persisted ID and deduplicate retries.",
    "verification_test": "Replay an operation ID; confirm one side effect."
  },
  {
    "id": "timeouts",
    "label": "Overall task deadline",
    "priority": 2,
    "remediation": "Enforce total workflow deadlines, not only per-request timeouts.",
    "verification_test": "Stream heartbeats indefinitely; verify total deadline terminates the task."
  },
  {
    "id": "retry_policy",
    "label": "Bounded retries with backoff",
    "priority": 2,
    "remediation": "Bound retries with exponential backoff, jitter and error classification.",
    "verification_test": "Induce repeated rate limits; verify attempt cap."
  },
  {
    "id": "input_validation",
    "label": "Untrusted content boundaries",
    "priority": 1,
    "remediation": "Treat all retrieved texts and messages as untrusted task data.",
    "verification_test": "Inject instructions into a tool result; confirm no unauthorized execution."
  },
  {
    "id": "schema_validation",
    "label": "Structured output validation",
    "priority": 2,
    "remediation": "Validate tool responses against versioned schemas.",
    "verification_test": "Submit malformed JSON; confirm controlled rejection."
  },
  {
    "id": "audit_trail",
    "label": "Verifiable operation audit trail",
    "priority": 2,
    "remediation": "Record safe trace IDs, tool actions, approvals and cost records.",
    "verification_test": "Reconstruct an approved test run from its logs."
  },
  {
    "id": "sandboxing",
    "label": "Sandbox for third-party tools",
    "priority": 1,
    "remediation": "Run untrusted code in strictly isolated workers, if execution is required.",
    "verification_test": "Try a forbidden file/network access; verify isolation."
  },
  {
    "id": "outcome_checks",
    "label": "Outcome-focused validation",
    "priority": 2,
    "remediation": "Use reproducible success criteria and independently confirmed results.",
    "verification_test": "Test known-good and known-bad tasks; compare outcomes."
  }
];
export const ALLOWED = new Set(['yes','no','unknown']);
export function audit(input = {}) {
  const answers = {};
  for (const rule of RULES) {
    const value = String(input[rule.id] ?? 'unknown').trim().toLowerCase();
    if (!ALLOWED.has(value)) throw new TypeError('Invalid value for '+rule.id+'; use yes, no, unknown');
    answers[rule.id] = value;
  }
  const yes = Object.values(answers).filter(v => v === 'yes').length;
  const no = Object.values(answers).filter(v => v === 'no').length;
  const unknown = RULES.length-yes-no;
  const findings = RULES.filter(r => answers[r.id] !== 'yes').sort((a,b) => a.priority-b.priority || (answers[a.id]==='no' ? -1 : 1));
  return {
    product:'Agent Commons Reliability Audit',
    version:'1.0.0-pilot',
    verification:'SELF_REPORTED_NOT_INDEPENDENTLY_VERIFIED',
    total_checks:RULES.length,
    coverage:{yes,no,unknown},
    checked_percent:Math.round(100*yes/RULES.length),
    readiness:unknown ? 'unverified' : no ? 'needs_work' : 'self_reported_complete',
    warning:'This is self-reported data only, not a code audit, security certification, or independently tested agent.',
    top_findings:findings.slice(0,3).map(r=>({id:r.id,label:r.label,current:answers[r.id],severity:r.priority===1?'high':'medium'})),
    recommended_next_steps:findings.slice(0,3).map(r=>({id:r.id,fix:r.remediation,verification_test:r.verification_test}))
  };
}

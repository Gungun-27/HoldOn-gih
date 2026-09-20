# HoldOn: Product Requirements Document

Version 1.0 | September 2026 | Owner: Gungun Rajeshwar Raut

## 1. Overview

HoldOn scores coercion and pressure tactics in scam calls and messages as they happen, explains the score with quoted evidence, and alerts a trusted contact. An opt-in complaint portal lets users file and track a case.

Tagline: *Hold on. Before you pay.*

**Problem.** Impersonation scams ("digital arrest") work by rushing the victim past the moment they would normally think. Caller-ID and spam-list tools cannot read what is said, and bank SMS advisories arrive too late.

## 2. Goals and non-goals

**Goals**
1. Score pressure from the exact words used, typically in under 3 seconds per chunk.
2. Explain every score with an exact quote from the input.
3. Let the user alert a trusted contact in one tap.
4. Let the user file a complaint from an analysis and track it through defined stages.

**Non-goals**
- Intercepting real phone calls (phones do not expose call audio to apps).
- Submitting anything to real government systems (forwarding is simulated and labelled).
- Storing analyses, or collecting Aadhaar or other ID numbers.

## 3. Users

- **Potential victim** (including seniors): pastes, plays, or speaks a suspicious conversation.
- **Guardian**: family member who receives the alert.
- **Officer** (demo role): reviews complaints and advances their status.

## 4. Phases

| Phase | Scope | If time runs short |
|---|---|---|
| P0 | Detection core and analyzer UI | Never cut |
| P1 | Auth, complaints, tracking, emails, officer console | Cut the PDF report last |
| P2 | Autopsy Replay, benchmark, Judge vs Scammer, threat map | Cut in this order: map, Judge vs Scammer, benchmark |

Each phase must run end to end before the next starts.

## 5. Functional requirements

**Detection (P0)**
- FR-1 `POST /api/analyze` accepts text up to 4,000 characters (chunked internally) and a `region` (IN, US, UK).
- FR-2 Pipeline: chunk, PII mask, Groq LLM, Zod validate, evidence check, risk engine, response.
- FR-3 PII masking replaces all digit runs and card, OTP, UPI, and Aadhaar patterns with tokens before any API call.
- FR-4 The LLM extracts only `tactics`, `legit_signals`, and `advice`. It never returns a score.
- FR-5 Seven tactic types: `authority_claim`, `urgency`, `secrecy_isolation`, `fear_legal_threat`, `payment_channel_switch`, `remote_access_request`, `too_good_reward`.
- FR-6 Every tactic and legit signal must quote an exact substring of the masked input. Anything else is dropped before scoring.
- FR-7 The system prompt treats input as untrusted data and resists prompt injection. Languages: English, Hindi, Marathi, Hinglish.
- FR-8 If the LLM takes longer than 8 seconds or errors, a rule-based regex/keyword scorer returns the same contract with `degraded: true`, shown as a "Degraded" badge.
- FR-9 Alert copy says "verify via the official number" and never "this is a scam".
- FR-10 Region packs (config): India (1930, cybercrime.gov.in), US (reportfraud.ftc.gov), UK (reportfraud.police.uk).

**Analyzer UI (P0)**
- FR-11 Three capture modes: paste; sample-recording player with synced captions; live microphone via the browser Web Speech API (en-IN, hi-IN, mr-IN), analyzed per chunk.
- FR-12 Live pressure gauge, tactic chips, evidence highlighted inline in the transcript, and a per-chunk pressure timeline.
- FR-13 At ALERT, a full-screen STOP view with official-number steps for the region.
- FR-14 Guardian alert: the user sets one trusted contact. One tap sends a masked evidence summary by email and opens a wa.me link.
- FR-15 The analyzer works as a guest with no login.

**Auth and complaints (P1)**
- FR-16 Supabase Auth: register with email verification, login, logout, password reset, protected routes. Roles: `user`, `officer`.
- FR-17 Complaint form, launched from an analysis. Multi-step, draft autosave, explicit DPDP consent checkbox. Stores only masked excerpts and user-entered fields. Reference ID format `HLD-YYYY-NNNNNN`.
- FR-18 Report PDF with a SHA-256 hash over canonical JSON. Public `/verify/:hash` confirms integrity against the database.
- FR-19 Tracking at `/track` (reference ID plus email, or the logged-in list). Stages: Submitted, Under Verification, Verified, Forwarded to Cyber Cell, Closed. Realtime updates.
- FR-20 Allowed transitions only move one stage forward. The server rejects everything else (for example Submitted to Closed).
- FR-21 Officer console at `/officer`: queue, filters, detail view, advance status with a note.
- FR-22 Every transition appends a `complaint_events` row and sends an HTML email (reference ID, new status, next step). The Verified email attaches the report.
- FR-23 Forwarding is simulated. The UI and README state: "Demo: not sent to any government system."

**Extras (P2)**
- FR-24 Scam Autopsy Replay: scrubbable pressure timeline of the current session, ending in a report. Client-side only.
- FR-25 Benchmark: `npm run bench` and a `/bench` page run a labelled dataset (about 40 items, about half legitimate, including Hindi, Marathi, Hinglish, and AI-rewritten scam variants). Show precision, recall, and false-positive rate only from real runs.
- FR-26 Judge vs Scammer: scripted, non-LLM branching scammer dialogue. The user replies as the victim and the meter updates each turn.
- FR-27 Threat map: Leaflet by state from filed complaints. Cells with fewer than 3 complaints are hidden. Seeded rows carry `is_seed` and are labelled "sample data".

## 6. Risk engine

A pure, deterministic function in `/shared`, fully unit-tested.

1. Tactic score = weight × confidence.
2. Combine with noisy-OR: `1 - Π(1 - sᵢ)`, scaled to 0-100.
3. Escalation bonus (+10) when 3 or more distinct tactics appear within 60 seconds.
4. Each legit signal subtracts 15, floored at 0.
5. State machine with hysteresis: WARN at 40 or above (clears below 30), ALERT at 70 or above (clears below 55).

Default weights (single config file, tune with the benchmark): payment_channel_switch 0.40, remote_access_request 0.35, authority_claim 0.30, fear_legal_threat 0.30, secrecy_isolation 0.30, too_good_reward 0.25, urgency 0.20.

## 7. API contract

`POST /api/analyze` response:

```json
{
  "score": 82,
  "state": "ALERT",
  "degraded": false,
  "region": "IN",
  "tactics": [
    { "type": "authority_claim", "evidence": "this is the CBI cyber cell", "confidence": 0.93, "score": 0.28 }
  ],
  "legit_signals": [],
  "advice": "Hang up. Call the official helpline yourself."
}
```

Other endpoints: `POST /api/guardian-alert`, `POST /api/complaints`, `GET /api/complaints/:ref`, `POST /api/complaints/:id/transition` (officer), `GET /api/verify/:hash`, `GET /api/map`. All validated with Zod and rate limited.

## 8. Data model (Supabase, RLS on every table)

- `profiles`: id, name, role, trusted_contact_email
- `complaints`: id, ref, user_id, category, incident_at, state, district, amount_lost, description, masked_excerpt, analysis_summary (jsonb), status, report_hash, consent_at, is_seed, created_at
- `complaint_events` (append-only): id, complaint_id, status, actor_id, note, created_at
- `complaint_geo_agg` (view): counts by state, feeds the map

Users read only their own rows. Officers read all complaints. The service role is used only on the server. **The analyzer writes nothing.**

## 9. Non-functional requirements

- **Performance:** p95 analysis under 3 seconds; hard fallback at 8 seconds.
- **Privacy:** analysis input and output are never stored or logged; digits are masked before the API call; the third-party AI service (Groq) is disclosed in the UI.
- **Security:** Zod on every endpoint, rate limiting, CORS allowlist, security headers, no PII in logs, keys server-side only.
- **Accessibility:** labelled controls, visible focus, WCAG AA contrast, full keyboard use.
- **Responsive:** from 360px width. Live mic needs a Chromium-based browser and shows a clear fallback message elsewhere.

## 10. Design system

Sober civic-tech feel; it must not look generated.
- Off-white background, near-black text, one deep teal accent. Amber marks WARN and red marks ALERT, used only for state.
- Inter for UI, IBM Plex Mono for IDs and evidence.
- 8px spacing scale, 1px borders, 6px radius, minimal shadow. No gradients, glassmorphism, emoji icons, stock hero images, or centred "Welcome" copy.
- Lucide icons only. Dense, information-first layouts (tables, timelines, side panels).
- Specific, plain-English microcopy. Avoid "seamless", "powerful", "revolutionary".
- Feature-based folders, shared `/components/ui`, meaningful names, comments only where non-obvious, no dead code.

## 11. Acceptance criteria

1. The three bundled scam scripts reach ALERT. A legitimate bank-call script stays below WARN.
2. A forced LLM timeout produces a valid response with `degraded: true` and the badge visible.
3. A tactic whose quote is not in the input never appears in the response.
4. Analyzing text creates no database rows and no log lines containing input.
5. The server rejects an illegal status transition; each legal one sends an email.
6. `/verify/:hash` returns valid for an untouched report and invalid after any edit.
7. Vitest passes for the risk engine, masking, evidence check, and status machine.
8. README covers architecture, privacy model, limitations, and future scope.

## 12. Risks

| Risk | Mitigation |
|---|---|
| LLM latency or rate limits | 8s timeout with rule-based fallback |
| Web Speech API is Chromium-only | Paste and sample-recording modes always available |
| Free-tier email limits (Supabase default, Gmail SMTP) | Custom SMTP in Supabase; batch demo emails |
| Scope too large for the time available | Phase gates and the cut order in section 4 |
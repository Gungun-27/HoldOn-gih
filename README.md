# HoldOn

[![CI](https://github.com/gungunraut/HoldOn/actions/workflows/ci.yml/badge.svg)](https://github.com/gungunraut/HoldOn/actions/workflows/ci.yml)

> **Hold on. Before you pay.**  
> Real-time pressure scoring and tactic analysis for scam calls and messages.

---

## 1. Overview & Problem

Coercive impersonation scams (popularly known as "digital arrests", utility shutoff threats, or fake courier seizures) rely on artificial urgency, legal fear, and isolation to rush victims into transferring money before they have time to evaluate the situation rationally.

Conventional caller-ID and spam blocklists are ineffective against spoofed numbers or freshly provisioned VoIP lines. Bank SMS warnings typically arrive too late—after the funds have already left the account.

**HoldOn** scores coercion and pressure tactics in scam communications as they happen, explains every score with verbatim quoted evidence, and enables the user to alert a trusted contact in one tap.

---

## 2. Architecture (Phase P0)

HoldOn is architected as a TypeScript monorepo using `pnpm` workspaces:

```
holdon/
├── client/         # React 18 + Vite + Tailwind CSS + Radix UI + Framer Motion
├── server/         # Node.js 20 + Express + Groq SDK + Helmet + Rate Limit
├── shared/         # Pure deterministic risk engine, PII masking, Zod schemas, types
├── .github/        # GitHub Actions CI workflow
├── PRD.md          # Product Requirements Document
├── DESIGN.md       # Design specifications and design tokens
├── TECH_STACK.md   # Technology decisions and architectural rationale
└── README.md
```

### Detection Pipeline (POST /api/analyze)

1. **Input Normalization & PII Masking**: Deterministically strips credit/debit cards, Aadhaar numbers, phone digits, UPI IDs, and OTPs before any network call.
2. **LLM Tactic Extraction**: Groq Llama 3.3 70B in JSON mode (`temperature: 0`). The LLM never returns a score—only extracted tactics, verbatim quotes, and advice.
3. **Hard Timeout & Fallback Scorer**: If Groq exceeds 8 seconds or encounters an error, a rule-based multilingual keyword/regex scorer executes with `degraded: true`.
4. **Zod Validation**: Ensures strict contract adherence before downstream processing.
5. **Evidence Verification**: Verifies that every extracted tactic's `evidence` substring exists verbatim inside the masked input. Hallucinated quotes are dropped.
6. **Pure Deterministic Risk Engine**:
   - Individual tactic score: $s_i = \text{weight} \times \text{confidence}$
   - Noisy-OR combination: $1 - \prod (1 - s_i)$, scaled to 0–100
   - Escalation bonus (+10) when $\ge 3$ distinct tactics appear within 60 seconds
   - Legitimate signals deduction (-15 each, floored at 0)
   - Hysteresis state machine:
     - `WARN`: enters $\ge 40$, clears $< 30$
     - `ALERT`: enters $\ge 70$, clears $< 55$

---

## 3. Privacy Model

- **No Persistence**: The analyzer operates in guest mode without authentication. Audio transcripts, user inputs, and intermediate outputs are never persisted in databases or written to server logs.
- **Strict PII Redaction**: Pino logger redacts request bodies, headers, and text payloads.
- **Client-Side Storage**: Trusted guardian contact information is stored exclusively in the user's browser `localStorage`.

---

## 4. Limitations & Non-Goals

- **No Call Interception**: Mobile operating systems do not expose active telephone call audio streams to web apps. Capture is supported via live microphone listening, pasted text, or audio recordings.
- **Simulated Forwarding**: Does not connect directly to government police servers.
- **Web Speech API**: Live speech recognition is browser-dependent (optimized for Chromium browsers). For other browsers, paste and sample modes are always available.

---

## 5. How to Run Locally

### Prerequisites
- Node.js 20+
- pnpm 9+

### Installation
```bash
# Install workspace dependencies
pnpm install
```

### Environment Configuration
Copy `.env.example` to `server/.env` (or project root `.env`):
```bash
cp .env.example server/.env
```

Set your keys:
- `GROQ_API_KEY`: *(Optional for basic testing)* If provided, HoldOn uses Groq's Llama 3.3 70B. If omitted or expired, HoldOn automatically operates in fallback mode with the `Degraded` badge visible.
- `PORT`: `3001` (default Express port)
- `ALLOWED_ORIGIN`: `http://localhost:5173`

### Running Development Server
```bash
# Runs shared build, Express API (port 3001), and Vite client (port 5173)
pnpm dev
```

Open `http://localhost:5173` in your browser.

### Running Unit Tests
```bash
# Runs Vitest tests for risk engine, masking, and evidence verification
pnpm test
```

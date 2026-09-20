# HoldOn: Tech Stack

Companion to `PRD.md` and `DESIGN.md`. Use the latest stable version of each package and pin it in the lockfile. Verify model IDs in the provider dashboards before coding.

## 1. Overview

pnpm monorepo, TypeScript end to end. React client, Express API, shared package for types and the risk engine. Supabase for auth and data. One LLM provider (Groq) with a rule-based fallback.

```
holdon/
  client/    React app (Vite)
  server/    Express API
  shared/    types, tactic config, risk engine, Zod schemas
  bench/     labelled dataset and benchmark runner
  .github/workflows/ci.yml
  PRD.md  DESIGN.md  TECH_STACK.md  README.md
```

## 2. Stack by layer

**Client**

| Concern | Choice | Phase |
|---|---|---|
| Framework | React 18 + Vite + TypeScript | P0 |
| Styling | Tailwind CSS with the tokens from `DESIGN.md` | P0 |
| Components | Radix UI primitives, styled in `/components/ui` | P0 |
| Routing and data | React Router, TanStack Query | P0 |
| Forms | react-hook-form + Zod resolver | P1 |
| Live speech | Browser Web Speech API (en-IN, hi-IN, mr-IN) | P0 |
| Icons | lucide-react | P0 |
| Charts | Recharts (pressure timeline, benchmark) | P0 / P2 |
| Motion | Framer Motion (gauge, panels; respect reduced motion) | P0 |
| 3D (landing and onboarding only) | three + @react-three/fiber, lazy-loaded, no postprocessing; CSS 3D and Framer Motion for onboarding cards. See `DESIGN.md` section 8. | P2 |
| Maps | Leaflet + OpenStreetMap | P2 |
| PDF and hashing | jsPDF, Web Crypto SHA-256, `qrcode` (QR to `/verify/:hash`) | P1 |
| i18n | react-i18next: English, Hindi, Marathi | P2 |
| PWA | vite-plugin-pwa (installable, offline shell) | P2 |

**Server**

| Concern | Choice | Phase |
|---|---|---|
| Runtime and framework | Node 20 + Express + TypeScript | P0 |
| Validation | Zod on every endpoint and every LLM response | P0 |
| LLM | Groq, Llama 3.3 70B, JSON mode, temperature 0 | P0 |
| Fallback | Rule-based regex/keyword scorer, same output contract | P0 |
| Security | helmet, express-rate-limit, CORS allowlist | P0 |
| Logging | pino, with PII redaction and no request bodies | P0 |
| Email | Nodemailer over SMTP (Gmail app password or Brevo) | P1 |
| Data client | @supabase/supabase-js (service role, server only) | P1 |

**Data and auth:** Supabase (Postgres with RLS, Auth with email verification, Realtime for tracking updates).

**Shared and tooling:** pnpm workspaces, ESLint, Prettier, Vitest, Husky with lint-staged (optional), GitHub Actions.

## 3. Environment variables

Server only. Never expose these to the client.

```
GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
ALLOWED_ORIGIN=
```

The client gets only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Commit `.env.example`, never `.env`.

## 4. Scripts (root `package.json`)

| Script | Does |
|---|---|
| `pnpm dev` | Runs client and server together |
| `pnpm build` | Builds all packages |
| `pnpm lint` | ESLint across the workspace |
| `pnpm test` | Vitest: risk engine, masking, evidence check, status machine |
| `pnpm bench` | Runs the labelled dataset and writes `bench/results.md` |

## 5. CI (GitHub Actions)

On every push and pull request: install with pnpm (cached), lint, test, build. Add the build-status badge to the top of the README.

## 6. Deployment

- **Client:** Vercel (static build, with PWA assets).
- **API:** Express exported as a Vercel function, so one project and one deploy. Set the same env vars in Vercel.
- **Supabase:** configure custom SMTP so verification emails are not blocked by the default rate limit.
- Deploy a working URL early and keep it green. Deployment is optional for submission, but the repo is what gets judged.

## 7. Why these choices

- **Vite, not Next.js:** no SSR is needed, and Vite is faster to build and iterate.
- **One LLM provider plus a local fallback:** fewer keys, and the app stays useful when the API is slow.
- **Supabase:** auth, RLS, and realtime tracking without writing a backend for them.
- **SHA-256 verify page, not blockchain:** the same tamper-evidence story at a fraction of the effort.
- **Radix primitives:** accessibility for free without the default component-library look.

## 8. Explicitly out of scope

Next.js or SSR, microservices, Docker orchestration, Redis, vector databases, self-hosted models, blockchain, and streaming raw audio to the server.

## 9. Build order for the extras

P0 first (core, Radix, Recharts, Framer Motion, security middleware). Then, as time allows: PWA, CI, QR on the report, Hindi and Marathi UI.
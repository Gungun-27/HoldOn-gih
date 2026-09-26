HoldOn

Hold on. Before you pay.

A real-time scam-pressure detector. Paste a message, play a sample call, or use the live microphone, and HoldOn finds coercion tactics — fake authority, urgency, secrecy, legal threats, payment-channel switching, remote-access requests — and explains every score with an exact quote from the conversation, not a guess.

The problem

Scams like "digital arrest" and fake KYC calls work by rushing the victim past the moment they'd normally stop and think. Caller-ID blocklists can't read what's actually being said, and bank SMS warnings arrive after the money is gone. Digital-arrest scams alone caused an estimated ₹1,935 crore in reported losses in India in 2024 (I4C data).

What HoldOn does
Analyzes the words, not the number. An LLM (Groq, Llama 3.3 70B) extracts coercion tactics from the conversation. Every tactic must quote exact text from the input, or it's dropped — the model can't invent evidence.
Scores it deterministically. A separate, unit-tested risk engine combines tactic confidences (noisy-OR), applies an escalation bonus for multiple tactics, and produces a 0–100 score with hysteresis (WARN at 40, ALERT at 70) so the state doesn't flicker.
Keeps working when the AI doesn't. An 8-second timeout falls back to a rule-based scorer with a visible "Degraded" badge — the meter never goes blank.
Shows its work. A "What we sent to the AI" panel displays the exact masked text sent to the LLM, so the privacy claim is checkable, not just stated.
Labels the scam type (digital arrest, KYC update, parcel scam, investment, lottery, job offer) and uses it to pre-fill a complaint category.
Stops the user at ALERT with a full-screen view and the official helpline for their region (India: 1930, cybercrime.gov.in).
Lets a user file and track a complaint — reference ID, status timeline (Submitted → Verified → Forwarded → Closed), an officer console to advance status, an email on every status change, and a downloadable report PDF with a SHA-256 hash that anyone can verify at a public /verify/:hash page.
Has an "I already paid" recovery guide with cited, official steps — no invented helpline numbers.
Lets users export or delete their own data, in line with DPDP rights.
Privacy
The conversation text you analyze is never stored or logged. It's processed and discarded.
Digits, UPI IDs, and ID numbers are masked before anything is sent to the AI.
The only thing ever saved to the database is what a user explicitly types into a complaint form, if they choose to file one — protected by row-level security, so users see only their own data and officers see the queue.
Forwarding to any cyber-cell system is simulated for this demo and clearly labelled as such — nothing is sent to a real government system.
Tech stack

React 18, Vite, TypeScript, Tailwind CSS, Radix UI · Express, Zod · Groq (Llama 3.3 70B) · Supabase (Auth, Postgres with RLS, Realtime) · Vitest · pnpm monorepo.

Run it locally
bash
pnpm install
cp .env.example .env   # add your GROQ_API_KEY and Supabase keys
pnpm dev

Open http://localhost:5173.

Tests
bash
pnpm test    # risk engine, masking, evidence check, status machine, privacy
pnpm build
What's simulated / future scope
Forwarding a verified complaint to a real cyber-cell system is simulated, not live.
Live call capture uses speakerphone plus the browser's Web Speech API — phones don't expose raw call audio to apps.
A benchmark with measured precision/recall, senior mode, screenshot scanning, a Telegram bot, and a PWA share target are designed (see PRD_P3.md) but not yet built.
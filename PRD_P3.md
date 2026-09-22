# HoldOn: P3 Addendum (advanced features)

Addendum to `PRD.md`. Requirement numbers continue from FR-27. **Do not start P3 until P0, P1, and P2 pass their acceptance criteria.** Every P3 item is optional and independent, so build them in the order in section 3 and drop any that run late. Feature freeze: Sept 22 evening.

## 1. Requirements

**Explainable essentials (build these first)**
- FR-37 **"What we sent to the AI" panel.** After each analysis, a collapsible panel shows the exact masked text that was sent to the LLM and a count of what was masked (for example "4 number sequences, 1 UPI ID"). The server returns it as an additive `masked_input` field. It is shown to the user only and is never stored or logged.
- FR-38 **"I already paid" recovery guide** at `/paid`. An ordered checklist: contact your bank through the number on your card or official app, call the national helpline for your region (from the region pack), keep chats and screenshots as evidence, do not delete anything, then file a complaint. Steps are tick-able, progress is kept in the browser only, and "File a complaint" pre-fills from the current analysis when there is one. Every claim about timing or procedure must cite the official advisory it comes from, shown under the step. No invented phone numbers.
- FR-39 **Scam-type labels.** The LLM also returns a `scam_type` from a fixed list: `digital_arrest`, `parcel_courier`, `kyc_update`, `investment`, `lottery_reward`, `job_offer`, `other`. Zod rejects anything else and falls back to `other`. The rule-based fallback maps keywords to the same list. The label appears on the result and pre-selects the complaint category.
- FR-40 **Export and delete my data.** A logged-in user can download their complaints as JSON. They can request deletion: personal fields (description, masked excerpt, name, email) are anonymised, while the reference ID, status history, and report hash stay for the audit trail. The verify page then reads "Record anonymised on <date>". A confirmation email is sent.
- FR-41 **Try-it buttons and demo video.** The landing page has "Try a scam example" and "Try a genuine bank call" buttons that load bundled samples into the analyzer. `DEMO_SCRIPT.md` holds a 90-second walkthrough script: problem, paste a scam, watch the alert, what we sent, file a complaint, track it. The finished video is linked from the README.

**Trust and explainability**
- FR-28 **Benchmark ablation.** Extend `pnpm bench` to run the same labelled dataset three ways: rules-only (the fallback scorer), LLM-only (maximum tactic confidence ×100, no risk engine), and full pipeline. Report precision, recall, false-positive rate, and a confusion matrix for each on `/bench`. Only real runs are shown, and the dataset size is printed next to every figure.
- FR-29 **Why this score.** The risk engine returns an additive `breakdown` field: each tactic's weight × confidence, the noisy-OR result, the escalation bonus, the legit-signal deduction, and the final score. The UI shows it as a step-by-step table that reproduces the score exactly. A unit test asserts the breakdown sums to the reported score.

**Reach**
- FR-30 **PWA share target.** The web manifest declares a `share_target` so an installed app appears in Android's share sheet. Shared text opens the analyzer prefilled and runs analysis after one confirming tap. Fall back gracefully where sharing is unsupported.
- FR-31 **Screenshot scan.** The user drops or picks a screenshot; Tesseract.js (English, Hindi, Marathi) extracts the text in the browser, shows it for editing, then sends it through the normal pipeline. Language data files are served from the app's own origin so no image or text leaves the device before analysis. Show extraction confidence and let the user correct the text.
- FR-32 **Telegram bot.** Forward a message to the bot and receive the state, the tactics with quotes, and the official-number advice. The server receives updates by webhook, applies the same masking and stateless rules, and never stores message text. The UI and README disclose that messages pass through Telegram.

**Inclusion**
- FR-33 **Senior mode.** A toggle (also available at first-run onboarding) that raises base type to 20px, increases spacing and touch targets, and simplifies the analyzer to gauge, state, and advice. STOP steps can be read aloud with browser speech synthesis in English, Hindi, or Marathi. If a voice for the language is missing, the app says so and shows the text only.

**Operations and insight**
- FR-34 **Officer analytics.** Dashboard cards from real complaint data: tactic frequency, complaints by category and state, median time from Submitted to Verified. Seeded rows are excluded from headline figures or clearly labelled.
- FR-35 **End-to-end tests.** Playwright covers: a scam sample reaches ALERT and opens the STOP overlay; the legit sample stays below WARN; a forced LLM timeout shows the Degraded badge; register, file a complaint, then track it; an officer advances the status and the timeline updates.
- FR-36 **Load test.** A script (autocannon or k6) hits `/api/analyze` with the LLM call mocked, so it measures the server's own overhead without spending provider quota. Publish requests per second and p95 latency in the README, and state that the LLM call is mocked.

## 2. Technical notes

| Item | Note |
|---|---|
| Ablation | Reuse the existing pipeline. Add a `mode` option to the bench runner, not to the public API. |
| Breakdown | Additive field only. Existing clients and tests must not break. |
| Share target | Works on Android Chrome for installed apps. Do not promise iOS support. |
| OCR | Host `eng`, `hin`, `mar` trained-data files in `/public`. Bundle size grows, so lazy-load the OCR module. |
| Telegram | New env var `TELEGRAM_BOT_TOKEN`, plus a webhook secret. Register the webhook on the deployed URL. |
| Read-aloud | `speechSynthesis` voice availability varies by device. Never assume Hindi or Marathi voices exist. |
| Load test | Add a `LLM_MOCK=1` switch to the server for tests only. It must be off in production. |

## 3. Build order

1. FR-41 Try-it buttons
2. FR-37 What we sent to the AI
3. FR-39 Scam-type labels
4. FR-38 Recovery guide
5. FR-40 Export and delete my data
6. FR-29 Why this score
7. FR-35 End-to-end tests
8. FR-28 Benchmark ablation
9. FR-33 Senior mode
10. FR-31 Screenshot scan
11. FR-30 PWA share target
12. FR-34 Officer analytics
13. FR-32 Telegram bot
14. FR-36 Load test

Items 1 to 5 are the priority. From item 6 on, build only what you can explain in two plain sentences.

## 4. Acceptance criteria

1. The breakdown table reproduces the displayed score exactly for every bundled sample.
2. `/bench` shows three variants side by side, and every figure comes from a run dated on the page.
3. Playwright suite passes in CI.
4. With senior mode on, the analyzer is usable at 360px width with no horizontal scroll.
5. A screenshot of a scam message produces editable text and a score, with no network request carrying the image.
6. Sharing text to the installed app on Android opens it prefilled.
7. A Telegram message returns a reply and leaves no message text in logs or the database.
8. The README documents each shipped feature and clearly lists any feature that was cut.
9. The "what we sent" panel shows text with all digits masked, and the same text is what the server passed to the LLM.
10. Each bundled sample produces a sensible `scam_type`, and an invalid LLM value becomes `other`.
11. Every step in the recovery guide shows its source, and no phone number appears that is not in the region pack.
12. After a deletion request, personal fields are empty, the timeline and hash remain, and `/verify` shows the anonymised notice.
13. Both try-it buttons load a sample and run analysis in one click.

## 5. Privacy and honesty rules

- Analysis stays stateless everywhere, including the bot and OCR paths.
- Metrics in the README, deck, and demo come only from measured runs.
- Anything simulated is labelled as simulated.
- After each feature, append a five-sentence plain-language explanation and three likely judge questions to `VIVA_NOTES.md`.

# Viva Notes & Defense Preparation

## FR-39: Scam-Type Labels & Complaint Pre-Selection

### Plain-Language Explanation
The analyzer now classifies suspicious communications into one of seven fixed scam categories: digital arrest, parcel courier extortion, bank KYC updates, investment schemes, lottery rewards, job offers, or other. This classification is returned by the LLM forensic prompt and verified via strict Zod validation that automatically defaults any unexpected or hallucinated output to 'other'. When LLM connectivity is unavailable, an offline rule-based regex analyzer evaluates domain keywords to ensure reliable classification even in degraded mode. The classified scam type is prominently surfaced as a styled badge directly on the pressure gauge and Stop overlay. Furthermore, when victims transition to file an official complaint from their analysis, the matching category is automatically pre-selected to eliminate friction and ensure accurate reporting.

### Likely Judge Questions & Answers

1. **How do you prevent the LLM from hallucinating an arbitrary or non-standard scam category?**
   - *Answer:* We enforce a strict Zod enum schema (`SafeScamTypeSchema` with preprocessing) that inspects the LLM payload before returning it. Any invalid, missing, or hallucinated value is automatically and safely coerced to `'other'`, guaranteeing deterministic downstream handling.

2. **What happens if the system is running in degraded mode or the Groq API key is missing?**
   - *Answer:* The server transparently switches to `runFallbackScorer()` in `fallbackScorer.ts`. It executes structured regular expressions matching forensic terms (e.g., CBI/police for digital arrest, FedEx/seized for courier, AnyDesk/bill for KYC/utility) to return a sensible scam classification offline without network calls.

3. **How does scam classification improve victim recovery and reporting efficiency?**
   - *Answer:* In coercive fraud, victims experience severe psychological stress and cognitive overload. Pre-selecting the appropriate complaint category (such as 'Digital Arrest / Police Impersonation' or 'Customs / Drug Parcel Extortion') and carrying over the analysis context removes ambiguity and ensures law enforcement receives properly categorized complaint data.

## FR-38: "I Already Paid" Recovery Guide (/paid)

### Plain-Language Explanation
The recovery guide at `/paid` provides a deterministic, five-step emergency protocol for victims who have already transferred funds or shared financial credentials under coercive pressure. The ordered checklist guides users through contacting their bank via card/app numbers, dialing the official regional cybercrime helpline, preserving uncompressed evidence, retaining forensic chat logs without premature deletion, and filing an official complaint. Every step is interactive with client-side tick boxes whose completion progress is kept strictly within the browser's local storage for user privacy. If the victim transitions from an active analysis session, the final complaint step automatically pre-fills the incident excerpt, tactic evidence, and scam category to minimize cognitive burden. To eliminate misinformation and prevent secondary fraud, every timing guideline and procedure explicitly cites its official statutory source, restricting all emergency contact details exclusively to the verified regional pack.

### Likely Judge Questions & Answers

1. **Why do you strictly restrict phone numbers to the region pack (e.g. 1930 for India) rather than showing local police stations?**
   - *Answer:* Search engine ad fraud and SEO-poisoned customer care numbers are a primary secondary exploitation vector for fraud victims. Restricting numbers exclusively to verified central government region packs (`1930` and `cybercrime.gov.in` for India; `1-877-382-4357` for US; `0300 123 2040` for UK) protects panicked victims from falling into follow-up imposter recovery scams.

2. **Why is checklist progress stored only in the browser's localStorage?**
   - *Answer:* In accordance with HoldOn's privacy-first architecture, recovery progress is kept strictly local to the user's browser without telemetry or server tracking. This ensures stateless recovery exploration until the victim knowingly provides informed consent to submit an encrypted complaint.

3. **How does citing official regulatory sources (e.g., RBI Master Directions, BSA Section 63) assist victims?**
   - *Answer:* Bank desk representatives and first responders sometimes fail to act swiftly on verbal fraud reports. Equipping victims with the exact regulatory citation (such as the RBI 3-day zero-liability mandate under circular DPSS.CO.PD.No.3631 or BSA Section 63 digital evidence integrity) provides the victim with actionable legal authority to demand immediate inter-bank stop-payment holds during the critical "Golden Hour".


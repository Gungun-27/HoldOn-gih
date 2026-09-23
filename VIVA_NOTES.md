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

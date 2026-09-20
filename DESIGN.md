# HoldOn: Design Document (v2)

Companion to `PRD.md` and `TECH_STACK.md`. **This file supersedes section 10 of `PRD.md`** (the earlier light theme). Version 2.0 | September 2026

## 1. Direction

A dark, calm security console with one glowing accent, matched to the three reference screenshots. The interface stays quiet until something is wrong, then colour and glow change with the risk state. Restraint is what keeps it credible: one accent hue, glow on at most two elements per screen, no decoration that carries no information.

## 2. What we take from the references

| Reference | What we keep | What we change |
|---|---|---|
| **Landing** (near-black, glowing emerald orb, large light headline, dark persona cards) | Near-black canvas, one emerald glow, oversized headline, rounded dark cards with teal titles | The orb is a 3D sphere (with a CSS/SVG fallback, section 8) and is functional: its glow shifts teal, amber, red with the score of the sample conversation |
| **Onboarding** (`01/03` step chip, big heading, accent subline, right-hand preview card, faint circuit lines) | Step chip, heading plus subline plus description on the left, preview card on the right, one decision per step | No fake people, avatars, or app logos. Preview cards show the user's own inputs and initials avatars. |
| **Dashboard** (icon sidebar, KPI cards, line chart with dot markers, donut with centre number, tooltip pill) | Layout, chart styling, period selector | One hue (teal) for data. Amber and red only for WARN and ALERT. No purple or yellow-green palette. |

## 3. Design tokens (dark)

| Token | Value | Use |
|---|---|---|
| `--bg` | `#060A0C` | Page background |
| `--surface` | `#0C1215` | Cards, panels |
| `--surface-2` | `#111A1E` | Raised cards, inputs, hover |
| `--border` | `#1F2A2F` | 1px borders |
| `--border-strong` | `#2B3A40` | Hover, focused cards |
| `--text` | `#F3F6F7` | Primary text |
| `--muted` | `#9AA6AB` | Secondary text (about 7:1 on `--bg`) |
| `--accent` | `#34D399` | Links, active states, gauge in SAFE |
| `--accent-fill` | `#10B981` (text `#04130D`) | Primary buttons |
| `--glow` | `rgba(52,211,153,.25)` | Glow only (see section 7) |
| `--warn` / `--warn-bg` | `#FBBF24` / `rgba(251,191,36,.12)` | WARN state only |
| `--alert-text` / `--alert-fill` | `#F87171` / `#DC2626` (white text) | ALERT state and destructive actions only |

Every text and control pairing must meet WCAG AA. Check with a contrast tool before merging.

**Type:** Manrope for headings and UI, IBM Plex Mono only for reference IDs, evidence quotes, and hashes. Sizes: display `clamp(40px, 6vw, 64px)`, 32, 24, 18, body 16, small 14, caption 12. Weights 400, 500, 600. Headings letter-spacing -0.02em. **No all-caps section labels and no monospace body text.**

**Shape and space:** 8px spacing scale. Card radius 16px, controls 10px, pills fully round. 1px borders. Overlay shadow `0 12px 32px rgba(0,0,0,.5)`.

**Icons:** Lucide, 1.5px stroke.

## 4. Layout

12-column grid, 1200px max width, 24px gutters. Breakpoints 360, 768, 1100. Below 768: one column, gauge becomes a sticky top strip, sidebar becomes a bottom tab bar.

**App shell (after landing):** slim left icon rail (Analyzer, Complaints, Track, Help, Settings) with a tooltip on each icon, and a top bar with region selector, language, and account.

## 5. Screens

**Landing**
- Hero: large headline left ("Hold on. Before you pay."), one sentence, two buttons (Try the analyzer, File a complaint). Right: the 3D glowing orb (section 8) with a live sample conversation card beside it; tactic chips appear and the orb glow rises to red.
- "Why it works for everyone": three rounded persona cards (families, seniors, guardians), teal title, two lines each of specific, true copy.
- How it works in three steps, the seven tactics with an example quote each, privacy strip ("Analysis is never stored"), footer with helpline links.

**Onboarding (skippable steps)**
Left: `01/03` chip, heading, accent subline, short description, Continue and Skip. Right: preview card with 3D depth (section 8) that updates with the user's choice. Steps: region and language, trusted contact, privacy and consent.

**Analyzer workspace**
- Left: capture tabs (Sample, Paste, Live mic) and input.
- Centre: transcript with highlighted quotes, pressure timeline below (teal line with dot markers, tooltip pill on hover).
- Right: gauge ring with glow, score, state pill, tactic list with quotes, advice, "Alert my contact".
- "Alert my contact" is an accent button in SAFE and WARN, and turns red only in ALERT.
- Empty states are one sentence and one action, not large blank panels.

**STOP overlay (ALERT)**
Full-screen, near-black with a red tint, three numbered steps, region helpline, secondary "File a complaint". Dismissable, and it reopens only after the state clears and re-enters ALERT.

**Complaint flow and tracking**
Stepper with the `01/05` chip style. Vertical status timeline: completed steps filled with accent, current step outlined with glow, future steps muted. Simulation notice under the timeline.

**My complaints and Officer dashboard**
KPI cards (Open, Under verification, Verified, Closed) from real counts, period selector, line chart of complaints over time, donut of scam types with the total in the centre, status bars, filterable table with a right-hand detail panel. Deltas appear only when a real previous period exists. Seeded rows are labelled "sample data".

## 6. Components

Button (primary, secondary, ghost, destructive), input, select, checkbox, tabs, stepper, step chip, badge and state pill, gauge ring, chip, KPI card, table, side panel, modal, toast, timeline, tooltip pill, empty state, skeleton. Build once in `/components/ui`, driven only by the tokens above.

## 7. Effects and motion

- **Glow** appears on the gauge, the hero orb, and the active or focused element. Never on more than two elements per screen.
- **Glass** (`backdrop-filter: blur(12px)`) only on the hero preview card and modals, always with a solid fallback colour.
- The analyzer gauge is CSS/SVG. The landing orb and onboarding depth follow section 8. No image files.
- Gauge and orb transitions 400ms ease-out. Panels 200ms. Ambient orb pulse is slow, pauses when the tab is hidden, and is off under `prefers-reduced-motion`.
- No parallax or scroll-jacking.

## 8. 3D and depth effects (landing and onboarding only)

Build as progressive enhancement. **D1** ships first: the CSS/SVG orb and flat cards specified above. **D2** adds 3D on top. D1 stays as the permanent fallback. The analyzer, gauge, and dashboards stay flat SVG for legibility and speed.

**Landing hero orb (D2)**
- three.js with `@react-three/fiber`, loaded lazily after first paint inside a fixed-aspect box so layout never shifts.
- A dark sphere lit by a fresnel rim-light crescent on its right edge, as in the reference. Slow rotation (about 20 seconds per turn), a sparse field of drifting particles (under 300 points), and a soft additive glow plane behind it. No bloom post-processing.
- Colour and glow are driven by the sample conversation's score: teal at SAFE, amber at WARN, red at ALERT, blended over 600 ms.
- Pointer parallax with a maximum tilt of 6 degrees, eased.
- Everything is generated in code. No downloaded models, textures, or Spline scenes.

**Onboarding depth (D2, no WebGL needed)**
- The preview card uses CSS 3D (`perspective: 1200px`) and tilts up to 6 degrees toward the pointer, using Framer Motion springs.
- Floating chips and cards sit on different `translateZ` layers and move slightly against the pointer.
- Faint circuit lines run behind as SVG, animated with `stroke-dashoffset`, slow and low opacity.
- Step change: the outgoing card rotates 12 degrees on the Y axis and fades; the incoming card settles from -12 degrees to 0 over 350 ms.
- Step previews: (1) region and language chips floating at two depths; (2) a contact card with an initials avatar, an "Invited" pill, and a pulse line to the user's node, with a dashed empty state; (3) a shield card whose lock closes when the consent box is ticked. No fake people or logos.

**Performance budget**
- The 3D chunk loads after first contentful paint and stays at or under 200 KB gzip. If it goes over, import only the three.js modules used and do not add `drei`.
- Cap pixel ratio at 1.75. Pause rendering when the canvas is off-screen or the tab is hidden.
- Use the static CSS orb when WebGL is unavailable, under `prefers-reduced-motion`, when `navigator.deviceMemory` or `hardwareConcurrency` is 4 or lower, or if the frame rate stays under 30 fps for 2 seconds after start (automatic downgrade).
- The CSS orb is the poster while the 3D chunk loads. CLS must be 0. Landing Lighthouse mobile performance is 85 or higher.

**Accessibility**
The canvas is decorative (`aria-hidden`). Every state and score also appears as DOM text. Motion stops under reduced motion. No essential information lives only in 3D.

## 9. States and copy

Loading (skeleton matching the layout), empty, and error states everywhere. Copy is plain and specific. Alerts say "verify via the official number", never "this is a scam". Avoid "seamless", "powerful", "revolutionary", and exclamation marks.

## 10. Accessibility

Visible 2px accent focus ring, full keyboard operation, state conveyed by text and icon as well as colour, live region announcing state changes, 44px touch targets, AA contrast on every pairing.

## 11. Anti-template checklist

- No purple or blue neon gradients, and no second accent hue
- No stock imagery or downloaded 3D models (the orb is generated in code), no fake avatars, logos, or testimonials
- No all-caps monospace labels
- Glow limited to two elements per screen
- No placeholder numbers in charts or KPI cards
- Screenshots reviewed at 360, 768, and 1440px before each merge
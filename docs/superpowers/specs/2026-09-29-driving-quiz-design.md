# Driving licence quiz — design

## Goal
A fast, phone-first study app for the Rwandan driving theory test. Questions and answers come from `questions igazete.pdf` (about 430 questions, Kinyarwanda, options a–d, correct answer printed in red). The interface is in English; the questions stay in Kinyarwanda. No accounts, no database.

## Non-goals
Accounts, leaderboards, server-side storage, an admin panel, an English translation of the questions.

## Stack
Next.js (App Router) + TypeScript + Tailwind, deployed to Vercel. Pages are statically generated. A small service worker caches the shell, JSON and images so the app works offline after the first visit. No deploy or push happens until the owner asks.

## Data pipeline
- `scripts/extract.py` reads the PDF with PyMuPDF, treats red text (`#FF0000`, `#C00000`) as the correct option, and writes:
  - `data/questions.json`: `{ id, text, options: [{key, text}], answer, image? }`
  - `public/q/<id>.webp`: images for questions that need one (road signs), compressed.
  - `data/extract-report.md`: every question that did not parse cleanly (missing/duplicate red option, missing options, numbering gaps or repeats).
- The report is reviewed with the owner and fixes go into `data/overrides.json`, so re-running the script never loses manual corrections.
- The app imports the JSON only. The PDF is a build input, never shipped.
- Known from a first probe: numbering has gaps and duplicates, a handful of questions have two or zero red options, and 144 images exist in the PDF.

## Modes
| Mode | Behaviour |
|---|---|
| Practice | One question at a time, random order, instant right/wrong, correct option highlighted. Optional filter: all / unseen / mistakes. |
| Mock exam | 20 random questions, countdown timer, no feedback until the end. Pass mark 12/20 (constants in one file so they are easy to change). Result screen, then a review of every question with your pick vs. the right answer. |
| Mistakes | Practice restricted to questions answered wrong and not yet answered right since. |
| Browse | Scrollable, searchable list of all questions with the answer shown. |

## Shuffling and progress
- Order is a Fisher–Yates shuffle over the eligible pool. Practice walks the whole pool before any question repeats.
- Option order stays as printed, because many answers read "A and B are both correct", so shuffling options would break them.
- Progress lives in `localStorage` under one versioned key: per question `{seen, correct, wrong, lastResult}` plus the last 10 mock results. Reads and writes are wrapped so the app still works if storage is blocked. A "Reset progress" button is on the home screen.

## Screens
Home (start practice, mock exam, mistakes, browse, small stats row) → Question (progress bar, question, four options, Next) → Result (score, pass/fail, review link). Bottom tab bar on phones, top nav on wide screens.

## Visual design
Graphite background and surfaces, one lime accent for primary actions and progress, off-white text. Dark by default, with a light theme that follows the system setting. Lime buttons carry dark text for contrast. Right answers use lime, wrong answers a muted coral, never red on graphite, so it does not collide with the PDF's red meaning. Plain system-quality typography (one clean sans, tabular numbers for the timer), generous tap targets (min 48px), no gradients, glass, or emoji decoration. Motion is limited to a short fade or slide on question change and respects reduced-motion.

## Copy
Short, plain English labels ("Start practice", "Check your mistakes", "12 of 20 to pass"). No filler, no slogans.

## Performance
Static output, one font (system stack or a single self-hosted file), images as WebP with explicit dimensions and lazy loading, question data loaded once. Target a Lighthouse mobile score above 95.

## Error handling
Missing image → question still renders. Storage unavailable → in-memory progress with a small note. Unparseable question → excluded from the app until fixed in `overrides.json`, and listed in the report.

## Testing
- Unit tests (Vitest) for shuffle (permutation, no repeats before exhaustion), scoring and pass mark, progress reducer, and storage fallback.
- A test that validates `questions.json`: every question has 2–4 options and exactly one valid answer key, and every referenced image exists.
- Manual check on a phone-sized viewport for each screen.

## Git
Small commits with clear messages, authored by the owner (Ange Aurele TUYISENGE, tuyisengeauris@gmail.com) via the existing git config. No co-author or generated-by lines. The PDF stays in the repo root but is not part of the deployed bundle.

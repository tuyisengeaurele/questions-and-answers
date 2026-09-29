# Ikizamini

Practice for the Rwandan driving theory test. The questions and answers come from a PDF; the app is a static Next.js site with no backend, so progress lives in your browser.

## What it does
- **Practice:** rounds of 10, 20 or 40 questions with instant feedback, then a review of what you missed and a button to practise just those. Filter by all, new, or mistakes (a mistake clears after two right answers in a row).
- **Mock exam:** 20 questions, 20 minutes, 12 to pass. Answers stay hidden until you submit, then you review every miss. A refreshed round or exam can be resumed, and the last exams are listed.
- **Browse:** every question with its answer, searchable, with a picture filter and a "Hide answers" switch for testing yourself.
- **Comfort:** light, dark or device theme; large text; English or Kinyarwanda interface (the questions always stay in Kinyarwanda); keyboard shortcuts (A-D, Enter, arrows); tap a picture to enlarge it; works offline after the first visit.

Every exam and round mixes in road sign questions. Answer options always stay in the order printed in the document; only the questions are shuffled. There is no account: progress lives in your browser.

## Run it
```bash
npm install
npm run dev
```

## Rebuild the data from the PDF
```bash
pip install -r scripts/requirements.txt
python scripts/extract.py
```
Correct answers are the options printed in red. Anything that could not be read cleanly is listed in `data/extract-report.md`; manual fixes go in `data/overrides.json`, keyed by question id, and known misspellings in `data/spelling.json`. `docs/data-audit.md` records how the data was checked. Question ids are used to store progress, so do not renumber them once the app is live. The PDF itself is not committed.

## Checks
```bash
npm test && npm run lint && npm run typecheck && python -m pytest scripts
```

## Deploy
Import the repo in Vercel. No settings or environment variables are needed.

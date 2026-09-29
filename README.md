# Ikizamini

Practice for the Rwandan driving theory test. The questions and answers come from a PDF; the app is a static Next.js site with no backend, so progress lives in your browser.

## What it does
- **Practice:** rounds of 10 questions with instant feedback, then a review of what you missed. Filter by all, new, or mistakes.
- **Mock exam:** 20 questions, 20 minutes, 12 to pass. Answers stay hidden until you submit, then you review every miss.
- **Light and dark theme:** follows your device, with a button in the nav bar to switch and remember your choice.
- **Browse:** every question with its answer, searchable, with a picture-only filter.

Every exam and round mixes in road sign questions. Answer options always stay in the order printed in the document; only the questions are shuffled.

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

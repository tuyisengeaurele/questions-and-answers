# Question data audit

Checked against `questions igazete.pdf` (the copy in Downloads is byte-identical).

## How
- **Text:** every kept question (stem plus options, in order) was matched word for word against the PDF text as a continuous run. Word counts for the whole PDF were compared with the app data.
- **Answers:** the red marker is the only answer signal. It was cross-checked against the green and yellow highlight boxes: 41 questions carry a highlight and none disagrees with the red option. Three options are printed in green text (questions 182, 188 and 189); each of those questions also has a red answer, which wins.
- **Pictures:** all 145 picture blocks in the PDF are placed, none dropped. Placement was cross-checked with a second method based on the table cells around each picture (0 disagreements). Every picture was looked at on a contact sheet.
- **Repeats and conflicts:** no question has the same stem and options with a different answer. Four exact repeats were removed.

## What was wrong and is now fixed
- 49 questions had their picture attached to option A instead of the question, and 1 picture sat with the wrong question because it is printed above that question's number line.
- Pictures that use a transparency mask showed black backgrounds instead of white (38 pictures).
- Stray `)` at the start of options, spaces before `?` `:` `,`, missing spaces after full stops, `;` typed for the apostrophe, double spaces, stems starting in lowercase, quotes typed as two apostrophes.
- Words misspelt in the source that are unambiguous (for example `ikinyabizaga`, `umuvudoko`, `ibimenyestso`, `cyukuri`, `wikinyabiziga`). The full list is `data/spelling.json`; every change is listed in `data/extract-report.md`.
- Ten questions had their options labelled `a a b c` and so on in the PDF; they are renumbered by position.

## Left as is, on purpose
- Question 390 is left out: all four options are printed in red, so the PDF does not say which one is correct.
- Numbering jumps and repeats in the PDF (for example 52 twice, 220 three times, 8 after 409) are kept; ids follow document order.
- Two questions refer to a picture that the PDF does not contain (questions 359 and 385); they stay text-only.
- Kinyarwanda wording that is merely informal or unusual is not touched.

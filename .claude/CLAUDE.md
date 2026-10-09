# CLAUDE.md

Johnny Jansen's personal site, served at johnnyjansen.com (`CNAME`). Plain static HTML, CSS and JS with no build step: `index.html` is the portfolio, `resume.html` the resume (`JohnnyJansen-Resume.pdf` is the download), `PocketJams.html` and `PocketJamsEditor.html` are the Pocket Jams prototypes (spec in `Design_Doc.txt`), and `CollageCreator.html` and `mathlibs.html` are side tools.

Every word here is public and says something about Johnny, so [Human writing](#human-writing) below applies to all of it.

## Working with Johnny

- Messages are often short or voice-transcribed. Read for intent and ask if it's ambiguous.
- No em or en dashes in copy, commit messages or docs. Use a period, comma or parentheses.
- Change only what the task needs. Don't reformat or "improve" pages you weren't asked to touch.

---

## Human writing

**Every piece of writing in this repo gets checked against Wikipedia's [Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing) before it ships.** That covers the home page, the resume page, page titles and meta descriptions, and the Pocket Jams pages. Commit messages, PR bodies, docs and chat replies count too. Anything a visitor reads gets the closest look. Johnny asked for this on 2026-10-09 so the writing always feels human.

How to use the article:

- Writing anything public-facing this session? Read the live article first, once per session. It changes as new models ship, and its word lists are dated by model era. WebFetch stops partway through the page, so keep reading with its offset, or read the raw source at `https://en.wikipedia.org/w/index.php?title=Wikipedia:Signs_of_AI_writing&action=raw`.
- For everything else the checklist below is enough. It was taken from the article on 2026-10-09.
- Either way, reread the draft against the checklist and fix what you find before it ships.

The article's main warning applies to us: the signs are symptoms, and swapping one word for another fixes nothing. The problem behind most of them is generic writing. A model drifts toward the most likely sentence, so it drops the specific, unusual fact and puts a vague, positive, important-sounding line in its place. The article's example is "inventor of the first train-coupling device" turning into "a revolutionary titan of industry". The fix is the specific fact: a number, a name, a place, a date, what happens when you tap the button. No fact to hand? Ask for one or cut the sentence. Don't pad it.

### What gives writing away

Any one of these can be innocent. Several together read as AI.

Content

- Inflated significance: "serves as", "stands as", "is a testament to", "plays a pivotal/crucial/key role", "underscores the importance", "reflects broader trends", "sets the stage for", "marks a shift", "evolving landscape", "deeply rooted", "indelible mark".
- Fake analysis tacked onto the end of a sentence with an -ing clause: "..., highlighting/ensuring/fostering/enhancing/reflecting/contributing to ...". Also "valuable insights", "aligns with", "resonates with".
- Ad copy: "boasts", "vibrant", "rich", "profound", "nestled", "in the heart of", "groundbreaking", "renowned", "diverse array", "commitment to", "showcasing", "exemplifies".
- Vague authority: "experts say", "industry reports", "many customers", "several sources". Name the source or drop the claim.
- Vague links: "in connection with", "associated with". Say what the link is.
- Coverage name-dropping with nothing behind it: "featured in", "profiled in", "trade publications", "independent coverage".
- Formula endings: "Despite these challenges", "Future outlook", "In summary", "In conclusion", "Overall", or a last line that repeats the paragraph back.
- Hedges and disclaimers: "while specific details are limited", "based on available information", "should be treated as X rather than Y", "it's important to note", "worth noting", "may vary".

Words (one is fine, a cluster is the tell)

- Older models: additionally (to open a sentence), align with, boasts, bolstered, crucial, deep dive, delve, emphasizing, enduring, enhance, fostering, garner, highlight (as a verb), interplay, intricate, key (as an adjective), landscape (as an abstract noun), meticulous, pivotal, robust, showcase, tapestry, testament, underscore (as a verb), valuable, vibrant.
- Newer models (2026): challenge, clearer, dependable, echoed, foster, leverage, matters, multifaceted, practical, prioritize, quietly, steady, universally.
- Literal uses are fine: a highlighted row, a key in a map, an underscore character.

Grammar

- Dodging plain "is" and "has". "The gallery serves as an exhibition space and features four rooms" should be "The gallery is an exhibition space. It has four rooms."
- Negative parallelism, which argues with a thought the reader never had: "not just X, but Y", "it's not X, it's Y", "Y rather than X", "no X, no Y, just Z".
- Rule of three: a triplet of adjectives or short phrases standing in for real detail.
- Elegant variation: a new name for the same thing in every sentence ("the bench", "the seating solution", "the piece"). Repeat the word.
- Stiff synonyms: utilized, authored, relocated, attempted. Write used, wrote, moved, tried.

Rhythm and punctuation

- The em dash ban stays (Johnny's rule). But the article notes that newer models, trained off dashes, now overuse commas and periods and keep every sentence between 8 and 20 words. That even rhythm is now its own tell, and "short and plain" can slide into it. Stay short and plain, and vary the length: a long sentence with a parenthesis can sit next to a four-word one. Colons and semicolons are fine.

Formatting

- Title Case in headings (use sentence case), bold scattered through a paragraph, bullets that each open with a bold label and a colon, emoji as bullets, a three-row table that should be a sentence, a heading with nothing under it but more headings.
- Curly and straight quotes mixed together.
- Markdown (`**`, `##`, `[text](url)`) leaking somewhere it won't render: emails, plain-text fields, stored strings.

Chatbot leftovers

- "I hope this helps", "Certainly!", "Great question", "You're absolutely right", "let me know", "Would you like...", "Here is a...".
- Unfilled placeholders: "[Insert ...]", "(add link here)", "2025-XX-XX".

Commit messages and PR bodies (the article's "edit summaries" section covers these)

- Canned assurance: "ensured it adheres to", "improved clarity and flow", "refined", "enhanced", "streamlined".
- Narrating the process: "preserved", "retained", "avoided", "aimed to".
- Say what changed and why.

### What human writing has (same article)

- Plain "there is" and "it has".
- Plain verbs: wrote, used, tried, moved.
- Definite claims when they are true: "the only", "the first", "one of the best". Don't hedge a fact.
- Ordinary qualifiers: "very", "perhaps", "tends to".
- The odd loose phrase ("as a result of", "in order to"). Perfect polish isn't a human trait either.

### Before it ships

Would Johnny say it about his own work in a meeting? Could the sentence be pasted, unchanged, onto a page about something else? Then it's generic. Put the specific fact in or cut it.

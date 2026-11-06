# AI Math Results

What each AI mathematics result means, in plain language and without the proof, published at
[jehlp.net/ai-math](https://jehlp.net/ai-math/). It uses the shared
[site theme](https://jehlp.net/site-theme/) and its `ai-math` mark.

## Add a result

Append an entry to `data/results.json` and write its body in `content/<slug>.html`.
Follow the `jehlp-math-explainer` skill in site-theme.

A body is plain paragraphs and one `ai-math-side` figure or table for the margin, in 400 to 800 words.
It uses the baseline in the skill and defines every other term at first use, in the standard words
that `tests/site.test.mjs` checks. It has no headings, proof, status, history or source list.
Link a source on the words that state the result.

Write math between `\(` and `\)` or between `\[` and `\]`. The build typesets it to native MathML with
the pinned `temml` development dependency, so the pages load no typesetter. `{{fig:name}}` inserts a
figure from `lib/figures.mjs`. A link to another result is `../<slug>/`.

```sh
npm ci
npm test
```

`npm test` rebuilds the pages first. It then checks the page form, the writing limits and each quoted
calculation in exact arithmetic. Commit the data, the body and the generated pages together.

## Publish

GitHub Pages serves `main` from the repository root. The route comes from the repository name, under
the `jehlp.net` domain of `JWKNT.github.io`. The homepage directory links to this route, and its search
crawl follows the links on the landing page.

The history before the move is in `JWKNT/JWKNT.github.io`.

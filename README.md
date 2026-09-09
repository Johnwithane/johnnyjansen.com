# johnnyjansen.com

Johnny Jansen's portfolio and the front door of his consultancy. A prerendered Nuxt 4 site: content in `app/data/`, every route baked to HTML, served from Firebase Hosting.

- **How we build here:** [`CLAUDE.md`](CLAUDE.md)
- **Why it is shaped this way:** [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Voice, offer, redactions:** [`docs/POSITIONING.md`](docs/POSITIONING.md)
- **Steps only Johnny can do:** [`HUMANTASKS.md`](HUMANTASKS.md)

```bash
pnpm install
pnpm dev          # develop
pnpm verify       # lint + typecheck + tests + generate
pnpm test:e2e     # Playwright against the generated output
```

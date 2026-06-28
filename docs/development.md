# Site Development Guide

Everything you need to build, theme, and deploy the PowerShell.org Hugo site. If
you only want to **add an article, podcast note, author profile, or event**, you
don't need this file — see [`CONTRIBUTING.md`](../CONTRIBUTING.md) instead.

## Prerequisites

- Hugo (extended). Netlify pins `HUGO_VERSION = 0.155.1`; v0.128+ is the floor
  because the site uses Hugo's pagination v2 syntax.
- Node.js — for the asset build scripts (`npm run build:css`, `npm run build:icons`).

## Local development

```bash
npm install
npm run dev
```

`npm run dev` runs `hugo server -D --disableFastRender` — a local server at
`http://localhost:1313` with hot-reload and **draft posts visible** (`-D`).

### Build for production

```bash
npm run build      # hugo --gc --minify  → public/
npm run preview    # hugo server --environment production
```

Output goes to `public/` (git-ignored). The site no longer builds into `docs/` —
that legacy GitHub Pages layout is gone; `docs/` now holds this documentation.

## Project structure

```
├── content/                   # All site content (see CONTRIBUTING.md)
│   ├── articles/              # Learning articles with author/category metadata
│   ├── authors/               # Author profiles and taxonomy
│   ├── podcast/               # Podcast episodes (two shows — see CONTEXT.md)
│   ├── modules/               # Org-stewarded module landing pages
│   ├── calendar/              # Community events
│   ├── community/ summit/ learning/ …
│   └── _index.md              # Home page
├── data/
│   └── community_stats.json   # Forum statistics surfaced on the site
├── themes/powershell-community/
│   ├── layouts/
│   │   ├── index.html         # Home page layout
│   │   ├── list.html          # Podcast/section layouts
│   │   ├── _default/
│   │   │   ├── baseof.html    # Base template (head, SEO, asset pipeline)
│   │   │   ├── authors.html   # Author directory layout
│   │   │   ├── learning.html  # Learning section with search
│   │   │   └── single.html    # Single article layout
│   │   ├── taxonomy/
│   │   │   └── author.html    # Individual author page layout
│   │   └── partials/          # header, footer, schema-*, etc.
│   └── static/                # Favicons and assets
├── assets/                    # CSS, fonts, icons processed by Hugo Pipes
├── scripts/                   # build-tailwind.mjs, build-icons.mjs
├── tools/                     # Author/content helper scripts
├── config/discord-mirror.json # Discord mirror configuration
├── hugo.yaml                  # Hugo configuration
├── netlify.toml               # Build command, Hugo version, cache headers
└── package.json               # npm scripts
```

## Configuration

Edit `hugo.yaml` to update site title and description, navigation menu, podcast
settings, summit details, and social links. Config changes apply immediately in
`npm run dev` — no rebuild step.

## Theming and assets

### Theme colors

- **Primary** — Blue (`#0078D4`, `#00BCF2`)
- **Podcast** — Purple (`#667eea`, `#764ba2`)
- **Learning** — Green
- **Summit** — Purple gradient

Defined in the CSS within `themes/powershell-community/layouts/_default/baseof.html`.

### Tailwind CSS

The site ships a **purged, self-hosted** Tailwind build
(`assets/css/tailwind.css`, ~35 KB) instead of the full CDN file — only utility
classes that actually appear in the built output are retained.

If you add a **new** Tailwind class in a template or content file, regenerate the
purged stylesheet and commit it:

```bash
npm install        # one-time, for the purgecss devDependency
npm run build:css  # rebuilds assets/css/tailwind.css (see scripts/build-tailwind.mjs)
```

`npm run dev` serves the same purged file, so a missing class shows up
immediately. Classes injected only at build time (e.g. activity-dot colors from
`data/community_stats.json`) are pinned via the safelist in `purgecss.config.cjs`.
The deploy builds run bare `hugo` (`hugo --minify`), so the committed file is what
ships — CI fails a PR when the committed Tailwind/Font Awesome assets are stale.

### Icons (Font Awesome)

Font Awesome is **self-hosted as a subset**, not loaded from a CDN. The inlined
`assets/css/fontawesome-subset.css` plus a fingerprinted `woff2` replaces the full
icon set. Regenerate it after adding new icons:

```bash
npm run build:icons   # see scripts/build-icons.mjs
```

### Layouts

- Modify layouts in `themes/powershell-community/layouts/`.
- Hot-reload works in `npm run dev`.
- Use Hugo template functions: `.Title`, `.Content`, `range .Pages`, `.Permalink`.

See [`adr/0005-seo-metadata-and-purged-self-hosted-assets.md`](adr/0005-seo-metadata-and-purged-self-hosted-assets.md)
for why the head, CSS, and fonts are structured this way.

## Data sources

### Community statistics

`data/community_stats.json` holds recent forum activity, total topics/posts/users,
weekly activity metrics, and a `last_updated` timestamp. Access it in templates:

```go-html-template
{{ .Site.Data.community_stats.stats.total_topics }}
```

## Build and deployment

The site deploys on **Netlify**. `netlify.toml` defines the build command
(`hugo --minify`), pins the Hugo version, and sets security and cache headers.
The `.github/workflows/deploy.yml` workflow also builds with bare `hugo` — neither
path runs `npm run build`, which is why generated assets must be committed.

### RSS feeds

Generated automatically for the home page (`/index.xml`), each section
(`/<section>/index.xml`), and taxonomies (`/authors/index.xml`,
`/categories/index.xml`, `/tags/index.xml`). Configured in the `outputs` section
of `hugo.yaml`.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Draft posts not showing | Use the `-D` flag — `npm run dev` already sets it. |
| Pagination syntax error | This site uses Hugo v0.128+ pagination v2. Assign the paginator: `{{ $p := .Paginate .Pages }}`, don't call `{{ .Paginate }}` bare. |
| Broken links | Use Hugo functions, not hardcoded URLs: `.Permalink`, `.RelRef "path"`, `.Site.BaseURL`. |
| Missing Tailwind class in output | Run `npm run build:css` and commit `assets/css/tailwind.css`. |
| Missing icon | Run `npm run build:icons` and commit the regenerated subset. |
| Community stats stale | Check `data/community_stats.json` format and its `last_updated` timestamp. |

## Dependencies

- **Hugo** — extended, v0.128+ (Netlify pins 0.155.1), Goldmark renderer.
- **Node.js** — for the asset build scripts.
- **Tailwind CSS** — v2.2.19, purged + self-hosted via `npm run build:css`.
- **Inter** — self-hosted from `assets/fonts/` (`@font-face`, no Google Fonts).
- **Font Awesome** — v6, self-hosted subset via `npm run build:icons`.
- **Alpine.js** — v3.10.2 (via CDN).
- **Prism.js** — v1.24.1 (via CDN) for code syntax highlighting.

# Developer Documentation

These docs are for people **building and maintaining the PowerShell.org website** —
the Hugo theme, asset pipeline, integrations, and the decisions behind them.

> **Just want to contribute content?** Adding an article, podcast note, author
> profile, or community event needs none of this. Start at the repo root:
> [`README.md`](../README.md) for orientation and
> [`CONTRIBUTING.md`](../CONTRIBUTING.md) for the step-by-step.

## Start here

- **[development.md](development.md)** — build, theme, asset pipeline, deployment,
  and troubleshooting for the site.

## Architecture decisions (`adr/`)

Records of *why* the site is built the way it is.

- [0001 — Module landing pages](adr/0001-module-landing-pages.md)
- [0002 — Author profiles](adr/0002-author-profiles.md)
- [0003 — Incremental podcast sync](adr/0003-incremental-podcast-sync.md)
- [0004 — GitHub alert admonitions](adr/0004-github-alert-admonitions.md)
- [0005 — Author analytics](adr/0005-author-analytics.md)
- [0005 — SEO metadata and purged, self-hosted assets](adr/0005-seo-metadata-and-purged-self-hosted-assets.md)

## Proposals (`proposals/`)

- [Author analytics](proposals/author-analytics.md)

## Discord mirror (`discord-mirror/`)

Publishing selected Discord channel content to `/discord/` on the site.

- [Quick start](discord-mirror/quickstart.md) — get it running.
- [Deployment guide](discord-mirror/deployment.md) — secrets, config, validation.
- [Moderation guide](discord-mirror/moderation.md) — publication controls and policies.

## Other references

- [podcast-sync-plan.md](podcast-sync-plan.md) — plan for keeping The PowerShell
  Podcast in step with the repo.
- [agents/](agents/) — instructions for AI agents working in this repo
  (issue tracker, triage labels, domain docs). See also [`../AGENTS.md`](../AGENTS.md).

## Domain language

Shared vocabulary for the project (Module, Author, Profile, Reach, the two
podcasts) lives in [`CONTEXT.md`](../CONTEXT.md) at the repo root. Read it before
naming things or changing how content is modeled.

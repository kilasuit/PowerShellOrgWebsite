# PowerShell.org Hugo Site - AI Coding Agent Instructions

## Project Overview
PowerShell.org is a **Hugo static site** (v0.128+) serving as the community hub for PowerShell enthusiasts. The site is built with a custom theme (`powershell-community`) and uses Tailwind CSS with FontAwesome icons. Content is organized into five main sections: Home, Podcast, Summit, Community, and Learning.

## Architecture & Key Concepts

### Hugo Structure
- **Configuration**: [../hugo.yaml](../hugo.yaml) - Contains site metadata, menu structure, taxonomies, and environment-specific parameters
- **Theme**: [../themes/powershell-community/](../themes/powershell-community/) - Custom theme with Tailwind CSS styling
- **Content**: [../content/](../content/) - Markdown files organized by section (_index.md for section pages)
- **Data**: [../data/community_stats.json](../data/community_stats.json) - Dynamic data source for community statistics
- **Outputs**: Site builds to both [../public/](../public/) (GitHub Pages) and [../docs/](../docs/) directories

### Content Organization
Each major section has its own directory under `content/`:
- `community/` - Community hub with discussion stats
- `learning/` - Educational resources
- `podcast/` - Podcast listing (podcast details in `hugo.yaml`)
- `summit/` - Event information (summit config in `hugo.yaml`)
- `_index.md` files define section landing pages and front matter

### Layout System
- **Base Template**: [../themes/powershell-community/layouts/_default/baseof.html](../themes/powershell-community/layouts/_default/baseof.html) - HTML structure, RSS feeds, Open Graph metadata
- **Home Layout**: [../themes/powershell-community/layouts/index.html](../themes/powershell-community/layouts/index.html) - Hero section, stats display
- **Section Layout**: [../themes/powershell-community/layouts/list.html](../themes/powershell-community/layouts/list.html) - Used for Podcast, Summit, Learning sections
- **Partials**: [../themes/powershell-community/layouts/partials/](../themes/powershell-community/layouts/partials/) - header.html, footer.html (reusable components)

### Dynamic Data Flow
The `community_stats.json` file is accessed in templates via `.Site.Data.community_stats`. It includes:
- `activities` - Recent forum activity list
- `stats` - Total topics, posts, active users, weekly counts
- `last_updated` - ISO timestamp for cache-busting

## Development Workflow

### Local Development
```bash
npm run dev        # Hugo server on http://localhost:1313 with drafts enabled (-D)
npm run build      # Production build with garbage collection and minification
npm run preview    # Production server for testing
```

**Key flags**:
- `-D` (drafts): Enable `draft: true` pages
- `--disableFastRender`: Prevents caching issues during development
- `--gc --minify`: Garbage collection and CSS/JS minification for production

### Build Artifacts
- **Development**: Live-reloaded on file changes; accessible at http://localhost:1313
- **Production**: Generated in `public/` and `docs/` directories
- **RSS feeds**: Auto-generated for home, sections, and taxonomy pages

## Key Patterns & Conventions

### Front Matter Structure
All markdown files follow Hugo convention with YAML front matter:
```yaml
---
title: "Page Title"
description: "Short description for meta tags and summaries"
draft: false           # Set to true to exclude from builds (visible with -D)
date: 2024-01-01T00:00:00Z
categories: ["category-name"]
tags: ["tag1", "tag2"]
author: "Author Name"
---
```

### Styling & UI Components
- **Framework**: Tailwind CSS utility classes (in HTML templates)
- **Icons**: FontAwesome 6+ (`<i class="fas fa-icon-name"></i>`)
- **Color Scheme**: Blues for primary (hero/nav), purples for highlights (podcast), gradients for sections
- **Responsive Design**: Mobile-first with `sm:`, `lg:` breakpoints

Example header component pattern (from baseof.html):
```html
<meta property="og:type" content="{{ if .IsPage }}article{{ else }}website{{ end }}">
```

### Section-Specific Configurations
Located in [../hugo.yaml](../hugo.yaml) `params`:
- **Podcast**: `podcast.title`, `podcast.description`, `podcast.feed_url`
- **Summit**: `summit.year`, `summit.dates`, `summit.location`, `summit.registration_url`
- **Social Links**: Twitter, YouTube, GitHub, Discord, Bluesky URLs in `social` map

Update these centrally; templates access via `.Site.Params.podcast.title` etc.

### Taxonomy System
Defined in [../hugo.yaml](../hugo.yaml):
```yaml
taxonomies:
  category: categories
  tag: tags
  author: authors
```
Each taxonomy auto-generates list pages at `/categories/`, `/tags/`, `/authors/` with RSS feeds.

## Critical Integration Points

### RSS & Feed Generation
- Enabled globally: `enableRSSFeed: true`
- Output formats: Home and sections generate both HTML and RSS
- RSS feed links in baseof.html use `{{ range .AlternativeOutputFormats }}`
- Podcast feed URL points to external podbean: `https://powershellpodcast.podbean.com/feed/`

### GitHub Pages Deployment
- Site publishes to `docs/` folder for GitHub Pages compatibility
- Both `public/` and `docs/` are build outputs (verify in CI/CD scripts)

### Open Graph & Social Sharing
All pages auto-generate OG metadata in baseof.html:
- Images: Look for `og:image` in front matter; defaults to site image
- Title/Description: Pulled from front matter, fallback to site defaults

## Common Tasks

### Adding a New Content Page
1. Create `content/section/_index.md` or `content/section/page-name.md`
2. Include front matter with `title`, `description`, `draft: false`
3. Write content in Markdown (supports HTML with `unsafe: true` in markup config)
4. Run `npm run dev` to preview

### Updating Section Metadata
Edit [../hugo.yaml](../hugo.yaml) `params` section (podcast, summit, social) - no page rebuild needed for config.

### Modifying Layouts
- Edit templates in [../themes/powershell-community/layouts/](../themes/powershell-community/layouts/)
- Use Hugo template functions: `.Title`, `.Content`, `range .Pages`, `.Truncate`, `.Permalink`
- Hot-reload works with `npm run dev`; Tailwind classes apply without rebuild

### Accessing Data
```html
<!-- Community stats in templates -->
{{ .Site.Data.community_stats.stats.total_topics }}
{{ range .Site.Data.community_stats.activities }}
  {{ .message }} <!-- Current activity -->
{{ end }}
```

## Dependencies & Version Requirements
- **Hugo**: v0.128+ (using goldmark markdown, pagination v2 syntax)
- **Node.js**: For npm scripts (package.json defines hugo-extended and node-fetch)
- **Tailwind CSS**: Utility-first CSS framework (classes in HTML templates)
- **FontAwesome**: Icon library (v6+ icons via CDN in baseof.html)

## Avoid These Pitfalls
1. **Don't use old Hugo pagination syntax** (`{{ .Paginate }}` without `.Paginate` assignment) - v0.128+ requires explicit assignment
2. **Don't commit `public/` or `docs/` folders** - Generated by CI/CD
3. **Draft pages are hidden by default** - Must add `-D` flag to `hugo server` or set `draft: false` in front matter
4. **Section aliases/redirects** - If moving content, add `aliases: ["/old-path/"]` to front matter
5. **Hardcoding URLs** - Use `.Permalink`, `.RelRef`, and `.Site.BaseURL` instead

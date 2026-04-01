#!/usr/bin/env node
/**
 * Migration script: Converts old WordPress-exported posts to clean Hugo content.
 * - Splits podcast vs article posts into separate sections
 * - Cleans front matter (strips WP-specific fields)
 * - Strips WordPress shortcodes
 * - Converts common HTML to markdown
 * - Extracts podcast audio URLs
 * - Sets up URL aliases for old permalinks
 */

const fs = require('fs');
const path = require('path');

// --- Configuration ---
const SOURCE_DIR = path.join('C:', 'Users', 'James', 'Downloads', 'oldsite', 'posts');
const DEST_ARTICLES = path.join(__dirname, '..', 'content', 'articles');
const DEST_PODCAST = path.join(__dirname, '..', 'content', 'podcast');

// Front matter fields to keep
const KEEP_FIELDS = new Set([
  'title', 'author', 'date', 'categories', 'tags', 'draft',
  'description', 'featured_image'
]);

// Front matter fields that are WordPress junk
const STRIP_FIELDS = new Set([
  'type', 'post_views_count', 'swp_cache_timestamp', 'slide_template',
  'rs_page_bg_color', 'wpautop', 'postformat_quote_text',
  'postformat_video_embed', 'postformat_audio_embedded',
  'classic-editor-remember', 'themnific_sidebar', 'themnific_single_featured',
  'g1_page_builder_state', 'ampforwp-amp-on-off', 'game_locked',
  'hide_title', 'secondline_imported_guid', 'private', 'panels_data'
]);

// --- Stats ---
const stats = {
  total: 0,
  articles: 0,
  podcast: 0,
  skipped: 0,
  errors: []
};

// --- YAML Front Matter Parser (simple, handles our specific format) ---
function parseFrontMatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const rawYaml = match[1];
  const body = match[2];

  // Parse YAML manually to preserve structure we need
  const meta = {};
  let currentKey = null;
  let currentValue = null;
  let inMultiline = false;
  let multilineIndent = 0;
  let inArray = false;

  const lines = rawYaml.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Top-level key
    const keyMatch = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (keyMatch && !inMultiline) {
      // Save previous key
      if (currentKey !== null) {
        meta[currentKey] = currentValue;
      }

      currentKey = keyMatch[1];
      const val = keyMatch[2].trim();

      if (val === '' || val === '|') {
        // Could be array or multiline
        currentValue = [];
        inArray = true;
        inMultiline = false;
      } else if (val.startsWith('"') && val.endsWith('"')) {
        currentValue = val.slice(1, -1);
        inArray = false;
      } else if (val.startsWith("'") && val.endsWith("'")) {
        currentValue = val.slice(1, -1);
        inArray = false;
      } else if (val === 'true') {
        currentValue = true;
        inArray = false;
      } else if (val === 'false') {
        currentValue = false;
        inArray = false;
      } else {
        currentValue = val;
        inArray = false;
      }
      continue;
    }

    // Array item
    const arrayMatch = line.match(/^  - (.*)$/);
    if (arrayMatch && Array.isArray(currentValue)) {
      const val = arrayMatch[1].trim();
      if (val === '|') {
        // Multiline block in array - collect until next item or key
        inMultiline = true;
        let block = '';
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j];
          if (nextLine.match(/^[a-zA-Z_][\w-]*\s*:/) || nextLine.match(/^  - /)) {
            break;
          }
          block += nextLine.trimStart() + '\n';
          j++;
        }
        currentValue.push(block.trim());
        i = j - 1;
        inMultiline = false;
      } else {
        let cleanVal = val;
        if (cleanVal.startsWith('"') && cleanVal.endsWith('"')) {
          cleanVal = cleanVal.slice(1, -1);
        } else if (cleanVal.startsWith("'") && cleanVal.endsWith("'")) {
          cleanVal = cleanVal.slice(1, -1);
        }
        currentValue.push(cleanVal);
      }
      continue;
    }
  }

  // Save last key
  if (currentKey !== null) {
    meta[currentKey] = currentValue;
  }

  return { meta, body };
}

// --- Extract audio URL from enclosure or audio_file ---
function extractAudioUrl(meta) {
  for (const field of ['enclosure', 'audio_file']) {
    if (meta[field] && Array.isArray(meta[field])) {
      for (const val of meta[field]) {
        const str = String(val);
        const match = str.match(/(https?:\/\/[^\s]+\.mp3)/i);
        if (match) return match[1];
      }
    } else if (typeof meta[field] === 'string') {
      const match = meta[field].match(/(https?:\/\/[^\s]+\.mp3)/i);
      if (match) return match[1];
    }
  }
  return null;
}

// --- Extract audio URL from body HTML ---
function extractAudioUrlFromBody(body) {
  const match = body.match(/src="(https?:\/\/[^"]+\.mp3[^"]*)"/i);
  if (match) return match[1].replace(/\\_/g, '_').replace(/\?.*$/, '');
  return null;
}

// --- Clean front matter ---
function cleanFrontMatter(meta, isPodcast, audioUrl, oldUrl) {
  const clean = {};

  // Title - remove extra quotes, clean up
  if (meta.title) {
    let title = String(meta.title);
    title = title.replace(/\\'/g, "'");
    title = fixMojibake(title);
    clean.title = title;
  }

  // Author - use both singular (for display) and plural (for taxonomy)
  if (meta.author) {
    const authorName = String(meta.author);
    clean.author = authorName;
    clean.authors = [authorName];
  }

  // Date - fix invalid dates by extracting from filename
  if (meta.date) {
    const dateStr = String(meta.date);
    if (dateStr.startsWith('-001') || dateStr.startsWith('0000') || !dateStr.match(/^\d{4}/)) {
      // Invalid date - will be fixed from filename in processFile
      clean.date = null;
    } else {
      clean.date = dateStr;
    }
  }

  // Description
  if (meta.description) {
    clean.description = String(meta.description);
  }

  // Categories - clean up, remove "Uncategorized"
  if (meta.categories && Array.isArray(meta.categories)) {
    const cats = meta.categories
      .map(c => String(c).trim())
      .filter(c => c && c !== 'Uncategorized' && c !== 'Podcast' && !c.match(/^\d+$/) && !c.match(/^\s*$/));
    if (cats.length > 0) {
      clean.categories = cats;
    }
  }

  // Tags
  if (meta.tags && Array.isArray(meta.tags)) {
    const tags = meta.tags.map(t => String(t).trim()).filter(t => t);
    if (tags.length > 0) {
      clean.tags = tags;
    }
  }

  // Featured image - convert WP path
  if (meta.featured_image) {
    const img = String(meta.featured_image);
    if (img && !img.match(/^\s*$/)) {
      // Keep as-is for now; images would need separate migration
      clean.featured_image = img;
    }
  }

  // Draft
  if (meta.draft === true || meta.draft === 'true') {
    clean.draft = true;
  }

  // Podcast audio URL
  if (isPodcast && audioUrl) {
    clean.podcast_url = audioUrl;
  }

  // URL alias for old permalinks - skip invalid ones (WordPress draft ?p= URLs)
  if (meta.url) {
    const url = String(meta.url).trim();
    if (url && url !== '/' && !url.includes('?')) {
      clean.aliases = [url];
    }
  }

  return clean;
}

// --- Convert HTML to Markdown ---
function htmlToMarkdown(html) {
  let md = html;

  // Preserve angle-bracket URLs like <https://example.com> before HTML processing
  md = md.replace(/<(https?:\/\/[^>]+)>/gi, '%%AUTOLINK%%$1%%ENDAUTOLINK%%');

  // Remove WordPress audio shortcode blocks (we extract the URL separately)
  md = md.replace(/<audio[^>]*>[\s\S]*?<\/audio>/gi, '');

  // Remove WordPress shortcodes
  md = md.replace(/\\\[vc_[^\]]*\\\]/g, '');
  md = md.replace(/\[vc_[^\]]*\]/g, '');
  md = md.replace(/\\\[\/vc_[^\]]*\\\]/g, '');
  md = md.replace(/\[\/vc_[^\]]*\]/g, '');

  // Convert headings
  md = md.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n');
  md = md.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n');
  md = md.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '\n### $1\n');
  md = md.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '\n#### $1\n');
  md = md.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '\n##### $1\n');
  md = md.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '\n###### $1\n');

  // Convert <pre><code> blocks to fenced code blocks
  md = md.replace(/<pre[^>]*><code[^>]*class="language-([^"]*)"[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    (_, lang, code) => '\n```' + lang.toLowerCase() + '\n' + decodeHtmlEntities(code).trim() + '\n```\n');
  md = md.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    (_, code) => '\n```\n' + decodeHtmlEntities(code).trim() + '\n```\n');
  md = md.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi,
    (_, code) => '\n```\n' + decodeHtmlEntities(code).trim() + '\n```\n');

  // Convert inline code
  md = md.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');

  // Convert bold/strong
  md = md.replace(/<(strong|b)[^>]*>([\s\S]*?)<\/\1>/gi, '**$2**');

  // Convert italic/em
  md = md.replace(/<(em|i)[^>]*>([\s\S]*?)<\/\1>/gi, '*$2*');

  // Convert images
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*\/?>/gi, '![$2]($1)');
  md = md.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*\/?>/gi, '![$1]($2)');
  md = md.replace(/<img[^>]*src="([^"]*)"[^>]*\/?>/gi, '![]($1)');

  // Convert links (but not reference-style links which are already markdown)
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');

  // Convert unordered lists
  md = md.replace(/<ul[^>]*>/gi, '\n');
  md = md.replace(/<\/ul>/gi, '\n');
  md = md.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n');

  // Convert ordered lists
  md = md.replace(/<ol[^>]*>/gi, '\n');
  md = md.replace(/<\/ol>/gi, '\n');

  // Convert blockquotes
  md = md.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_, content) => {
    return content.trim().split('\n').map(line => '> ' + line.trim()).join('\n') + '\n';
  });

  // Convert <figure>/<figcaption>
  md = md.replace(/<figure[^>]*>([\s\S]*?)<\/figure>/gi, '$1');
  md = md.replace(/<figcaption[^>]*>([\s\S]*?)<\/figcaption>/gi, '*$1*');

  // Remove remaining block-level tags
  md = md.replace(/<\/?(?:div|span|p|section|article|header|footer|nav|main|aside|figure|figcaption)[^>]*>/gi, '\n');

  // Convert <br> to newline
  md = md.replace(/<br\s*\/?>/gi, '\n');

  // Convert <hr> to markdown
  md = md.replace(/<hr\s*\/?>/gi, '\n---\n');

  // Remove any remaining HTML tags (cleanup pass)
  md = md.replace(/<\/?[a-zA-Z][^>]*>/g, '');

  // Restore angle-bracket autolinks
  md = md.replace(/%%AUTOLINK%%(.*?)%%ENDAUTOLINK%%/g, '<$1>');

  // Decode HTML entities
  md = decodeHtmlEntities(md);

  // Clean up escaped underscores from WordPress export
  md = md.replace(/\\_/g, '_');

  // Clean up WordPress escaped backtick inline code patterns
  // Pattern: `\``SomeWord`\`` -> `SomeWord`
  // First normalize: remove \` sequences that are just escaping artifacts
  md = md.replace(/\\`/g, '`');
  // Collapse runs of backticks with spaces between them into clean inline code
  // e.g. `` `word` `` -> `word`
  md = md.replace(/`{2,}\s*/g, '`');
  md = md.replace(/\s*`{2,}/g, '`');
  // Clean stray patterns like ` `word` ` (space-backtick pairs wrapping inline code)
  md = md.replace(/` `/g, '`');
  md = md.replace(/` ` /g, '` ');

  // Clean up escaped brackets from WordPress export
  md = md.replace(/\\\[/g, '[');
  md = md.replace(/\\\]/g, ']');

  // Clean up excessive newlines
  md = md.replace(/\n{4,}/g, '\n\n\n');

  // Clean up leading/trailing whitespace on lines
  md = md.split('\n').map(line => {
    // Don't trim lines inside code blocks
    return line.replace(/^\s+$/, '');
  }).join('\n');

  // Trim overall
  md = md.trim();

  return md;
}

// --- Fix mojibake (mangled UTF-8 smart quotes/dashes from WordPress) ---
function fixMojibake(str) {
  return str
    .replace(/â€œ/g, '"')    // left double quote
    .replace(/â€\u009d/g, '"')  // right double quote (control char variant)
    .replace(/â€/g, '"')     // right double quote
    .replace(/â€™/g, "'")    // right single quote / apostrophe
    .replace(/â€˜/g, "'")    // left single quote
    .replace(/â€"/g, '—')    // em dash
    .replace(/â€"/g, '–')    // en dash
    .replace(/â€¦/g, '...')  // ellipsis
    .replace(/Â°/g, '°')     // degree sign
    .replace(/Â /g, ' ')     // non-breaking space artifact
    .replace(/Ã©/g, 'é')
    .replace(/Ã¨/g, 'è')
    .replace(/Ã¼/g, 'ü')
    .replace(/Ã¶/g, 'ö')
    .replace(/Ã¤/g, 'ä')
    .replace(/Ã±/g, 'ñ')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã¢/g, 'â')
    .replace(/Ã®/g, 'î')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã¡/g, 'á')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã­/g, 'í')
    // Remove any remaining control characters that break YAML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '...')
    .replace(/&#8203;/g, '')
    .replace(/&#038;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

// --- Generate YAML front matter string ---
function toYaml(obj) {
  let yaml = '---\n';

  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;

    if (typeof value === 'boolean') {
      yaml += `${key}: ${value}\n`;
    } else if (typeof value === 'string') {
      // Quote strings that contain special YAML chars
      if (value.includes(':') || value.includes('#') || value.includes('"') ||
          value.includes("'") || value.includes('\n') || value.includes('[') ||
          value.includes(']') || value.includes('{') || value.includes('}') ||
          value.includes('`') || value.startsWith('*') || value.startsWith('&') ||
          value.startsWith('!') || value.startsWith('%') || value.startsWith('@') ||
          value.startsWith(',') || value === 'true' || value === 'false' ||
          value === 'null' || value === 'yes' || value === 'no') {
        // Use double quotes, escape internal double quotes
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
        yaml += `${key}: "${escaped}"\n`;
      } else {
        yaml += `${key}: ${value}\n`;
      }
    } else if (Array.isArray(value)) {
      yaml += `${key}:\n`;
      for (const item of value) {
        if (typeof item === 'string') {
          if (item.includes(':') || item.includes('"') || item.includes("'") || item.includes('#')) {
            const escaped = item.replace(/"/g, '\\"');
            yaml += `  - "${escaped}"\n`;
          } else {
            yaml += `  - ${item}\n`;
          }
        } else {
          yaml += `  - ${item}\n`;
        }
      }
    }
  }

  yaml += '---\n';
  return yaml;
}

// --- Process a single file ---
function processFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const parsed = parseFrontMatter(content);

  if (!parsed) {
    stats.errors.push(`Failed to parse: ${filePath}`);
    stats.skipped++;
    return;
  }

  const { meta, body } = parsed;

  // Determine if podcast
  const isPodcast = meta.categories &&
    Array.isArray(meta.categories) &&
    meta.categories.some(c => String(c).toLowerCase() === 'podcast');

  // Extract audio URL
  let audioUrl = extractAudioUrl(meta);
  if (!audioUrl && isPodcast) {
    audioUrl = extractAudioUrlFromBody(body);
  }

  // Clean front matter
  const oldUrl = meta.url ? String(meta.url) : null;
  const cleanMeta = cleanFrontMatter(meta, isPodcast, audioUrl, oldUrl);

  // Fix null dates from invalid WordPress dates - extract from filename
  if (!cleanMeta.date) {
    const fileMatch = path.basename(filePath).match(/^(\d{4}-\d{2}-\d{2})/);
    if (fileMatch) {
      cleanMeta.date = fileMatch[1] + 'T00:00:00+00:00';
    }
  }

  // Convert body to clean markdown
  const cleanBody = fixMojibake(htmlToMarkdown(body));

  // Skip posts with no real content
  if (!cleanBody || cleanBody.trim().length < 10) {
    // Still import but flag it
  }

  // Generate output
  const output = toYaml(cleanMeta) + '\n' + cleanBody + '\n';

  // Determine destination
  const destDir = isPodcast ? DEST_PODCAST : DEST_ARTICLES;
  const fileName = path.basename(filePath);
  const destPath = path.join(destDir, fileName);

  fs.writeFileSync(destPath, output, 'utf-8');

  if (isPodcast) {
    stats.podcast++;
  } else {
    stats.articles++;
  }
  stats.total++;
}

// --- Main ---
function main() {
  console.log('PowerShell.org Post Migration');
  console.log('=============================\n');

  // Ensure destination directories exist
  fs.mkdirSync(DEST_ARTICLES, { recursive: true });
  fs.mkdirSync(DEST_PODCAST, { recursive: true });

  // Read source files
  const files = fs.readdirSync(SOURCE_DIR)
    .filter(f => f.endsWith('.md'))
    .sort();

  console.log(`Found ${files.length} posts to migrate.\n`);

  for (const file of files) {
    const filePath = path.join(SOURCE_DIR, file);
    try {
      processFile(filePath);
    } catch (err) {
      stats.errors.push(`Error processing ${file}: ${err.message}`);
      stats.skipped++;
    }
  }

  console.log('Migration Complete!');
  console.log('-------------------');
  console.log(`Total processed: ${stats.total}`);
  console.log(`  Articles:      ${stats.articles}`);
  console.log(`  Podcast:       ${stats.podcast}`);
  console.log(`  Skipped/Error: ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log(`\nErrors (${stats.errors.length}):`);
    for (const err of stats.errors.slice(0, 20)) {
      console.log(`  - ${err}`);
    }
    if (stats.errors.length > 20) {
      console.log(`  ... and ${stats.errors.length - 20} more`);
    }
  }
}

main();

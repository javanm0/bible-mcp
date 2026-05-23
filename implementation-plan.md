# Bible MCP Server v2 — Self-Contained Implementation Plan
> Handoff document for Claude Code

---

## Overview

V2 uses a bundled KJV JSON file that ships with the project. All lookups and search happen in-memory at runtime — no HTTP calls,
no API keys, no rate limits, no external dependencies.

**What changes from v1:**
- `lib/bible-api.ts` is replaced with `lib/bible.ts` (in-memory data access)
- `data/kjv.json` is added to the project
- No env vars, no fetch calls anywhere
- Faster responses (no network round trip)
- Works in Vercel Edge Runtime if desired (optional)

**What stays the same:**
- Next.js App Router + `mcp-handler`
- Same three tools: `get_passage`, `search_bible`, `list_books`
- Same `app/api/mcp/route.ts` structure
- Same Vercel deployment process

---

## Step 0 — Get the KJV JSON file

Download a nested book → chapter → verse KJV JSON. A good public domain source:

```
https://github.com/aruljohn/Bible-kjv/blob/master/kjv.json
```

Or search GitHub for "kjv.json" — any file structured like the schema below works.

Place the file at:
```
data/kjv.json
```

### Expected JSON schema

```json
{
  "books": [
    {
      "book": "Genesis",
      "abbrev": "GEN",
      "chapters": [
        [
          "In the beginning God created the heaven and the earth.",
          "And the earth was without form, and void..."
        ],
        [...]
      ]
    },
    ...
  ]
}
```

Chapters are arrays of verse strings (0-indexed, so verse 1 = index 0).

> **Note:** If the downloaded file uses a slightly different shape (e.g. chapters as
> objects instead of arrays, or verses as `{verse, text}` objects), update the
> accessor logic in `lib/bible.ts` accordingly. The plan below assumes the array
> format above — Claude Code should inspect the actual file first.

---

## Phase 1 — Add the data file

```
bible-mcp/
├── data/
│   └── kjv.json          ← Add this (the full KJV Bible)
├── lib/
│   └── bible.ts          ← Replaces bible-api.ts
├── app/
│   └── api/
│       └── mcp/
│           └── route.ts  ← Minor updates (tool descriptions)
└── vercel.json
```

---

## Phase 2 — In-memory Bible library

### File: `lib/bible.ts`

```typescript
import kjv from '@/data/kjv.json'

// --- Types ---

export interface Verse {
  book: string
  abbrev: string
  chapter: number   // 1-indexed
  verse: number     // 1-indexed
  text: string
}

export interface Book {
  book: string
  abbrev: string
  chapterCount: number
}

// --- Build a flat verse index once at module load ---
// This runs once when the server starts; subsequent calls hit the array directly.

const ALL_VERSES: Verse[] = []

for (const book of kjv.books) {
  book.chapters.forEach((chapter: string[], chapterIndex: number) => {
    chapter.forEach((text: string, verseIndex: number) => {
      ALL_VERSES.push({
        book: book.book,
        abbrev: book.abbrev,
        chapter: chapterIndex + 1,
        verse: verseIndex + 1,
        text,
      })
    })
  })
}

// --- Public functions ---

// Get a single verse
export function getVerse(book: string, chapter: number, verse: number): Verse | null {
  return ALL_VERSES.find(
    v =>
      (v.book.toLowerCase() === book.toLowerCase() ||
       v.abbrev.toLowerCase() === book.toLowerCase()) &&
      v.chapter === chapter &&
      v.verse === verse
  ) ?? null
}

// Get a verse range within one chapter, e.g. Romans 8:1-4
export function getPassage(book: string, chapter: number, verseStart: number, verseEnd: number): Verse[] {
  return ALL_VERSES.filter(
    v =>
      (v.book.toLowerCase() === book.toLowerCase() ||
       v.abbrev.toLowerCase() === book.toLowerCase()) &&
      v.chapter === chapter &&
      v.verse >= verseStart &&
      v.verse <= verseEnd
  )
}

// Get a full chapter
export function getChapter(book: string, chapter: number): Verse[] {
  return ALL_VERSES.filter(
    v =>
      (v.book.toLowerCase() === book.toLowerCase() ||
       v.abbrev.toLowerCase() === book.toLowerCase()) &&
      v.chapter === chapter
  )
}

// Keyword/phrase search — case-insensitive substring match
export function searchVerses(query: string, limit = 20): Verse[] {
  const q = query.toLowerCase()
  const results: Verse[] = []
  for (const v of ALL_VERSES) {
    if (v.text.toLowerCase().includes(q)) {
      results.push(v)
      if (results.length >= limit) break
    }
  }
  return results
}

// List all books
export function getBooks(): Book[] {
  return kjv.books.map(b => ({
    book: b.book,
    abbrev: b.abbrev,
    chapterCount: b.chapters.length,
  }))
}

// Format a verse array into a readable string
export function formatVerses(verses: Verse[]): string {
  if (verses.length === 0) return ''
  return verses.map(v => `[${v.verse}] ${v.text}`).join('\n')
}
```

---

## Phase 3 — MCP Route Handler

### File: `app/api/mcp/route.ts`

Only the tool implementations change — the `createMcpHandler` structure stays the same.

```typescript
import { z } from 'zod'
import { createMcpHandler } from 'mcp-handler'
import { getVerse, getPassage, getChapter, searchVerses, getBooks, formatVerses } from '@/lib/bible'

const handler = createMcpHandler(
  (server) => {

    // Tool 1: Get a passage
    // Accepts: single verse, verse range, or whole chapter
    server.tool(
      'get_passage',
      'Get a Bible verse, verse range, or full chapter from the KJV. ' +
      'For a single verse: book="John", chapter=3, verse=16. ' +
      'For a range: book="Romans", chapter=8, verseStart=1, verseEnd=4. ' +
      'For a full chapter: omit verse params and set chapterOnly=true.',
      {
        book: z.string()
          .describe('Book name or abbreviation, e.g. "John", "Genesis", "ROM", "PSA"'),
        chapter: z.number().int().min(1)
          .describe('Chapter number (1-indexed)'),
        verse: z.number().int().min(1).optional()
          .describe('Verse number for a single verse lookup'),
        verseStart: z.number().int().min(1).optional()
          .describe('Start verse for a range lookup'),
        verseEnd: z.number().int().min(1).optional()
          .describe('End verse for a range lookup'),
        chapterOnly: z.boolean().optional().default(false)
          .describe('Set to true to retrieve the entire chapter'),
      },
      async ({ book, chapter, verse, verseStart, verseEnd, chapterOnly }) => {
        let verses

        if (chapterOnly || (!verse && !verseStart)) {
          verses = getChapter(book, chapter)
        } else if (verse) {
          const v = getVerse(book, chapter, verse)
          verses = v ? [v] : []
        } else {
          verses = getPassage(book, chapter, verseStart!, verseEnd ?? verseStart!)
        }

        if (verses.length === 0) {
          return { content: [{ type: 'text', text: `No results found for ${book} ${chapter}.` }] }
        }

        const ref = verses.length === 1
          ? `${verses[0].book} ${chapter}:${verses[0].verse}`
          : `${verses[0].book} ${chapter}:${verses[0].verse}–${verses[verses.length - 1].verse}`

        return {
          content: [{
            type: 'text',
            text: `${ref} (KJV)\n\n${formatVerses(verses)}`
          }]
        }
      }
    )

    // Tool 2: Keyword/phrase search
    server.tool(
      'search_bible',
      'Search the KJV Bible for verses containing a keyword or phrase. ' +
      'Examples: "love your enemies", "faith without works", "fear not".',
      {
        query: z.string().min(2)
          .describe('Word or phrase to search for'),
        limit: z.number().int().min(1).max(50).optional().default(20)
          .describe('Max number of results to return (default 20)'),
      },
      async ({ query, limit }) => {
        const results = searchVerses(query, limit)

        if (results.length === 0) {
          return { content: [{ type: 'text', text: `No verses found containing "${query}".` }] }
        }

        const lines = [
          `${results.length} result(s) for "${query}" in the KJV:\n`,
          ...results.map(v => `${v.book} ${v.chapter}:${v.verse} — ${v.text}`)
        ]

        return { content: [{ type: 'text', text: lines.join('\n') }] }
      }
    )

    // Tool 3: List books
    server.tool(
      'list_books',
      'List all 66 books of the KJV Bible with their abbreviations and chapter counts.',
      {},
      async () => {
        const books = getBooks()
        const lines = books.map(b => `${b.book} (${b.abbrev}) — ${b.chapterCount} chapters`)
        return {
          content: [{ type: 'text', text: `Books of the KJV Bible:\n\n${lines.join('\n')}` }]
        }
      }
    )

  },
  {},
  { basePath: '/api' }
)

export { handler as GET, handler as POST, handler as DELETE }
```

---

## Phase 4 — TypeScript config

Importing a large JSON file requires `resolveJsonModule` in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

Next.js includes this by default — no change needed unless it's missing.

---

## Phase 5 — Vercel config

No changes from v1. `vercel.json` stays the same:

```json
{
  "functions": {
    "app/api/mcp/route.ts": {
      "fluid": true
    }
  }
}
```

The bundled JSON adds ~1–2MB to the function bundle. Vercel's limit is 50MB — well within range.

---

## Phase 6 — Local testing

```bash
npm run dev
npx @modelcontextprotocol/inspector
```

- Streamable HTTP → `http://localhost:3000/api/mcp`

**Suggested test sequence:**
1. `list_books` → confirm all 66 books load correctly
2. `get_passage` with `book: "John", chapter: 3, verse: 16` → confirm KJV wording
3. `get_passage` with `book: "Psalm", chapter: 23, chapterOnly: true` → confirm full chapter
4. `search_bible` with `query: "love your enemies"` → confirm results with references

---

## Phase 7 — Deploy

```bash
vercel deploy
```

No environment variables. No external services. Ships complete.

---

## Key differences from v1

| | v1 (external API) | v2 (bundled) |
|---|---|---|
| External API | Yes | No |
| API key needed | No | No |
| Search | Server-side | In-memory substring |
| Cold start | Faster (no data load) | ~50ms extra to index verses |
| Offline capable | No | Yes |
| Translation support | 7 translations | KJV only (extensible) |
| Bundle size | Smaller | +~1MB for kjv.json |
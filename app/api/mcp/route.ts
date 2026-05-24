import { z } from 'zod'
import { createMcpHandler } from 'mcp-handler'
import { getVerse, getPassage, getChapter, searchVerses, getBooks, formatVerses } from '@/lib/bible'

const handler = createMcpHandler(
  (server) => {

    server.tool(
      'get_passage',
      'Get a Bible verse, verse range, or full chapter from the KJV. ' +
      'For a single verse: book="John", chapter=3, verse=16. ' +
      'For a range: book="Romans", chapter=8, verseStart=1, verseEnd=4. ' +
      'For a full chapter: omit verse params or set chapterOnly=true.',
      {
        book: z.string()
          .describe('Book name or abbreviation, e.g. "John", "Genesis", "ro", "ps"'),
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
          content: [{ type: 'text', text: `${ref} (KJV)\n\n${formatVerses(verses)}` }]
        }
      }
    )

    server.tool(
      'get_chapter',
      'Retrieve every verse in a full Bible chapter from the KJV. ' +
      'Example: book="Genesis", chapter=1.',
      {
        book: z.string()
          .describe('Book name or abbreviation, e.g. "John", "Genesis", "ro", "ps"'),
        chapter: z.number().int().min(1)
          .describe('Chapter number (1-indexed)'),
      },
      async ({ book, chapter }) => {
        const verses = getChapter(book, chapter)

        if (verses.length === 0) {
          return { content: [{ type: 'text', text: `No results found for ${book} ${chapter}.` }] }
        }

        return {
          content: [{ type: 'text', text: `${verses[0].book} ${chapter} (KJV)\n\n${formatVerses(verses)}` }]
        }
      }
    )

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

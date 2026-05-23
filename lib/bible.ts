import kjv from '@/data/kjv.json'

export interface Verse {
  book: string
  abbrev: string
  chapter: number  // 1-indexed
  verse: number    // 1-indexed
  text: string
}

export interface Book {
  book: string
  abbrev: string
  chapterCount: number
}

// Build a flat verse index once at module load
const ALL_VERSES: Verse[] = []

for (const b of kjv as Array<{ name: string; abbrev: string; chapters: string[][] }>) {
  b.chapters.forEach((chapter, chapterIndex) => {
    chapter.forEach((text, verseIndex) => {
      ALL_VERSES.push({
        book: b.name,
        abbrev: b.abbrev,
        chapter: chapterIndex + 1,
        verse: verseIndex + 1,
        text,
      })
    })
  })
}

function matchBook(v: Verse, book: string): boolean {
  const q = book.toLowerCase()
  return v.book.toLowerCase() === q || v.abbrev.toLowerCase() === q
}

export function getVerse(book: string, chapter: number, verse: number): Verse | null {
  return ALL_VERSES.find(v => matchBook(v, book) && v.chapter === chapter && v.verse === verse) ?? null
}

export function getPassage(book: string, chapter: number, verseStart: number, verseEnd: number): Verse[] {
  return ALL_VERSES.filter(
    v => matchBook(v, book) && v.chapter === chapter && v.verse >= verseStart && v.verse <= verseEnd
  )
}

export function getChapter(book: string, chapter: number): Verse[] {
  return ALL_VERSES.filter(v => matchBook(v, book) && v.chapter === chapter)
}

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

export function getBooks(): Book[] {
  return (kjv as Array<{ name: string; abbrev: string; chapters: string[][] }>).map(b => ({
    book: b.name,
    abbrev: b.abbrev,
    chapterCount: b.chapters.length,
  }))
}

export function formatVerses(verses: Verse[]): string {
  return verses.map(v => `[${v.verse}] ${v.text}`).join('\n')
}

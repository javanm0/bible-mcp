import styles from './page.module.css'
import McpSearchAnimation from '@/components/McpSearchAnimation'

const tools = [
  {
    name: 'get_passage',
    desc: 'Fetch a specific verse or passage by natural language reference — "John 3:16", "Romans 8:1-4", "Psalm 23".',
  },
  {
    name: 'get_chapter',
    desc: 'Retrieve an entire chapter — "Genesis 1", "John 3", "Revelation 22".',
  },
  {
    name: 'get_context',
    desc: 'Return the verses surrounding a given reference — useful for reading a passage in context after a search hit.',
  },
  {
    name: 'search_bible',
    desc: 'Full-text keyword search across the Bible — "love your enemies", "faith without works".',
  },
  {
    name: 'list_books',
    desc: 'List all books of the Bible with chapter counts for any supported translation.',
  },
]

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.badge}>Model Context Protocol</div>
        <h1 className={styles.title}>Bible MCP Server</h1>
        <p className={styles.subtitle}>
          A remote MCP server that gives AI assistants like Claude direct access to Scripture.{' '}
          <strong>MCP</strong> is a standard that lets AI models call external tools during a
          conversation — so instead of relying on training data, the AI fetches live, accurate
          Bible text on demand.
        </p>
      </header>

      <div className={styles.animationWrap}>
        <McpSearchAnimation />
      </div>

      <main className={styles.content}>
        <section className={styles.section}>
          <p className={styles.sectionLabel}>Tools</p>
          <h2 className={styles.sectionTitle}>Available Tools</h2>
          <div className={styles.tools}>
            {tools.map((t) => (
              <div key={t.name} className={styles.tool}>
                <div className={styles.toolName}>{t.name}</div>
                <div className={styles.toolDesc}>{t.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionLabel}>Connect</p>
          <h2 className={styles.sectionTitle}>Add to Claude</h2>
          <div className={styles.connectBox}>
            <div className={styles.connectBoxHeader}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
              claude_desktop_config.json
            </div>
            <div className={styles.connectBoxBody}>
              <pre className={styles.code}>{`{
  `}<span className={styles.key}>&quot;mcpServers&quot;</span>{`: {
    `}<span className={styles.key}>&quot;bible&quot;</span>{`: {
      `}<span className={styles.key}>&quot;url&quot;</span>{`: `}<span className={styles.str}>&quot;https://api.scripturescope.com/api/mcp&quot;</span>{`
    }
  }
}`}</pre>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        Copyright 2026 <a href="https://javanmiller.com" target="_blank" rel="noopener noreferrer">Javan Miller</a>. All Rights Reserved.
      </footer>
    </div>
  )
}

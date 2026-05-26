'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './McpSearchAnimation.module.css'

interface Props {
  query?: string
  mcpLabel?: string
  toolCall?: string
  response?: string
}

interface VerseEntry {
  ref: string
  quote: string
  note: string
}

const VERSES: VerseEntry[] = [
  {
    ref: 'Hebrews 13:5',
    quote: '"...for he hath said, I will never leave thee, nor forsake thee."',
    note: 'A direct, personal promise. Short and powerful.',
  },
  {
    ref: 'Joshua 1:9',
    quote: '"...be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest."',
    note: 'Great for someone feeling lost or displaced.',
  },
  {
    ref: 'Psalm 55:22',
    quote: '"Cast thy burden upon the LORD, and he shall sustain thee: he shall never suffer the righteous to be moved."',
    note: 'Speaks to loneliness as a burden you can hand over.',
  },
]

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export default function McpSearchAnimation({
  query = 'scriptures on trusting God in uncertainty',
  mcpLabel = 'Scripture Scope MCP',
  toolCall = 'search_bible(query)',
  response = 'Here are the top results: Hebrews 13:5, Joshua 1:9, and Psalm 55:22.',
}: Props) {
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showUserMessage, setShowUserMessage] = useState(false)
  const [showMcpPill, setShowMcpPill] = useState(false)
  const [mcpResolved, setMcpResolved] = useState(false)
  const [showTypingDots, setShowTypingDots] = useState(false)
  // 0 = none, 1 = initial response, 2–4 = verse follow-ups
  const [messageCount, setMessageCount] = useState(0)

  const cancelRef = useRef(false)
  const threadRef = useRef<HTMLDivElement>(null)

  // Scroll only the thread container, never the page
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [showUserMessage, showMcpPill, showTypingDots, messageCount])

  useEffect(() => {
    cancelRef.current = false

    const run = async () => {
      while (!cancelRef.current) {
        // Reset
        setInputText('')
        setIsTyping(false)
        setShowUserMessage(false)
        setShowMcpPill(false)
        setMcpResolved(false)
        setShowTypingDots(false)
        setMessageCount(0)

        await sleep(600)
        if (cancelRef.current) return

        // Type query
        setIsTyping(true)
        for (let i = 1; i <= query.length; i++) {
          if (cancelRef.current) return
          setInputText(query.slice(0, i))
          await sleep(60)
        }

        await sleep(500)
        if (cancelRef.current) return

        // Send
        setIsTyping(false)
        setInputText('')
        setShowUserMessage(true)

        await sleep(300)
        if (cancelRef.current) return

        // MCP pill — spinner
        setShowMcpPill(true)
        await sleep(1800)
        if (cancelRef.current) return

        // Spinner → checkmark
        setMcpResolved(true)
        await sleep(500)
        if (cancelRef.current) return

        // Initial response
        setShowTypingDots(true)
        await sleep(1600)
        if (cancelRef.current) return
        setShowTypingDots(false)
        setMessageCount(1)

        // Three verse follow-ups
        for (let v = 2; v <= 4; v++) {
          await sleep(900)
          if (cancelRef.current) return
          setShowTypingDots(true)
          await sleep(1400)
          if (cancelRef.current) return
          setShowTypingDots(false)
          setMessageCount(v)
        }

        await sleep(3000)
      }
    }

    run()
    return () => {
      cancelRef.current = true
    }
  }, [query])

  return (
    <div className={styles.card}>
      {/* Top bar */}
      <div className={styles.topBar}>
        <div className={styles.avatar}>C</div>
        <div className={styles.topBarText}>
          <div className={styles.agentName}>Claude</div>
          <div className={styles.agentSub}>
            <span className={styles.connectedDot} />
            scripture scope connected
          </div>
        </div>
      </div>

      {/* Scrollable message thread */}
      <div className={styles.thread} ref={threadRef}>
        {showUserMessage && (
          <div className={styles.userBubbleWrap}>
            <div className={styles.userBubble}>{query}</div>
          </div>
        )}

        {showMcpPill && (
          <div className={styles.mcpPill}>
            <span className={styles.mcpIcon}>
              {mcpResolved ? (
                <svg viewBox="0 0 16 16" fill="none" className={styles.checkIcon}>
                  <circle cx="8" cy="8" r="7" stroke="#22c55e" strokeWidth="1.5" />
                  <path
                    d="M5 8.5l2 2 4-4"
                    stroke="#22c55e"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className={styles.spinner} />
              )}
            </span>
            <span className={styles.mcpLabelText}>{mcpLabel}</span>
            <span className={styles.mcpSep}>›</span>
            <span className={styles.mcpToolText}>{toolCall}</span>
          </div>
        )}

        {messageCount >= 1 && (
          <div className={styles.claudeBubble}>{response}</div>
        )}

        {VERSES.map((verse, i) =>
          messageCount >= i + 2 ? (
            <div key={verse.ref} className={styles.claudeBubble}>
              <span className={styles.verseRef}>{verse.ref}</span>
              {' — '}
              <span className={styles.verseQuote}>{verse.quote}</span>
              <span className={styles.verseNote}>{verse.note}</span>
            </div>
          ) : null,
        )}

        {showTypingDots && (
          <div className={styles.typingWrap}>
            <div className={styles.typingBubble}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        )}

      </div>

      {/* Input */}
      <div className={styles.inputRow}>
        <div className={styles.inputWrap}>
          {inputText || isTyping ? (
            <>
              {inputText}
              {isTyping && <span className={styles.cursor} />}
            </>
          ) : (
            <span className={styles.inputPlaceholder}>Ask about a verse…</span>
          )}
        </div>
        <button className={styles.sendBtn} aria-label="Send" tabIndex={-1}>
          <svg viewBox="0 0 20 20" fill="none">
            <path
              d="M4 10h12M11 5l5 5-5 5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}

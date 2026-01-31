import fs from 'fs'
import path from 'path'
import { getTodayEST } from '@/lib/timezone'

// Use Jess's daily notes as the journal
const JOURNAL_DIR = '/home/ubuntu/clawd/memory'

export interface JournalEntry {
  date: string
  summary: string
  topics: string[]
  content: string
}

export interface JournalMeta {
  date: string
  summary: string
  topics: string[]
}

function ensureDir() {
  if (!fs.existsSync(JOURNAL_DIR)) {
    fs.mkdirSync(JOURNAL_DIR, { recursive: true })
  }
}

function dateToFilename(date: string): string {
  return `${date}.md`
}

// Extract summary from content (first non-heading, non-empty line)
function extractSummary(content: string): string {
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    // Skip empty lines and headings
    if (!trimmed || trimmed.startsWith('#')) continue
    // Return first content line, truncated
    return trimmed.slice(0, 100) + (trimmed.length > 100 ? '...' : '')
  }
  return 'Daily notes'
}

// Extract topics from H2 headings
function extractTopics(content: string): string[] {
  const topics: string[] = []
  const lines = content.split('\n')
  for (const line of lines) {
    const match = line.match(/^## (.+)$/)
    if (match) {
      // Clean up emojis and special chars for cleaner tags
      const topic = match[1].replace(/[🎉🔥⚠️✅❌📋🧠📝💬😊🔄]/g, '').trim()
      if (topic && !topics.includes(topic)) {
        topics.push(topic)
      }
    }
  }
  return topics.slice(0, 5) // Max 5 topics
}

export function getAllJournalEntries(): JournalMeta[] {
  ensureDir()
  
  const files = fs.readdirSync(JOURNAL_DIR).filter(f => f.endsWith('.md') && /^\d{4}-\d{2}-\d{2}\.md$/.test(f))
  
  return files.map(file => {
    const filePath = path.join(JOURNAL_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const date = file.replace('.md', '')
    
    return {
      date,
      summary: extractSummary(content),
      topics: extractTopics(content)
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getJournalEntry(date: string): JournalEntry | null {
  ensureDir()
  
  const filePath = path.join(JOURNAL_DIR, dateToFilename(date))
  
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  const content = fs.readFileSync(filePath, 'utf-8')
  
  return {
    date,
    summary: extractSummary(content),
    topics: extractTopics(content),
    content
  }
}

export function saveJournalEntry(
  date: string,
  summary: string,
  content: string,
  topics: string[] = []
): void {
  ensureDir()
  
  // Write directly as markdown (no frontmatter for Jess's notes)
  const filePath = path.join(JOURNAL_DIR, dateToFilename(date))
  fs.writeFileSync(filePath, content)
}

export function getTodayDate(): string {
  return getTodayEST()
}

export function getRecentEntries(limit: number = 7): JournalMeta[] {
  return getAllJournalEntries().slice(0, limit)
}

export function searchJournalEntries(query: string): JournalMeta[] {
  const entries = getAllJournalEntries()
  const lowerQuery = query.toLowerCase()
  
  return entries.filter(entry => {
    const summaryMatch = entry.summary.toLowerCase().includes(lowerQuery)
    const topicMatch = entry.topics.some(t => t.toLowerCase().includes(lowerQuery))
    const dateMatch = entry.date.includes(query)
    
    // Also search content
    const fullEntry = getJournalEntry(entry.date)
    const contentMatch = fullEntry?.content.toLowerCase().includes(lowerQuery) || false
    
    return summaryMatch || topicMatch || dateMatch || contentMatch
  })
}

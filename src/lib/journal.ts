import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const JOURNAL_DIR = path.join(process.cwd(), 'data', 'journal')

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

export function getAllJournalEntries(): JournalMeta[] {
  ensureDir()
  
  const files = fs.readdirSync(JOURNAL_DIR).filter(f => f.endsWith('.md'))
  
  return files.map(file => {
    const filePath = path.join(JOURNAL_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(content)
    const date = file.replace('.md', '')
    
    return {
      date,
      summary: data.summary || '',
      topics: data.topics || []
    }
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getJournalEntry(date: string): JournalEntry | null {
  ensureDir()
  
  const filePath = path.join(JOURNAL_DIR, dateToFilename(date))
  
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)
  
  return {
    date,
    summary: data.summary || '',
    topics: data.topics || [],
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
  
  const frontmatter = {
    date,
    summary,
    topics
  }
  
  const fileContent = matter.stringify(content, frontmatter)
  const filePath = path.join(JOURNAL_DIR, dateToFilename(date))
  
  fs.writeFileSync(filePath, fileContent)
}

export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
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

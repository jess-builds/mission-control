import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const DOCS_DIR = path.join(process.cwd(), 'data', 'documents')

export interface Document {
  slug: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface DocumentMeta {
  slug: string
  title: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function getAllDocuments(): DocumentMeta[] {
  ensureDir(DOCS_DIR)
  
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'))
  
  return files.map(file => {
    const filePath = path.join(DOCS_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(content)
    const slug = file.replace('.md', '')
    
    return {
      slug,
      title: data.title || slug,
      tags: data.tags || [],
      createdAt: data.createdAt || new Date().toISOString().split('T')[0],
      updatedAt: data.updatedAt || new Date().toISOString().split('T')[0]
    }
  }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getDocument(slug: string): Document | null {
  ensureDir(DOCS_DIR)
  
  const filePath = path.join(DOCS_DIR, `${slug}.md`)
  
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)
  
  return {
    slug,
    title: data.title || slug,
    content,
    tags: data.tags || [],
    createdAt: data.createdAt || new Date().toISOString().split('T')[0],
    updatedAt: data.updatedAt || new Date().toISOString().split('T')[0]
  }
}

export function saveDocument(slug: string, title: string, content: string, tags: string[] = []): void {
  ensureDir(DOCS_DIR)
  
  const existing = getDocument(slug)
  const now = new Date().toISOString().split('T')[0]
  
  const frontmatter = {
    title,
    tags,
    createdAt: existing?.createdAt || now,
    updatedAt: now
  }
  
  const fileContent = matter.stringify(content, frontmatter)
  const filePath = path.join(DOCS_DIR, `${slug}.md`)
  
  fs.writeFileSync(filePath, fileContent)
}

export function deleteDocument(slug: string): boolean {
  const filePath = path.join(DOCS_DIR, `${slug}.md`)
  
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
    return true
  }
  return false
}

export function searchDocuments(query: string): DocumentMeta[] {
  const allDocs = getAllDocuments()
  const lowerQuery = query.toLowerCase()
  
  return allDocs.filter(doc => {
    const titleMatch = doc.title.toLowerCase().includes(lowerQuery)
    const tagMatch = doc.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    
    // Also search content
    const fullDoc = getDocument(doc.slug)
    const contentMatch = fullDoc?.content.toLowerCase().includes(lowerQuery) || false
    
    return titleMatch || tagMatch || contentMatch
  })
}

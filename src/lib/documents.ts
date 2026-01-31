import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const DOCS_DIR = path.join(process.cwd(), 'data', 'documents')
const WORKSPACE_DIR = '/home/ubuntu/clawd'
const WORKSPACE_MEMORY_DIR = '/home/ubuntu/clawd/memory'

// Files from workspace to include
const WORKSPACE_FILES = [
  'SOUL.md',
  'MEMORY.md', 
  'USER.md',
  'AGENTS.md',
  'TOOLS.md',
  'IDENTITY.md',
  'HEARTBEAT.md',
  'PREFERENCES.md'
]

export interface Document {
  slug: string
  title: string
  content: string
  tags: string[]
  createdAt: string
  updatedAt: string
  source?: 'documents' | 'workspace' | 'workspace-memory'
}

export interface DocumentMeta {
  slug: string
  title: string
  tags: string[]
  createdAt: string
  updatedAt: string
  source?: 'documents' | 'workspace' | 'workspace-memory'
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

export function getAllDocuments(): DocumentMeta[] {
  ensureDir(DOCS_DIR)
  
  // Regular documents
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'))
  
  const regularDocs = files.map(file => {
    const filePath = path.join(DOCS_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')
    const { data } = matter(content)
    const slug = file.replace('.md', '')
    const stats = fs.statSync(filePath)
    
    return {
      slug,
      title: data.title || slug,
      tags: data.tags || [],
      createdAt: String(data.createdAt instanceof Date ? data.createdAt.toISOString().split('T')[0] : data.createdAt || new Date().toISOString().split('T')[0]),
      updatedAt: String(data.updatedAt instanceof Date ? data.updatedAt.toISOString().split('T')[0] : data.updatedAt || stats.mtime.toISOString().split('T')[0]),
      source: 'documents' as const
    }
  })
  
  // Workspace files (Jess's brain)
  const workspaceDocs = WORKSPACE_FILES.filter(file => {
    const filePath = path.join(WORKSPACE_DIR, file)
    return fs.existsSync(filePath)
  }).map(file => {
    const filePath = path.join(WORKSPACE_DIR, file)
    const stats = fs.statSync(filePath)
    const slug = `workspace-${file.replace('.md', '').toLowerCase()}`
    
    return {
      slug,
      title: `🧠 ${file.replace('.md', '')}`,
      tags: ['Jess', 'Workspace'],
      createdAt: stats.birthtime.toISOString().split('T')[0],
      updatedAt: stats.mtime.toISOString().split('T')[0],
      source: 'workspace' as const
    }
  })
  
  // Memory files now live in Journal section, not Documents
  
  return [...regularDocs, ...workspaceDocs]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export function getDocument(slug: string): Document | null {
  ensureDir(DOCS_DIR)
  
  // Check if it's a workspace file
  if (slug.startsWith('workspace-')) {
    const fileName = slug.replace('workspace-', '').toUpperCase() + '.md'
    const filePath = path.join(WORKSPACE_DIR, fileName)
    
    if (!fs.existsSync(filePath)) return null
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const stats = fs.statSync(filePath)
    
    return {
      slug,
      title: `🧠 ${fileName.replace('.md', '')}`,
      content,
      tags: ['Jess', 'Workspace'],
      createdAt: stats.birthtime.toISOString().split('T')[0],
      updatedAt: stats.mtime.toISOString().split('T')[0],
      source: 'workspace'
    }
  }
  
  // Check if it's a memory file
  if (slug.startsWith('memory-')) {
    const fileName = slug.replace('memory-', '') + '.md'
    const filePath = path.join(WORKSPACE_MEMORY_DIR, fileName)
    
    if (!fs.existsSync(filePath)) return null
    
    const content = fs.readFileSync(filePath, 'utf-8')
    const stats = fs.statSync(filePath)
    
    return {
      slug,
      title: `📝 ${fileName.replace('.md', '')}`,
      content,
      tags: ['Jess', 'Memory', 'Daily'],
      createdAt: stats.birthtime.toISOString().split('T')[0],
      updatedAt: stats.mtime.toISOString().split('T')[0],
      source: 'workspace-memory'
    }
  }
  
  // Regular document
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
    createdAt: String(data.createdAt instanceof Date ? data.createdAt.toISOString().split('T')[0] : data.createdAt || new Date().toISOString().split('T')[0]),
    updatedAt: String(data.updatedAt instanceof Date ? data.updatedAt.toISOString().split('T')[0] : data.updatedAt || new Date().toISOString().split('T')[0]),
    source: 'documents'
  }
}

export function saveDocument(slug: string, title: string, content: string, tags: string[] = []): void {
  ensureDir(DOCS_DIR)
  
  // Handle workspace files (write directly without frontmatter)
  if (slug.startsWith('workspace-')) {
    const fileName = slug.replace('workspace-', '').toUpperCase() + '.md'
    const filePath = path.join(WORKSPACE_DIR, fileName)
    fs.writeFileSync(filePath, content)
    return
  }
  
  // Handle memory files (write directly without frontmatter)
  if (slug.startsWith('memory-')) {
    const fileName = slug.replace('memory-', '') + '.md'
    const filePath = path.join(WORKSPACE_MEMORY_DIR, fileName)
    fs.writeFileSync(filePath, content)
    return
  }
  
  // Regular document with frontmatter
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

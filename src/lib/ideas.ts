import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const IDEAS_DIR = path.join(process.cwd(), 'data', 'ideas');

export interface Idea {
  id: string;
  title: string;
  thumbnail: string; // emoji or image URL
  summary: string;
  status: 'new' | 'exploring' | 'planned' | 'building' | 'completed' | 'archived';
  source: 'journal' | 'nightly' | 'manual';
  sourceDate?: string;
  createdAt: string;
  updatedAt: string;
  why: string; // Why this is a good idea
  flow: string; // How it works with our flow
  implementation: string; // Potential implementation plan
  ux: string; // User experience walkthrough
  tags: string[];
}

function ensureDir() {
  if (!existsSync(IDEAS_DIR)) {
    mkdirSync(IDEAS_DIR, { recursive: true });
  }
}

export function getAllIdeas(): Idea[] {
  ensureDir();
  const files = readdirSync(IDEAS_DIR).filter(f => f.endsWith('.json'));
  const ideas: Idea[] = [];
  
  for (const file of files) {
    try {
      const content = readFileSync(path.join(IDEAS_DIR, file), 'utf-8');
      ideas.push(JSON.parse(content));
    } catch (e) {
      console.error(`Error reading idea ${file}:`, e);
    }
  }
  
  // Sort by updatedAt descending (newest first)
  return ideas.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getIdeaById(id: string): Idea | null {
  ensureDir();
  const filePath = path.join(IDEAS_DIR, `${id}.json`);
  
  if (!existsSync(filePath)) {
    return null;
  }
  
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`Error reading idea ${id}:`, e);
    return null;
  }
}

export function createIdea(data: Partial<Idea>): Idea {
  ensureDir();
  const now = new Date().toISOString();
  
  const idea: Idea = {
    id: uuidv4(),
    title: data.title || 'Untitled Idea',
    thumbnail: data.thumbnail || '💡',
    summary: data.summary || '',
    status: data.status || 'new',
    source: data.source || 'manual',
    sourceDate: data.sourceDate,
    createdAt: now,
    updatedAt: now,
    why: data.why || '',
    flow: data.flow || '',
    implementation: data.implementation || '',
    ux: data.ux || '',
    tags: data.tags || [],
  };
  
  const filePath = path.join(IDEAS_DIR, `${idea.id}.json`);
  writeFileSync(filePath, JSON.stringify(idea, null, 2));
  
  return idea;
}

export function updateIdea(id: string, data: Partial<Idea>): Idea | null {
  const existing = getIdeaById(id);
  if (!existing) return null;
  
  const updated: Idea = {
    ...existing,
    ...data,
    id: existing.id, // Don't allow changing ID
    createdAt: existing.createdAt, // Don't allow changing createdAt
    updatedAt: new Date().toISOString(),
  };
  
  const filePath = path.join(IDEAS_DIR, `${id}.json`);
  writeFileSync(filePath, JSON.stringify(updated, null, 2));
  
  return updated;
}

export function deleteIdea(id: string): boolean {
  const filePath = path.join(IDEAS_DIR, `${id}.json`);
  
  if (!existsSync(filePath)) {
    return false;
  }
  
  try {
    unlinkSync(filePath);
    return true;
  } catch (e) {
    console.error(`Error deleting idea ${id}:`, e);
    return false;
  }
}

export function getIdeasByStatus(status: Idea['status']): Idea[] {
  return getAllIdeas().filter(idea => idea.status === status);
}

export function getIdeasByTag(tag: string): Idea[] {
  return getAllIdeas().filter(idea => idea.tags.includes(tag));
}

export function searchIdeas(query: string): Idea[] {
  const q = query.toLowerCase();
  return getAllIdeas().filter(idea => 
    idea.title.toLowerCase().includes(q) ||
    idea.summary.toLowerCase().includes(q) ||
    idea.why.toLowerCase().includes(q) ||
    idea.tags.some(t => t.toLowerCase().includes(q))
  );
}

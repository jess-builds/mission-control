import { NextRequest, NextResponse } from 'next/server'
import { getAllDocuments, saveDocument, searchDocuments } from '@/lib/documents'

export async function GET(request: NextRequest) {
  const searchQuery = request.nextUrl.searchParams.get('search')
  
  if (searchQuery) {
    const documents = searchDocuments(searchQuery)
    return NextResponse.json(documents)
  }
  
  const documents = getAllDocuments()
  return NextResponse.json(documents)
}

export async function POST(request: NextRequest) {
  try {
    const { slug, title, content, tags } = await request.json()
    
    if (!slug || !title) {
      return NextResponse.json({ error: 'Slug and title are required' }, { status: 400 })
    }
    
    saveDocument(slug, title, content || '', tags || [])
    
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

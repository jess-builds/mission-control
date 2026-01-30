import { NextRequest, NextResponse } from 'next/server';
import { getIdeaById, updateIdea, deleteIdea } from '@/lib/ideas';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idea = getIdeaById(id);
  
  if (!idea) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }
  
  return NextResponse.json(idea);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const data = await request.json();
    const idea = updateIdea(id, data);
    
    if (!idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
    }
    
    return NextResponse.json(idea);
  } catch (error) {
    console.error('Error updating idea:', error);
    return NextResponse.json({ error: 'Failed to update idea' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = deleteIdea(id);
  
  if (!success) {
    return NextResponse.json({ error: 'Idea not found' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true });
}

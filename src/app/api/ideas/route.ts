import { NextRequest, NextResponse } from 'next/server';
import { getAllIdeas, createIdea, searchIdeas, getIdeasByStatus } from '@/lib/ideas';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search');
  const status = searchParams.get('status');
  
  let ideas;
  
  if (search) {
    ideas = searchIdeas(search);
  } else if (status) {
    ideas = getIdeasByStatus(status as any);
  } else {
    ideas = getAllIdeas();
  }
  
  return NextResponse.json(ideas);
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const idea = createIdea(data);
    return NextResponse.json(idea, { status: 201 });
  } catch (error) {
    console.error('Error creating idea:', error);
    return NextResponse.json({ error: 'Failed to create idea' }, { status: 500 });
  }
}

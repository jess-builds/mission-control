import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const personaPath = path.join(
      process.cwd(), 
      'server/council/personas', 
      `${params.role}.json`
    );
    const content = await fs.readFile(personaPath, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (error) {
    return NextResponse.json(
      { error: 'Persona not found' },
      { status: 404 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { role: string } }
) {
  try {
    const body = await req.json();
    const personaPath = path.join(
      process.cwd(), 
      'server/council/personas', 
      `${params.role}.json`
    );
    
    // Validate the persona data
    const requiredFields = ['role', 'name', 'emoji', 'model', 'coreIdentity'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Write updated persona
    await fs.writeFile(personaPath, JSON.stringify(body, null, 2));
    return NextResponse.json({ success: true, persona: body });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update persona' },
      { status: 500 }
    );
  }
}
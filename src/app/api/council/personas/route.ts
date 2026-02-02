import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const personasDir = path.join(process.cwd(), 'server/council/personas');
    const files = await fs.readdir(personasDir);
    
    const personas = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(async (file) => {
          const content = await fs.readFile(path.join(personasDir, file), 'utf-8');
          return JSON.parse(content);
        })
    );

    return NextResponse.json(personas);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to load personas' },
      { status: 500 }
    );
  }
}
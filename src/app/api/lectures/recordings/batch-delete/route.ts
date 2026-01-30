import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'lectures');

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No recording IDs provided' }, { status: 400 });
    }
    
    const coursesFile = path.join(DATA_DIR, 'courses.json');
    if (!fs.existsSync(coursesFile)) {
      return NextResponse.json({ error: 'No courses found' }, { status: 404 });
    }
    
    const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf-8'));
    const deleted: string[] = [];
    const failed: string[] = [];
    
    for (const id of ids) {
      let found = false;
      
      for (const course of courses) {
        const metadataPath = path.join(DATA_DIR, course.id, 'recordings', `${id}.json`);
        const audioPath = path.join(DATA_DIR, course.id, 'recordings', `${id}.webm`);
        
        if (fs.existsSync(metadataPath)) {
          try {
            fs.unlinkSync(metadataPath);
            if (fs.existsSync(audioPath)) {
              fs.unlinkSync(audioPath);
            }
            deleted.push(id);
            found = true;
            break;
          } catch (e) {
            failed.push(id);
            found = true;
            break;
          }
        }
      }
      
      if (!found) {
        failed.push(id);
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      deleted, 
      failed,
      deletedCount: deleted.length,
      failedCount: failed.length
    });
  } catch (error) {
    console.error('Failed to batch delete recordings:', error);
    return NextResponse.json({ error: 'Failed to delete recordings' }, { status: 500 });
  }
}

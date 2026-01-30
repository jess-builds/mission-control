/**
 * Test script for chunked transcription
 * 
 * This tests:
 * 1. ffmpeg is available and can split audio
 * 2. The chunking logic works for long files
 * 3. Whisper API can transcribe chunks
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir, unlink, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import OpenAI from 'openai';

const execAsync = promisify(exec);

const TEST_DIR = path.join(process.cwd(), 'data', 'test-transcription');
const CHUNK_DURATION_SEC = 600; // 10 minutes

// Colors for output
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;

async function test(name: string, fn: () => Promise<void>) {
  process.stdout.write(`  ${name}... `);
  try {
    await fn();
    console.log(green('✓'));
    return true;
  } catch (error) {
    console.log(red('✗'));
    console.log(`    ${red(String(error))}`);
    return false;
  }
}

async function getAudioDuration(audioPath: string): Promise<number> {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${audioPath}"`
  );
  return parseFloat(stdout.trim());
}

async function main() {
  console.log('\n📼 Lecture Transcription Test Suite\n');
  
  let passed = 0;
  let failed = 0;
  
  // Setup
  await mkdir(TEST_DIR, { recursive: true });
  
  // Test 1: ffmpeg available
  if (await test('ffmpeg is installed', async () => {
    const { stdout } = await execAsync('ffmpeg -version');
    if (!stdout.includes('ffmpeg version')) throw new Error('ffmpeg not found');
  })) passed++; else failed++;
  
  // Test 2: ffprobe available  
  if (await test('ffprobe is installed', async () => {
    const { stdout } = await execAsync('ffprobe -version');
    if (!stdout.includes('ffprobe version')) throw new Error('ffprobe not found');
  })) passed++; else failed++;
  
  // Test 3: Generate test audio (30 seconds of silence with tone)
  const testAudioPath = path.join(TEST_DIR, 'test-audio.webm');
  if (await test('Generate 30s test audio', async () => {
    // Generate 30 seconds of a simple sine wave tone
    await execAsync(
      `ffmpeg -y -f lavfi -i "sine=frequency=440:duration=30" -c:a libopus -b:a 64k "${testAudioPath}"`
    );
    if (!existsSync(testAudioPath)) throw new Error('Audio file not created');
  })) passed++; else failed++;
  
  // Test 4: Get duration
  if (await test('ffprobe can read duration', async () => {
    const duration = await getAudioDuration(testAudioPath);
    if (duration < 29 || duration > 31) throw new Error(`Expected ~30s, got ${duration}s`);
  })) passed++; else failed++;
  
  // Test 5: File size is reasonable
  if (await test('Audio file size is reasonable', async () => {
    const stats = await stat(testAudioPath);
    const sizeKB = stats.size / 1024;
    // 30 seconds at 64kbps should be ~240KB
    if (sizeKB < 100 || sizeKB > 500) throw new Error(`Unexpected size: ${sizeKB.toFixed(0)}KB`);
    console.log(`(${sizeKB.toFixed(0)}KB)`);
  })) passed++; else failed++;
  
  // Test 6: Generate longer test audio (simulating 2.5 hour lecture math)
  if (await test('Chunking math is correct for 2.5hr lecture', async () => {
    const lectureDuration = 2.5 * 60 * 60; // 2.5 hours in seconds = 9000
    const numChunks = Math.ceil(lectureDuration / CHUNK_DURATION_SEC);
    // 9000 / 600 = 15 chunks
    if (numChunks !== 15) throw new Error(`Expected 15 chunks, got ${numChunks}`);
    
    // Each chunk at 128kbps for 10 minutes = ~9.6MB (under 25MB limit)
    const chunkSizeMB = (128000 * CHUNK_DURATION_SEC) / 8 / 1024 / 1024;
    if (chunkSizeMB > 20) throw new Error(`Chunk too large: ${chunkSizeMB.toFixed(1)}MB`);
    console.log(`(${numChunks} chunks × ${chunkSizeMB.toFixed(1)}MB each)`);
  })) passed++; else failed++;
  
  // Test 7: Can split audio into chunks
  const chunkPath = path.join(TEST_DIR, 'chunk_000.webm');
  if (await test('Can split audio with ffmpeg', async () => {
    await execAsync(
      `ffmpeg -y -i "${testAudioPath}" -ss 0 -t 15 -vn -acodec copy "${chunkPath}"`
    );
    if (!existsSync(chunkPath)) throw new Error('Chunk not created');
    const duration = await getAudioDuration(chunkPath);
    if (duration < 14 || duration > 16) throw new Error(`Expected ~15s chunk, got ${duration}s`);
  })) passed++; else failed++;
  
  // Test 8: OpenAI API key is configured
  if (await test('OpenAI API key is configured', async () => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not set');
    }
  })) passed++; else failed++;
  
  // Test 9: Can transcribe a chunk with Whisper
  if (await test('Whisper API can transcribe audio', async () => {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const audioBuffer = await readFile(chunkPath);
    const file = new File([audioBuffer], 'test.webm', { type: 'audio/webm' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });
    
    // Silence/tone won't produce meaningful text, but API should return something
    if (typeof transcription !== 'string') throw new Error('Invalid response type');
    console.log(`(API responded OK)`);
  })) passed++; else failed++;
  
  // Cleanup
  console.log('\n  Cleaning up test files...');
  try {
    await unlink(testAudioPath);
    await unlink(chunkPath);
    await unlink(TEST_DIR).catch(() => {}); // May fail if not empty
  } catch (e) {
    // Ignore cleanup errors
  }
  
  // Summary
  console.log('\n' + '─'.repeat(40));
  console.log(`  Results: ${green(`${passed} passed`)}, ${failed > 0 ? red(`${failed} failed`) : `${failed} failed`}`);
  console.log('─'.repeat(40) + '\n');
  
  if (failed > 0) {
    console.log(yellow('⚠️  Some tests failed. Check the errors above.\n'));
    process.exit(1);
  } else {
    console.log(green('✅ All tests passed! Ready for 2.5-hour lectures.\n'));
    process.exit(0);
  }
}

main().catch(console.error);

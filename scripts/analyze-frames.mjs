#!/usr/bin/env node
// Usage: node scripts/analyze-frames.mjs <path-to-mp4> [num-frames] [batch-size]
// Extracts frames via ffmpeg and OCRs them via Gemini in batches, then aggregates.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { GoogleGenerativeAI } from '@google/generative-ai';

const KEY = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
if (!KEY) {
  console.error('Missing GEMINI_API_KEY in .env');
  process.exit(1);
}

const file = process.argv[2];
const numFrames = Math.max(4, Math.min(40, Number(process.argv[3] ?? 24)));
const batchSize = Math.max(2, Math.min(8, Number(process.argv[4] ?? 6)));
if (!file || !fs.existsSync(file)) {
  console.error('Usage: node scripts/analyze-frames.mjs <path-to-mp4> [num-frames=24] [batch-size=6]');
  process.exit(1);
}

const outDir = path.join(path.dirname(file), `frames-${Date.now()}`);
fs.mkdirSync(outDir, { recursive: true });

const dur = execFileSync('ffprobe', [
  '-v', 'error',
  '-show_entries', 'format=duration',
  '-of', 'default=noprint_wrappers=1:nokey=1',
  file,
]).toString().trim();
const seconds = parseFloat(dur) || 30;
console.log(`Video: ${seconds.toFixed(1)}s · extracting ${numFrames} frames at 480p · ${batchSize}/batch`);

// Extract frames at 480p, compressed JPEG (q=8 = good OCR readability, smaller bytes)
const fps = numFrames / seconds;
execFileSync('ffmpeg', [
  '-y', '-loglevel', 'error',
  '-i', file,
  '-vf', `fps=${fps.toFixed(4)},scale=-2:480`,
  '-frames:v', String(numFrames),
  '-q:v', '8',
  path.join(outDir, 'frame_%03d.jpg'),
]);

const frameFiles = fs.readdirSync(outDir).filter((f) => f.endsWith('.jpg')).sort();
console.log(`Extracted ${frameFiles.length} frames`);

const totalBytes = frameFiles.reduce((sum, f) => sum + fs.statSync(path.join(outDir, f)).size, 0);
console.log(`Total frame bytes: ${(totalBytes / 1024).toFixed(0)} KB`);

const genAI = new GoogleGenerativeAI(KEY);
const models = ['gemini-flash-latest', 'gemini-2.5-flash-lite'];

async function callGemini(parts, prompt) {
  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const r = await model.generateContent([...parts, prompt]);
      return { text: r.response.text(), model: m };
    } catch (err) {
      const msg = err instanceof Error ? err.message.slice(0, 80) : String(err);
      console.log(`    ${m} failed: ${msg}`);
    }
  }
  return null;
}

// Process frames in batches
const allFindings = [];
for (let i = 0; i < frameFiles.length; i += batchSize) {
  const batch = frameFiles.slice(i, i + batchSize);
  const idx = Math.floor(i / batchSize) + 1;
  const total = Math.ceil(frameFiles.length / batchSize);
  process.stdout.write(`Batch ${idx}/${total} (${batch.length} frames)... `);
  const parts = batch.map((f) => ({
    inlineData: {
      data: fs.readFileSync(path.join(outDir, f)).toString('base64'),
      mimeType: 'image/jpeg',
    },
  }));
  const prompt = `These are sequential keyframes from an Instagram reel. For EACH frame, OCR every visible piece of text — especially URLs, website names, company names, and any list items. Be exhaustive. Output as plain bullet list per frame:

Frame N:
- text item 1
- text item 2
- (visual context if useful)

Then at the end, give a "UNIQUE WEBSITES/URLS:" section listing every unique web address or service name across all frames.`;
  const result = await callGemini(parts, prompt);
  if (result) {
    console.log(`ok (${result.model})`);
    allFindings.push(result.text);
  } else {
    console.log('failed');
  }
  // Tiny breather to respect rate limits
  await new Promise((r) => setTimeout(r, 1500));
}

if (allFindings.length === 0) {
  console.error('\nAll batches failed.');
  process.exit(1);
}

// Final aggregation pass: ask Gemini to consolidate all findings
console.log('\nAggregating unique URLs across all batches...');
const aggregated = await callGemini(
  [],
  `Below are OCR results from multiple batches of frames from the same Instagram reel.
Consolidate them into ONE clean output:

1. A complete deduplicated list of ALL website URLs / service names mentioned (one per line, formatted as visible text).
2. Any specific claims, numbers, or names.
3. Group the websites by category if obvious (e.g. Remote, Freelance, Tech, Design).

Do NOT invent. If a URL appears as just text, keep it as text.

=== BATCH RESULTS ===
${allFindings.map((t, i) => `--- Batch ${i + 1} ---\n${t}`).join('\n\n')}`,
);

if (!aggregated) {
  console.error('\nAggregation failed but per-batch findings below:\n');
  console.log(allFindings.join('\n\n---\n\n'));
  process.exit(1);
}

console.log(`\n=== CONSOLIDATED OCR (model: ${aggregated.model}) ===\n`);
console.log(aggregated.text);
console.log(`\nFrames at: ${outDir}`);

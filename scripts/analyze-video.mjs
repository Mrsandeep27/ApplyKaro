#!/usr/bin/env node
// Usage: node scripts/analyze-video.mjs <path-to-mp4>
// Sends a local video file to Gemini for transcription + summary.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';

const KEY = process.env.GEMINI_API_KEY ?? process.env.VITE_GEMINI_API_KEY;
if (!KEY) {
  console.error('Missing GEMINI_API_KEY in .env');
  process.exit(1);
}

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/analyze-video.mjs <path-to-mp4>');
  process.exit(1);
}
if (!fs.existsSync(file)) {
  console.error('File not found:', file);
  process.exit(1);
}

const buf = fs.readFileSync(file);
console.log(`Analyzing ${path.basename(file)} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);

const genAI = new GoogleGenerativeAI(KEY);
const inlineData = { data: buf.toString('base64'), mimeType: 'video/mp4' };
const prompt = `Watch this Instagram reel and produce:
1. A complete transcript of what is said (in the original language).
2. If the language is not English, an English translation.
3. The main message in 3 short bullets.
4. Any product/service being promoted, with the call-to-action.
5. Any specific claims, numbers, or names mentioned.
Be concise.`;

const models = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.5-flash-lite'];
let result = null;
let used = null;
for (const m of models) {
  try {
    process.stdout.write(`Trying ${m}... `);
    const model = genAI.getGenerativeModel({ model: m });
    const r = await model.generateContent([{ inlineData }, prompt]);
    result = r.response.text();
    used = m;
    console.log('ok');
    break;
  } catch (err) {
    console.log('failed:', err instanceof Error ? err.message.slice(0, 100) : err);
  }
}

if (!result) {
  console.error('\nAll Gemini models failed. Daily quota probably exhausted.');
  process.exit(1);
}

console.log(`\n=== ANALYSIS (model: ${used}) ===\n`);
console.log(result);

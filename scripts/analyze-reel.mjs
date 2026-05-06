#!/usr/bin/env node
// Usage: node scripts/analyze-reel.mjs <instagram-reel-url>
// Pulls the reel via Apify's Instagram scraper and downloads the MP4.

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APIFY_TOKEN = process.env.APIFY_TOKEN;

if (!APIFY_TOKEN) {
  console.error('Missing APIFY_TOKEN in .env');
  process.exit(1);
}

const url = process.argv[2];
if (!url) {
  console.error('Usage: node scripts/analyze-reel.mjs <instagram-reel-url>');
  process.exit(1);
}

console.log('Calling Apify Instagram scraper for', url);
console.log('(takes 30-90s — Apify spins up a worker)');

const apifyUrl = `https://api.apify.com/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items?token=${APIFY_TOKEN}&timeout=120`;
const res = await fetch(apifyUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    directUrls: [url],
    resultsLimit: 1,
    resultsType: 'posts',
    addParentData: false,
  }),
});

if (!res.ok) {
  console.error('Apify error', res.status, (await res.text()).slice(0, 400));
  process.exit(1);
}

const items = await res.json();
const post = Array.isArray(items) ? items[0] : null;
if (!post) {
  console.error('No post returned. Raw:', JSON.stringify(items).slice(0, 400));
  process.exit(1);
}

console.log('\nOwner    :', post.ownerUsername ?? '?');
console.log('Caption  :', (post.caption ?? '').slice(0, 240));
console.log('Likes    :', post.likesCount ?? '?');
console.log('Hashtags :', (post.hashtags ?? []).join(' '));

if (!post.videoUrl) {
  console.error('\nNo videoUrl in scrape result — Apify may not have grabbed the file. Full keys:', Object.keys(post));
  process.exit(1);
}

console.log('\nDownloading MP4...');
const vidRes = await fetch(post.videoUrl);
if (!vidRes.ok) {
  console.error('Video download failed:', vidRes.status);
  process.exit(1);
}
const buf = Buffer.from(await vidRes.arrayBuffer());
const dir = path.resolve(__dirname, '..', 'server', 'data', 'reels');
fs.mkdirSync(dir, { recursive: true });
const out = path.join(dir, `reel-${Date.now()}.mp4`);
fs.writeFileSync(out, buf);
console.log(`Saved ${out} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);

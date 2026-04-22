import { Router } from 'express';
import { bus } from '../lib/events.js';
import { enqueue, getStatus, pause, resume, run, stop, clear, type QueueItem } from '../worker/apply-queue.js';

export const applyRouter = Router();

applyRouter.get('/status', (_req, res) => {
  res.json(getStatus());
});

applyRouter.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`data: ${JSON.stringify({ type: 'ping', at: new Date().toISOString() })}\n\n`);
  bus.subscribe(res);
  const ping = setInterval(() => res.write(`: ping\n\n`), 15_000);
  req.on('close', () => clearInterval(ping));
});

applyRouter.post('/start', (req, res) => {
  const items: QueueItem[] = Array.isArray(req.body?.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'No items to apply' });
  enqueue(items);
  // Fire-and-forget; events stream via SSE
  run();
  res.json({ queued: items.length });
});

applyRouter.post('/pause', (_req, res) => {
  pause();
  res.json({ paused: true });
});

applyRouter.post('/resume', (_req, res) => {
  resume();
  run();
  res.json({ paused: false });
});

applyRouter.post('/stop', (_req, res) => {
  stop();
  res.json({ stopped: true });
});

applyRouter.post('/clear', (_req, res) => {
  clear();
  res.json({ cleared: true });
});

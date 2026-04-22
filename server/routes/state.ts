import { Router } from 'express';
import { loadState, saveState } from '../lib/store.js';
import { geminiReady } from '../lib/ai.js';
import { snapshot } from '../lib/safety.js';

export const stateRouter = Router();

stateRouter.get('/', (_req, res) => {
  const s = loadState();
  res.json({
    resume: s.resume ?? null,
    preferences: s.preferences ?? null,
    connected_portals: s.connected_portals ?? [],
    counters: snapshot(),
    gemini_ready: geminiReady,
  });
});

stateRouter.put('/resume', (req, res) => {
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Body required' });
  saveState({ resume: req.body });
  res.json({ ok: true });
});

stateRouter.put('/preferences', (req, res) => {
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Body required' });
  saveState({ preferences: req.body });
  res.json({ ok: true });
});

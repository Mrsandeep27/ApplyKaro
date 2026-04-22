import { Router } from 'express';
import { loadState, saveState } from '../lib/store.js';
import { geminiReady } from '../lib/ai.js';
import { snapshot } from '../lib/safety.js';

export const stateRouter = Router();

stateRouter.get('/', (_req, res, next) => {
  try {
    const s = loadState();
    res.json({
      resume: s.resume ?? null,
      preferences: s.preferences ?? null,
      connected_portals: s.connected_portals ?? [],
      counters: snapshot(),
      gemini_ready: geminiReady,
    });
  } catch (err) {
    next(err);
  }
});

stateRouter.put('/resume', (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Body required' });
    }
    saveState({ resume: req.body });
    res.json({ ok: true });
  } catch (err) {
    console.error('[state] PUT /resume failed:', err);
    next(err);
  }
});

stateRouter.put('/preferences', (req, res, next) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Body required' });
    }
    // Strip client-only fields that don't belong on the server
    const { id: _id, ...clean } = req.body as Record<string, unknown>;
    saveState({ preferences: clean as unknown as Parameters<typeof saveState>[0]['preferences'] });
    res.json({ ok: true });
  } catch (err) {
    console.error('[state] PUT /preferences failed:', err);
    console.error('[state] body was:', JSON.stringify(req.body).slice(0, 500));
    next(err);
  }
});

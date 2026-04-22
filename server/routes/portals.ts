import { Router } from 'express';
import { connectNaukri } from '../portals/naukri.js';
import { forgetSession, isConnected } from '../portals/session.js';
import { loadState, saveState } from '../lib/store.js';
import { snapshot } from '../lib/safety.js';

export const portalsRouter = Router();

portalsRouter.get('/', (_req, res, next) => {
  try {
    const state = loadState();
    const slugs = ['naukri', 'linkedin', 'indeed', 'internshala'];
    const portals = slugs.map((slug) => {
      let connected = false;
      try {
        connected = isConnected(slug);
      } catch (err) {
        console.warn(`[portals] isConnected(${slug}) threw:`, err instanceof Error ? err.message : err);
      }
      return { slug, connected };
    });
    let counters: ReturnType<typeof snapshot> = {};
    try {
      counters = snapshot();
    } catch (err) {
      console.warn('[portals] snapshot() threw:', err instanceof Error ? err.message : err);
    }
    res.json({ portals, counters, connected: state.connected_portals ?? [] });
  } catch (err) {
    next(err);
  }
});

portalsRouter.post('/:portal/connect', async (req, res, next) => {
  const { portal } = req.params;
  try {
    let result;
    switch (portal) {
      case 'naukri':
        result = await connectNaukri();
        break;
      default:
        return res.status(400).json({ error: `Portal "${portal}" not yet supported. Only Naukri is wired up.` });
    }
    if (result.loggedIn) {
      const state = loadState();
      const connected = new Set(state.connected_portals ?? []);
      connected.add(portal);
      saveState({ connected_portals: [...connected] });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
});

portalsRouter.delete('/:portal', (req, res, next) => {
  try {
    const { portal } = req.params;
    forgetSession(portal);
    const state = loadState();
    saveState({ connected_portals: (state.connected_portals ?? []).filter((p) => p !== portal) });
    res.json({ portal, forgotten: true });
  } catch (err) {
    next(err);
  }
});

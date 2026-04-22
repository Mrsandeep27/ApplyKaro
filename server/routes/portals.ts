import { Router } from 'express';
import { connectNaukri } from '../portals/naukri.js';
import { forgetSession, isConnected } from '../portals/session.js';
import { loadState, saveState } from '../lib/store.js';
import { snapshot } from '../lib/safety.js';

export const portalsRouter = Router();

portalsRouter.get('/', (_req, res) => {
  const state = loadState();
  const portals = ['naukri', 'linkedin', 'indeed', 'internshala'].map((slug) => ({
    slug,
    connected: isConnected(slug),
  }));
  res.json({ portals, counters: snapshot(), connected: state.connected_portals ?? [] });
});

portalsRouter.post('/:portal/connect', async (req, res) => {
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
    res.status(500).json({ error: err instanceof Error ? err.message : 'unknown error' });
  }
});

portalsRouter.delete('/:portal', (req, res) => {
  const { portal } = req.params;
  forgetSession(portal);
  const state = loadState();
  saveState({ connected_portals: (state.connected_portals ?? []).filter((p) => p !== portal) });
  res.json({ portal, forgotten: true });
});

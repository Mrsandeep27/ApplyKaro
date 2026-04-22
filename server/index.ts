import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ensureDataDirs, SCREENSHOTS_DIR } from './lib/paths.js';
import { portalsRouter } from './routes/portals.js';
import { jobsRouter } from './routes/jobs.js';
import { applyRouter } from './routes/apply.js';
import { stateRouter } from './routes/state.js';
import { geminiReady } from './lib/ai.js';

ensureDataDirs();

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }));
app.use(express.json({ limit: '5mb' }));
app.use(morgan('tiny'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, gemini_ready: geminiReady });
});

app.use('/api/state', stateRouter);
app.use('/api/portals', portalsRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/apply', applyRouter);
app.use('/api/screenshots', express.static(SCREENSHOTS_DIR));

// Global error handler — logs real stack + returns JSON so the client can read it
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error('[applykaro] unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: msg });
  }
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`[applykaro] server listening on http://localhost:${port}`);
  console.log(`[applykaro] gemini: ${geminiReady ? 'enabled' : 'disabled (set GEMINI_API_KEY)'}`);
});

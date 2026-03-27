import cors from 'cors';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from './config';
import { initDatabase } from './db/database';
import { errorHandler } from './lib/errors';
import { apiRouter } from './routes/api';

async function main() {
  await initDatabase();

  const app = express();

  app.use(
    cors({
      origin: config.clientOrigin,
      credentials: true
    })
  );
  app.use(express.json({ limit: config.jsonLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.jsonLimit }));

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      code: 'NODE_ACTIVE',
      message: 'BLACKWIRE backend is live.'
    });
  });

  app.use('/api', apiRouter);

  if (config.nodeEnv === 'production') {
    const distPath = path.join(config.projectRoot, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`BLACKWIRE backend listening on http://localhost:${config.port}`);
  });
}

void main();

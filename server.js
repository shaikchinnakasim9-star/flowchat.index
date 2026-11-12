import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ChatFlowError, generateWorkflow } from './lib/workflow-parser.js';

const directory = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  const analysisWindowMs = 60_000;
  const analysisRequestsPerWindow = 10;
  const analysisRequests = new Map();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '180kb' }));

  app.use('/api/analyze', (request, response, next) => {
    const now = Date.now();
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const current = analysisRequests.get(key);
    if (current && current.expiresAt > now) {
      if (current.count >= analysisRequestsPerWindow) {
        return response.status(429).json({ error: 'Too many analysis requests. Wait a minute and try again.' });
      }
      current.count += 1;
    } else {
      analysisRequests.set(key, { count: 1, expiresAt: now + analysisWindowMs });
    }
    if (analysisRequests.size > 1000) {
      for (const [ip, entry] of analysisRequests) {
        if (entry.expiresAt <= now) analysisRequests.delete(ip);
      }
    }
    return next();
  });

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok', engine: 'local-rules', apiRequired: false });
  });

  app.post('/api/analyze', async (request, response, next) => {
    try {
      const { name, input } = request.body ?? {};
      if (typeof name !== 'string' || !name.trim() || name.trim().length > 100) {
        throw new ChatFlowError('Project name is required and must be 100 characters or fewer.', 400);
      }
      if (typeof input !== 'string' || !input.trim() || input.trim().length > 40000) {
        throw new ChatFlowError('Process information is required and must be 40,000 characters or fewer.', 400);
      }
      const workflow = generateWorkflow({ name: name.trim(), input: input.trim() });
      response.json({ workflow });
    } catch (error) {
      next(error);
    }
  });

  app.get('/', (_request, response) => {
    response.sendFile(path.join(directory, 'index.html'));
  });

  app.get('/lib/workflow-parser.js', (_request, response) => {
    response.sendFile(path.join(directory, 'lib', 'workflow-parser.js'));
  });

  app.get('/lib/help-assistant.js', (_request, response) => {
    response.sendFile(path.join(directory, 'lib', 'help-assistant.js'));
  });

  app.use((_request, response) => {
    response.status(404).json({ error: 'Route not found.' });
  });

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return response.status(400).json({ error: 'Request body must be valid JSON.' });
    }
    if (error.type === 'entity.too.large') {
      return response.status(413).json({ error: 'Request body exceeds the 180 KB limit.' });
    }
    const status = error instanceof ChatFlowError ? error.status : 500;
    const message = error instanceof ChatFlowError ? error.message : 'Unexpected server error.';
    if (status >= 500) console.error(error);
    return response.status(status).json({ error: message });
  });

  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT) || 3000;
  const host = process.env.HOST || '127.0.0.1';
  createApp().listen(port, host, () => {
    console.log(`ChatFlow listening on http://${host}:${port}`);
  });
}

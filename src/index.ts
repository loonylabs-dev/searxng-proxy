// src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const apiKey = process.env.API_KEY;
const searxngUrl = process.env.SEARXNG_URL || 'http://searxng:8080';

// Auth middleware - validates Bearer token
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers['authorization'];
  if (!apiKey || auth !== `Bearer ${apiKey}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// Health check WITH authentication (for authenticated health monitoring)
app.get('/health', authenticate, (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'searxng-proxy' });
});

// Health check WITHOUT authentication (for Cloudflare Tunnel health checks)
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'searxng-proxy' });
});

// Search endpoint - proxy to SearXNG with authentication
app.get('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    const format = req.query.format || 'json';
    const engines = req.query.engines as string | undefined;

    if (!query) {
      return res.status(400).json({ error: 'Missing required parameter: q' });
    }

    // Build SearXNG URL
    const encodedQuery = encodeURIComponent(query);
    let targetUrl = `${searxngUrl}/search?q=${encodedQuery}&format=${format}`;

    // Add engines if specified
    if (engines) {
      targetUrl += `&${engines}`;
    }

    // Add any additional query parameters
    for (const [key, value] of Object.entries(req.query)) {
      if (key !== 'q' && key !== 'format' && key !== 'engines' && value) {
        targetUrl += `&${key}=${encodeURIComponent(value as string)}`;
      }
    }

    console.log(`Proxying search request: ${targetUrl}`);

    // Forward to SearXNG
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `SearXNG returned status ${response.status}`,
        details: response.statusText
      });
    }

    // Get response based on format
    if (format === 'json') {
      const data = await response.json();
      res.json(data);
    } else {
      const data = await response.text();
      res.send(data);
    }
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Proxy error:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`SearXNG Proxy listening on port ${port}`);
  console.log(`SearXNG instance: ${searxngUrl}`);
  console.log(`Authentication: ${apiKey ? 'ENABLED' : 'DISABLED (WARNING!)'}`);
});

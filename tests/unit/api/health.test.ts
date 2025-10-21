/**
 * Health Endpoint Unit Tests
 * Tests the health check endpoints functionality
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';

// Mock Express app with health endpoints
const createTestApp = () => {
  const app = express();

  // Mock auth middleware
  const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers['authorization'];
    const apiKey = 'test-api-key';

    if (!apiKey || auth !== `Bearer ${apiKey}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Health endpoint WITH authentication (same as in main app)
  app.get('/health', authenticate, (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'searxng-proxy' });
  });

  // Health endpoint WITHOUT authentication (for Cloudflare)
  app.get('/healthz', (req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'searxng-proxy' });
  });

  return app;
};

describe('Health Endpoints', () => {
  let app: express.Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('GET /health (authenticated)', () => {
    it('should return 200 with status ok when authenticated', async () => {
      const response = await request(app)
        .get('/health')
        .set('Authorization', 'Bearer test-api-key');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', service: 'searxng-proxy' });
    });

    it('should return 401 when no authorization header is provided', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 when wrong API key is provided', async () => {
      const response = await request(app)
        .get('/health')
        .set('Authorization', 'Bearer wrong-key');

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Unauthorized' });
    });

    it('should have correct response structure', async () => {
      const response = await request(app)
        .get('/health')
        .set('Authorization', 'Bearer test-api-key');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(typeof response.body.status).toBe('string');
      expect(typeof response.body.service).toBe('string');
    });

    it('should respond quickly (< 100ms)', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/health')
        .set('Authorization', 'Bearer test-api-key');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('GET /healthz (unauthenticated)', () => {
    it('should return 200 without authentication', async () => {
      const response = await request(app)
        .get('/healthz');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok', service: 'searxng-proxy' });
    });

    it('should work with or without authorization header', async () => {
      const responseWithAuth = await request(app)
        .get('/healthz')
        .set('Authorization', 'Bearer test-api-key');

      const responseWithoutAuth = await request(app)
        .get('/healthz');

      expect(responseWithAuth.status).toBe(200);
      expect(responseWithoutAuth.status).toBe(200);
      expect(responseWithAuth.body).toEqual(responseWithoutAuth.body);
    });

    it('should have correct response structure', async () => {
      const response = await request(app)
        .get('/healthz');

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('searxng-proxy');
    });

    it('should respond quickly (< 100ms)', async () => {
      const startTime = Date.now();

      await request(app)
        .get('/healthz');

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });
});

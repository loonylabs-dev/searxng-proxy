/**
 * SearXNG Integration Tests
 * Tests actual search calls against running SearXNG instance
 *
 * Prerequisites:
 * - Docker containers must be running (docker-compose up -d)
 * - SearXNG must be accessible via PROXY_URL
 * - API_KEY must be configured in .env
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import fetch from 'node-fetch';

const PROXY_URL = process.env.PROXY_URL || 'http://localhost:3000';
const API_KEY = process.env.API_KEY || 'test-api-key';

describe('SearXNG Integration Tests', () => {
  beforeAll(async () => {
    // Check if proxy is running
    try {
      const response = await fetch(`${PROXY_URL}/health`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      if (!response.ok) {
        throw new Error('Proxy health check failed');
      }
    } catch (error) {
      console.error('Failed to connect to proxy. Make sure docker-compose is running.');
      throw error;
    }
  });

  describe('Health Checks', () => {
    it('should return healthy status (authenticated)', async () => {
      const response = await fetch(`${PROXY_URL}/health`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
        },
      });

      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
      expect(data).toHaveProperty('service');
      expect(data.service).toBe('searxng-proxy');
    });

    it('should return healthy status (unauthenticated healthz)', async () => {
      const response = await fetch(`${PROXY_URL}/healthz`);

      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data).toHaveProperty('status');
      expect(data.status).toBe('ok');
    });
  });

  describe('Search Functionality', () => {
    it('should perform successful search with JSON format', async () => {
      const query = 'wikipedia';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=json`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json() as any;

      // Validate response structure
      expect(data).toHaveProperty('query');
      expect(data).toHaveProperty('number_of_results');
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);

      // Should have at least some results
      expect(data.results.length).toBeGreaterThan(0);

      // Validate first result structure
      if (data.results.length > 0) {
        const firstResult = data.results[0];
        expect(firstResult).toHaveProperty('title');
        expect(firstResult).toHaveProperty('url');
        expect(typeof firstResult.title).toBe('string');
        expect(typeof firstResult.url).toBe('string');
      }

      console.log(`Search results: ${data.number_of_results} results for "${query}"`);
    }, 30000);

    it('should perform search with HTML format', async () => {
      const query = 'test';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=html`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const html = await response.text();

      // Should return HTML content
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('html');
    }, 30000);

    it('should handle special characters in query', async () => {
      const query = 'TypeScript & JavaScript';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=json`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    }, 30000);

    it('should handle unicode characters in query', async () => {
      const query = 'Tokyo 東京';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=json`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    }, 30000);

    it('should return valid response structure for simple query', async () => {
      const query = 'python programming';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=json`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json() as any;

      // Validate response structure (results count may vary with external service)
      expect(data).toHaveProperty('query');
      expect(data).toHaveProperty('number_of_results');
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);

      console.log(`Found ${data.results.length} results for "${query}" (number_of_results: ${data.number_of_results})`);

      // Log warning if no results, but don't fail the test (external service may be rate limiting)
      if (data.results.length === 0) {
        console.warn(`Warning: No results returned for query "${query}" - this may indicate rate limiting or service issues`);
      }
    }, 30000);

    it('should handle additional query parameters', async () => {
      const query = 'nodejs';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=json&language=en`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const data = await response.json() as any;
      expect(data).toHaveProperty('results');
      expect(Array.isArray(data.results)).toBe(true);
    }, 30000);
  });

  describe('Error Handling', () => {
    it('should return 400 for missing query parameter', async () => {
      const response = await fetch(
        `${PROXY_URL}/search?format=json`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(400);

      const data = await response.json() as any;
      expect(data).toHaveProperty('error');
      expect(data.error).toContain('Missing required parameter');
    });

    it('should return 401 for missing API key', async () => {
      const response = await fetch(
        `${PROXY_URL}/search?q=test&format=json`
      );

      expect(response.status).toBe(401);

      const data = await response.json() as any;
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 401 for invalid API key', async () => {
      const response = await fetch(
        `${PROXY_URL}/search?q=test&format=json`,
        {
          headers: {
            'Authorization': 'Bearer invalid-key',
          },
        }
      );

      expect(response.status).toBe(401);

      const data = await response.json() as any;
      expect(data).toHaveProperty('error');
      expect(data.error).toBe('Unauthorized');
    });

    it('should handle empty query string', async () => {
      const response = await fetch(
        `${PROXY_URL}/search?q=&format=json`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      // Should either return 400 or empty results
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('Format Parameter', () => {
    it('should default to JSON when format not specified', async () => {
      const query = 'test';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(200);

      // Should be able to parse as JSON
      const data = await response.json() as any;
      expect(data).toHaveProperty('results');
    }, 30000);

    it('should accept JSON format explicitly', async () => {
      const query = 'test';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=json`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('json');
    }, 30000);

    it('should accept HTML format explicitly', async () => {
      const query = 'test';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=html`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      expect(response.status).toBe(200);

      const html = await response.text();
      expect(html).toContain('html');
    }, 30000);
  });

  describe('Response Validation', () => {
    it('should return valid JSON structure', async () => {
      const query = 'nodejs';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=json`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      const data = await response.json() as any;

      // Required fields
      expect(data).toHaveProperty('query');
      expect(data).toHaveProperty('number_of_results');
      expect(data).toHaveProperty('results');

      // Types
      expect(typeof data.query).toBe('string');
      expect(typeof data.number_of_results).toBe('number');
      expect(Array.isArray(data.results)).toBe(true);
    }, 30000);

    it('should return results with correct structure', async () => {
      const query = 'github';
      const response = await fetch(
        `${PROXY_URL}/search?q=${encodeURIComponent(query)}&format=json`,
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
          },
        }
      );

      const data = await response.json() as any;

      expect(data.results.length).toBeGreaterThan(0);

      // Check first result has required fields
      const firstResult = data.results[0];
      expect(firstResult).toHaveProperty('title');
      expect(firstResult).toHaveProperty('url');

      // Validate types
      expect(typeof firstResult.title).toBe('string');
      expect(typeof firstResult.url).toBe('string');
    }, 30000);
  });
});

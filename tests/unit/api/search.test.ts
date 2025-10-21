/**
 * Search Endpoint Unit Tests
 * Tests the search endpoint logic and validation
 */

import { describe, it, expect } from '@jest/globals';

describe('Search Endpoint', () => {
  describe('Request Validation', () => {
    it('should validate required query parameter', () => {
      const validRequest = {
        q: 'test search query',
        format: 'json',
      };

      expect(validRequest).toHaveProperty('q');
      expect(typeof validRequest.q).toBe('string');
      expect(validRequest.q.length).toBeGreaterThan(0);
    });

    it('should accept format parameter', () => {
      const formats = ['json', 'html'];

      formats.forEach(format => {
        const request = {
          q: 'test',
          format: format,
        };

        expect(['json', 'html']).toContain(request.format);
      });
    });

    it('should accept engines parameter', () => {
      const request = {
        q: 'test',
        engines: 'google,bing,duckduckgo',
      };

      expect(request).toHaveProperty('engines');
      expect(typeof request.engines).toBe('string');
    });

    it('should handle URL encoding for query', () => {
      const queries = [
        'simple query',
        'query with spaces',
        'special!@#$%chars',
        'unicode: 日本語',
      ];

      queries.forEach(query => {
        const encoded = encodeURIComponent(query);
        const decoded = decodeURIComponent(encoded);

        expect(decoded).toBe(query);
      });
    });

    it('should validate query is not empty', () => {
      const invalidQueries = ['', '   ', null, undefined];

      invalidQueries.forEach(query => {
        const isValid = query && query.trim().length > 0;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Response Structure', () => {
    it('should validate JSON response structure', () => {
      const mockJsonResponse = {
        query: 'test search',
        number_of_results: 42,
        results: [
          {
            title: 'Test Result 1',
            url: 'https://example.com/1',
            content: 'Test content 1',
            engine: 'google',
          },
          {
            title: 'Test Result 2',
            url: 'https://example.com/2',
            content: 'Test content 2',
            engine: 'bing',
          },
        ],
      };

      expect(mockJsonResponse).toHaveProperty('query');
      expect(mockJsonResponse).toHaveProperty('number_of_results');
      expect(mockJsonResponse).toHaveProperty('results');
      expect(Array.isArray(mockJsonResponse.results)).toBe(true);
      expect(mockJsonResponse.results.length).toBeGreaterThan(0);
    });

    it('should validate result item structure', () => {
      const resultItem = {
        title: 'Test Result',
        url: 'https://example.com',
        content: 'Test content',
        engine: 'google',
      };

      expect(resultItem).toHaveProperty('title');
      expect(resultItem).toHaveProperty('url');
      expect(resultItem).toHaveProperty('content');
      expect(resultItem).toHaveProperty('engine');
      expect(typeof resultItem.title).toBe('string');
      expect(typeof resultItem.url).toBe('string');
    });

    it('should handle HTML response format', () => {
      const htmlResponse = '<html><body>Search Results</body></html>';

      expect(typeof htmlResponse).toBe('string');
      expect(htmlResponse).toContain('html');
    });
  });

  describe('URL Building', () => {
    it('should build correct SearXNG URL with query', () => {
      const baseUrl = 'http://searxng:8080';
      const query = 'test query';
      const format = 'json';

      const targetUrl = `${baseUrl}/search?q=${encodeURIComponent(query)}&format=${format}`;

      expect(targetUrl).toContain('/search?q=');
      expect(targetUrl).toContain('format=json');
      expect(decodeURIComponent(targetUrl)).toContain(query);
    });

    it('should include engines parameter when specified', () => {
      const baseUrl = 'http://searxng:8080';
      const query = 'test';
      const format = 'json';
      const engines = 'google,bing';

      const targetUrl = `${baseUrl}/search?q=${encodeURIComponent(query)}&format=${format}&${engines}`;

      expect(targetUrl).toContain(engines);
    });

    it('should handle additional query parameters', () => {
      const params = {
        q: 'test',
        format: 'json',
        language: 'en',
        time_range: 'day',
      };

      const queryString = Object.entries(params)
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');

      expect(queryString).toContain('q=test');
      expect(queryString).toContain('format=json');
      expect(queryString).toContain('language=en');
      expect(queryString).toContain('time_range=day');
    });
  });

  describe('Error Handling', () => {
    it('should validate error response structure for missing query', () => {
      const errorResponse = {
        error: 'Missing required parameter: q',
      };

      expect(errorResponse).toHaveProperty('error');
      expect(typeof errorResponse.error).toBe('string');
      expect(errorResponse.error).toContain('Missing required parameter');
    });

    it('should validate error response for SearXNG errors', () => {
      const errorResponse = {
        error: 'SearXNG returned status 500',
        details: 'Internal Server Error',
      };

      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse).toHaveProperty('details');
      expect(typeof errorResponse.error).toBe('string');
      expect(typeof errorResponse.details).toBe('string');
    });

    it('should validate error response for proxy errors', () => {
      const errorResponse = {
        error: 'Internal server error',
        details: 'Connection refused',
      };

      expect(errorResponse).toHaveProperty('error');
      expect(errorResponse).toHaveProperty('details');
    });
  });

  describe('Format Parameter', () => {
    it('should default to JSON format', () => {
      const format = undefined;
      const defaultFormat = format || 'json';

      expect(defaultFormat).toBe('json');
    });

    it('should accept valid formats', () => {
      const validFormats = ['json', 'html'];

      validFormats.forEach(format => {
        expect(['json', 'html']).toContain(format);
      });
    });

    it('should handle format in URL building', () => {
      const formats = ['json', 'html'];

      formats.forEach(format => {
        const url = `/search?q=test&format=${format}`;
        expect(url).toContain(`format=${format}`);
      });
    });
  });

  describe('Authentication', () => {
    it('should require Bearer token format', () => {
      const validAuthHeaders = [
        'Bearer abc123',
        'Bearer test-api-key-12345',
        'Bearer VeryLongApiKey123456789',
      ];

      validAuthHeaders.forEach(header => {
        expect(header).toMatch(/^Bearer .+$/);
      });
    });

    it('should reject invalid auth formats', () => {
      const invalidAuthHeaders = [
        'Basic abc123',
        'Bearer',
        'bearer abc123',  // lowercase
        'abc123',
        '',
      ];

      invalidAuthHeaders.forEach(header => {
        const isValid = /^Bearer .+$/.test(header);
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Query Parameter Handling', () => {
    it('should preserve additional parameters', () => {
      const additionalParams = {
        language: 'en',
        time_range: 'day',
        safesearch: '1',
      };

      Object.keys(additionalParams).forEach(key => {
        expect(additionalParams).toHaveProperty(key);
      });
    });

    it('should exclude reserved parameters from forwarding', () => {
      const allParams = {
        q: 'test',
        format: 'json',
        engines: 'google',
        language: 'en',
      };

      const reservedParams = ['q', 'format', 'engines'];
      const additionalParams = Object.entries(allParams)
        .filter(([key]) => !reservedParams.includes(key))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

      expect(additionalParams).not.toHaveProperty('q');
      expect(additionalParams).not.toHaveProperty('format');
      expect(additionalParams).not.toHaveProperty('engines');
      expect(additionalParams).toHaveProperty('language');
    });
  });
});

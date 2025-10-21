# SearXNG Proxy - Test Suite

Complete testing documentation for the SearXNG Proxy API server.

## 📋 Quick Reference

| Test Command | Category | Docker Required | Description |
|-------------|----------|----------------|-------------|
| `npm run test:unit` | Unit | ❌ No | Jest unit tests (API endpoints) |
| `npm run test:unit:watch` | Unit | ❌ No | Jest watch mode for development |
| `npm run test:unit:coverage` | Unit | ❌ No | Jest with coverage report |
| `npm run test:integration` | Integration | ✅ Yes | Integration tests (real search calls) |
| `npm run test:all` | Suite | ⚠️ Mixed | All automated tests |
| `npm run test:ci` | CI/CD | ⚠️ Mixed | CI-optimized all tests with coverage |

---

## 🚀 Quick Start

### Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **For integration tests** (marked with ✅ above):
   ```bash
   # Start Docker containers
   docker-compose up -d

   # Wait for services to be healthy (~5-10 seconds)
   docker ps  # Check all services are "Up"
   ```

### Run All Tests

```bash
# Run unit tests only (no Docker required)
npm run test:unit

# Run all tests including integration (Docker required)
npm test
```

---

## 📁 Test Structure

```
/tests
├── /unit              # Jest unit tests (TypeScript)
│   └── /api           # API endpoint unit tests
│       ├── health.test.ts      # Health endpoint tests
│       └── search.test.ts      # Search endpoint logic tests
├── /integration       # Integration tests (TypeScript)
│   └── searxng-integration.test.ts  # Real SearXNG search tests
└── README.md          # This file
```

---

## 📊 Test Categories

### 🧪 Unit Tests (`npm run test:unit`)

**Framework**: Jest + ts-jest
**Location**: `tests/unit/`
**Docker Required**: ❌ No
**Duration**: ~2 seconds

**What's tested**:

#### Health Endpoint Tests ([health.test.ts](unit/api/health.test.ts))

Tests the `/health` and `/healthz` endpoint functionality:

**GET /health (authenticated)** (5 tests):
- ✅ Returns 200 with `{"status": "ok", "service": "searxng-proxy"}` when authenticated
- ✅ Returns 401 when no authorization header provided
- ✅ Returns 401 when wrong API key provided
- ✅ Has correct response structure
- ✅ Responds quickly (< 100ms)

**GET /healthz (unauthenticated)** (4 tests):
- ✅ Returns 200 without authentication
- ✅ Works with or without authorization header
- ✅ Has correct response structure
- ✅ Responds quickly (< 100ms)

**Expected Results**:
```
Test Suites: 1 passed, 1 total
Tests:       9 passed, 9 total
```

#### Search Endpoint Tests ([search.test.ts](unit/api/search.test.ts))

Tests the `/search` endpoint logic and validation:

**Request Validation** (5 tests):
- ✅ Validates required query parameter
- ✅ Accepts format parameter (json/html)
- ✅ Accepts engines parameter
- ✅ Handles URL encoding for query
- ✅ Validates query is not empty

**Response Structure** (3 tests):
- ✅ Validates JSON response structure
- ✅ Validates result item structure
- ✅ Handles HTML response format

**URL Building** (3 tests):
- ✅ Builds correct SearXNG URL with query
- ✅ Includes engines parameter when specified
- ✅ Handles additional query parameters

**Error Handling** (3 tests):
- ✅ Validates error response for missing query
- ✅ Validates error response for SearXNG errors
- ✅ Validates error response for proxy errors

**Format Parameter** (3 tests):
- ✅ Defaults to JSON format
- ✅ Accepts valid formats
- ✅ Handles format in URL building

**Authentication** (2 tests):
- ✅ Requires Bearer token format
- ✅ Rejects invalid auth formats

**Query Parameter Handling** (2 tests):
- ✅ Preserves additional parameters
- ✅ Excludes reserved parameters from forwarding

**Expected Results**:
```
Test Suites: 1 passed, 1 total
Tests:       21 passed, 21 total
```

**Run Commands**:
```bash
npm run test:unit              # Run all unit tests
npm run test:unit:watch        # Watch mode for development
npm run test:unit:coverage     # With coverage report
```

---

### 🔗 Integration Tests (`npm run test:integration`)

**Location**: `tests/integration/`
**Docker Required**: ✅ Yes (SearXNG containers must be running)
**Duration**: ~30-60 seconds

#### SearXNG Integration Test ([searxng-integration.test.ts](integration/searxng-integration.test.ts))

**What's tested**:

**Health Checks** (2 tests):
1. ✅ Returns healthy status (authenticated `/health`)
2. ✅ Returns healthy status (unauthenticated `/healthz`)

**Search Functionality** (6 tests):
3. ✅ Performs successful search with JSON format
4. ✅ Performs search with HTML format
5. ✅ Handles special characters in query
6. ✅ Handles unicode characters in query
7. ✅ Returns valid response structure for simple query
8. ✅ Handles additional query parameters

**Error Handling** (4 tests):
9. ✅ Returns 400 for missing query parameter
10. ✅ Returns 401 for missing API key
11. ✅ Returns 401 for invalid API key
12. ✅ Handles empty query string

**Format Parameter** (3 tests):
13. ✅ Defaults to JSON when format not specified
14. ✅ Accepts JSON format explicitly
15. ✅ Accepts HTML format explicitly

**Response Validation** (2 tests):
16. ✅ Returns valid JSON structure
17. ✅ Returns results with correct structure

**Prerequisites**:
```bash
# 1. Start Docker containers
docker-compose up -d

# 2. Configure PROXY_URL in .env (see Configuration section below)

# 3. Verify proxy is accessible
curl -H "Authorization: Bearer your-api-key" ${PROXY_URL}/health
```

**Expected Results**:
```
Test Suites: 1 passed, 1 total
Tests:       17 passed, 17 total
Duration:    ~30-60 seconds

✅ Health checks working
✅ Search returns results
✅ Format parameter working (JSON/HTML)
✅ Error handling working
✅ Authentication working
```

**Run Commands**:
```bash
npm run test:integration     # Run only integration tests
```

---

## ⚙️ Configuration

### Environment Variables

The tests use the following environment variables (with defaults):

```bash
# Proxy URL - REQUIRED for integration tests
# See .env.example for configuration options
PROXY_URL=https://search.yourdomain.com

# API Key for authentication (from your .env file)
API_KEY=your-api-key-here
```

### Important: Proxy URL Configuration

**The proxy port (3000) is NOT exposed to the host by default for security reasons.**

You have two options for running integration tests:

#### Option 1: Cloudflare Tunnel (RECOMMENDED)

Use your Cloudflare Tunnel URL configured in `cloudflare/config.yml`:

```bash
# .env
PROXY_URL=https://search.yourdomain.com
API_KEY=your-api-key-here
```

**Advantages:**
- ✅ No ports exposed to host (more secure)
- ✅ Tests against production-like environment
- ✅ Cloudflare security features active
- ✅ Works exactly like production

#### Option 2: Localhost with Port Mapping

Add port mapping to `docker-compose.yml`:

```yaml
proxy:
  ports:
    - "3000:3000"  # Add this line
  build: .
  # ... rest of config
```

Then configure:

```bash
# .env
PROXY_URL=http://localhost:3000
API_KEY=your-api-key-here
```

**Disadvantages:**
- ⚠️ Exposes port 3000 on your host machine
- ⚠️ Additional attack surface
- ⚠️ Different from production setup

---

## ⚠️ Common Issues and Solutions

### "Cannot connect to proxy" / "ECONNREFUSED localhost:3000"

**Cause**: Proxy port not exposed to host (this is intentional for security)

**Solutions:**

1. **Use Cloudflare Tunnel (RECOMMENDED)**:
   ```bash
   # In .env
   PROXY_URL=https://search.yourdomain.com
   ```

2. **Temporarily add port mapping for testing**:
   ```yaml
   # In docker-compose.yml
   proxy:
     ports:
       - "3000:3000"
   ```
   Then restart: `docker-compose down && docker-compose up -d`

3. **Check if proxy container is running**:
   ```bash
   docker ps | grep proxy
   # Should show: searxng-proxy-proxy-1
   ```

### "ECONNREFUSED" or "connect ETIMEDOUT" errors

**Cause**: Either:
1. Containers not running, OR
2. Proxy port not accessible (not mapped to host)

**Solution**:
```bash
# 1. Check container status
docker ps

# 2. Start containers if needed
docker-compose up -d

# 3. Configure PROXY_URL in .env
#    Use Cloudflare Tunnel URL (recommended)
#    OR add port mapping to docker-compose.yml

# 4. Check logs
docker-compose logs -f proxy
```

### Integration tests timeout

**Cause**: SearXNG search taking longer than expected

**Solution**:
- Test timeout is set to 30 seconds (configurable in test files)
- First search may be slower (engine initialization)
- Subsequent searches should be faster

### SearXNG returns no results

**Cause**: Search engines may be temporarily unavailable

**Solution**:
- This is normal - SearXNG aggregates from multiple engines
- Some searches may return fewer results depending on engine availability
- Check SearXNG logs: `docker-compose logs searxng`

---

## 🔬 Development Workflow

### Before Committing
```bash
# Format and lint
npm run lint

# Run unit tests (fast)
npm run test:unit

# Run all tests
npm test
```

### During Development
```bash
# Watch mode for quick feedback
npm run test:unit:watch

# Run specific test file
npx jest tests/unit/api/health.test.ts
```

### Before Releasing
```bash
# Full test suite with coverage
npm run test:unit:coverage
npm run test:integration
```

---

## 📈 Adding New Tests

### 1. Create Test File

**For Unit Tests**:
```bash
# Create in tests/unit/api/
touch tests/unit/api/my-feature.test.ts
```

**For Integration Tests**:
```bash
# Create in tests/integration/
touch tests/integration/my-feature.test.ts
```

### 2. Write Test

```typescript
// tests/unit/api/my-feature.test.ts
import { describe, it, expect } from '@jest/globals';

describe('My Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### 3. Run Test

```bash
# Run specific test
npx jest tests/unit/api/my-feature.test.ts

# Run all unit tests
npm run test:unit
```

---

## 📈 Continuous Integration

For CI/CD pipelines, use:

```bash
npm run test:ci  # Jest with CI optimization
```

This runs tests with:
- `--runInBand` (sequential execution)
- `--ci` (optimized for CI environments)
- `--coverage` (generates coverage reports)

**GitHub Actions Example**:
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit:coverage

      - name: Start SearXNG services
        run: docker-compose up -d

      - name: Wait for services
        run: sleep 10

      - name: Run integration tests
        run: npm run test:integration

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 🎯 Test Coverage Goals

- **Unit Tests**: 80%+ code coverage
- **Integration Tests**: 100% pass rate (all endpoints working)
- **Response Time**: Health < 100ms, Search < 30s

---

## 📚 Test Examples

### Unit Test Example

```typescript
// tests/unit/api/health.test.ts
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';

describe('Health Endpoint', () => {
  it('should return 200 with status ok', async () => {
    const response = await request(app)
      .get('/health')
      .set('Authorization', 'Bearer test-api-key');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'searxng-proxy' });
  });
});
```

### Integration Test Example

```typescript
// tests/integration/searxng-integration.test.ts
import { describe, it, expect } from '@jest/globals';
import fetch from 'node-fetch';

describe('Search', () => {
  it('should perform successful search', async () => {
    const response = await fetch('http://localhost:3000/search?q=test&format=json', {
      headers: {
        'Authorization': 'Bearer test-api-key',
      },
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.results.length).toBeGreaterThan(0);
  });
});
```

---

## 📞 Support

If tests consistently fail:

1. ✅ **Check prerequisites** (Docker running, services healthy)
2. ✅ **Review test output** for specific error messages
3. ✅ **Check service logs** with `docker-compose logs -f`
4. ✅ **Verify environment** variables in `.env`
5. ✅ **Consult troubleshooting** section above
6. ✅ **Open issue** with test output and environment details

---

## 🎓 Useful Commands

```bash
# Test commands
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm test                       # All tests
npm run test:unit:watch        # Watch mode
npm run test:unit:coverage     # With coverage

# Docker commands
docker-compose up -d           # Start services
docker-compose down            # Stop services
docker-compose logs -f         # View logs
docker ps                      # Check status

# SearXNG commands
docker-compose logs searxng    # SearXNG logs
docker-compose logs proxy      # Proxy logs
docker-compose restart searxng # Restart SearXNG

# Development
npm run dev                    # Start in dev mode
npm run build                  # Build TypeScript
npm run lint                   # Run linter
```

---

<div align="center">

**Happy Testing! 🧪**

Made with ❤️ for the SearXNG Proxy

**Secure Meta-Search API ✅**

</div>

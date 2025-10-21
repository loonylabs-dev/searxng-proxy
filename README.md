# SearXNG Proxy

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](#docker-deployment-recommended)
[![API](https://img.shields.io/badge/API-Authenticated-10A37F?style=for-the-badge&logo=auth0&logoColor=white)](#authentication)
[![SearXNG](https://img.shields.io/badge/SearXNG-Meta--Search-3050FF?style=for-the-badge&logo=duckduckgo&logoColor=white)](#api-usage)
[![Tests](https://img.shields.io/badge/Tests-Passing-4CAF50?style=for-the-badge&logo=jest&logoColor=white)](#running-tests)
[![Health](https://img.shields.io/badge/Health-Check-4CAF50?style=for-the-badge&logo=heart&logoColor=white)](#endpoints)

A simple proxy server for SearXNG meta-search engine with authentication, designed to provide secure access to privacy-respecting search.

<details>
<summary>📋 Table of Contents</summary>

- [✨ Features](#features)
- [🚀 Quick Start](#quick-start)
- [🔌 API Usage](#api-usage)
- [☁️ Cloudflare Tunnel Setup](#cloudflare-tunnel-setup)
- [⚙️ Configuration](#configuration)
- [🧪 Running Tests](#running-tests)
- [📂 Project Structure](#project-structure)
- [🔒 Security Notes](#security-notes)
- [🔧 Troubleshooting](#troubleshooting)
- [📄 License](#license)
- [🤝 Contributing](#contributing)

</details>

## ✨ Features

- **API Key Authentication**: Secure access control via Bearer tokens
- **Cloudflare Tunnel Integration**: Built-in support for secure external access
- **Docker Support**: Complete containerized setup with Docker Compose
- **Health Check Endpoints**: Monitor proxy status (authenticated + unauthenticated)
- **Multi-Engine Search**: Aggregates results from Google, Bing, DuckDuckGo, Qwant, Yahoo, Brave
- **Flexible Configuration**: Environment-based configuration
- **Comprehensive Tests**: Unit and integration tests with Jest
- **Unlimited Searches**: No rate limits (self-hosted)
- **JSON & HTML Output**: Support for both JSON API and HTML responses

## 🚀 Quick Start

<details>
<summary>📋 Prerequisites</summary>

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Cloudflare account (optional, for tunnel)

</details>

### 🐳 Docker Deployment (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/loonylabs-dev/searxng-proxy.git
   cd searxng-proxy
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your API key
   ```

3. **Generate API Key:**
   ```bash
   # Generate a secure API key
   openssl rand -base64 32

   # Add to .env:
   # API_KEY=your_generated_key_here
   ```

4. **Start services:**
   ```bash
   docker-compose up -d
   ```

5. **Verify:**
   ```bash
   # Check services
   docker-compose ps

   # Test local endpoint (requires port mapping, see Configuration)
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     "http://localhost:3000/search?q=test&format=json"
   ```

<details>
<summary>💻 Local Development</summary>

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (use SEARXNG_URL=http://localhost:8080)
   ```

3. **Start SearXNG (Docker):**
   ```bash
   docker run -d -p 8080:8080 -v ./searxng:/etc/searxng searxng/searxng:latest
   ```

4. **Start the proxy:**
   ```bash
   npm run dev          # Development mode
   # or
   npm run build && npm start  # Production mode
   ```

</details>

## 🔌 API Usage

The proxy provides secure access to SearXNG with API key authentication.

### 🔐 Authentication

All requests (except `/healthz`) require a Bearer token:

```bash
Authorization: Bearer YOUR_API_KEY
```

### 📍 Endpoints

#### `GET /search`

Search with SearXNG.

**Parameters:**
- `q` (required) - Search query
- `format` (optional) - Response format: `json` (default) or `html`
- `engines` (optional) - Specific engines to use
- Additional SearXNG parameters (language, time_range, etc.)

**Example:**

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://search.loonylabs.dev/search?q=typescript+best+practices&format=json"
```

**Response (JSON):**
```json
{
  "query": "typescript best practices",
  "number_of_results": 42,
  "results": [
    {
      "title": "TypeScript Best Practices",
      "url": "https://example.com/typescript-best-practices",
      "content": "Learn the best practices for TypeScript...",
      "engine": "google"
    }
  ]
}
```

#### `GET /health`

Health check (requires authentication).

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://search.loonylabs.dev/health"
```

**Response:**
```json
{
  "status": "ok",
  "service": "searxng-proxy"
}
```

#### `GET /healthz`

Health check (no authentication required - for Cloudflare monitoring).

```bash
curl "https://search.loonylabs.dev/healthz"
```

**Response:**
```json
{
  "status": "ok",
  "service": "searxng-proxy"
}
```

### 🎯 Integration Example

```typescript
// searxng-client.ts
import fetch from 'node-fetch';

const SEARXNG_URL = 'https://search.loonylabs.dev';
const SEARXNG_API_KEY = process.env.SEARXNG_API_KEY;

export async function search(query: string, maxResults = 10) {
  const response = await fetch(
    `${SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json`,
    {
      headers: {
        'Authorization': `Bearer ${SEARXNG_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results.slice(0, maxResults);
}
```

**Usage:**

```typescript
const results = await search('machine learning tutorials', 10);
console.log(results);
```

## ☁️ Cloudflare Tunnel Setup

For secure external access:

1. **Set up Cloudflare Tunnel:**
   ```bash
   # Install cloudflared and create a tunnel
   cloudflared tunnel create searxng-proxy
   ```

2. **Configure tunnel:**
   ```bash
   cp cloudflare/config.example.yml cloudflare/config.yml
   # Edit config.yml with your tunnel ID and domain
   ```

3. **Add tunnel credentials:**
   Place your tunnel credentials JSON file in `cloudflare/`

4. **Configure DNS:**
   ```bash
   cloudflared tunnel route dns searxng-proxy search.loonylabs.dev
   ```

5. **The tunnel will automatically start with Docker Compose**

See [cloudflare/README.md](cloudflare/README.md) for detailed setup instructions.

## ⚙️ Configuration

<details>
<summary>🔧 Environment Variables</summary>

Create `.env` from `.env.example`:

| Variable | Default | Description |
|----------|---------|-------------|
| `API_KEY` | Required | Authentication key for API access |
| `SEARXNG_URL` | `http://searxng:8080` (Docker)<br>`http://localhost:8080` (local) | SearXNG server URL |
| `PORT` | `3000` | Proxy server port (local dev only) |
| `PROXY_URL` | - | Proxy URL for integration tests (optional) |

**Example `.env`:**
```bash
API_KEY=your_secret_api_key_here
SEARXNG_URL=http://searxng:8080
SEARXNG_SECRET_KEY=change-this-secret-key-in-production

# For integration tests (optional)
PROXY_URL=https://search.loonylabs.dev
```

</details>

<details>
<summary>📋 SearXNG Settings</summary>

Edit `searxng/settings.yml` to customize:
- Search engines
- UI theme
- Rate limiting
- Result formatting
- Language preferences

See [SearXNG Documentation](https://docs.searxng.org) for all options.

</details>

<details>
<summary>🐳 Docker Configuration</summary>

The Docker setup includes:
- **SearXNG container**: Meta-search engine (internal only)
- **Proxy container**: Express server with API key authentication
- **Cloudflared container**: Cloudflare Tunnel client (optional)

**Architecture:**

```
Internet (HTTPS)
    ↓
Cloudflare Tunnel
    ↓
Proxy (Express + API Key Auth)
    ↓
SearXNG (Meta-Search Engine)
```

**Port Exposure:**
By default, no ports are exposed to the host for security. Access is via Cloudflare Tunnel.

To expose port 3000 for local testing, add to `docker-compose.yml`:
```yaml
proxy:
  ports:
    - "3000:3000"  # Add this line
```

</details>

## 🧪 Running Tests

The project includes comprehensive unit and integration tests.

### Quick Test Commands

```bash
# Run all tests
npm test

# Run only unit tests (no Docker required)
npm run test:unit

# Run only integration tests (Docker required)
npm run test:integration

# Run tests in watch mode
npm run test:unit:watch

# Run tests with coverage
npm run test:unit:coverage
```

### Test Structure

```
/tests
├── /unit              # Unit tests (no Docker required)
│   └── /api           # API endpoint tests
│       ├── health.test.ts      # Health endpoint tests (9 tests)
│       └── search.test.ts      # Search logic tests (21 tests)
├── /integration       # Integration tests (Docker required)
│   └── searxng-integration.test.ts  # End-to-end search tests (17 tests)
└── README.md          # Detailed testing documentation
```

### Running Integration Tests

Integration tests require running Docker containers:

```bash
# 1. Start services
docker-compose up -d

# 2. Configure PROXY_URL in .env
# Option A: Use Cloudflare Tunnel URL (recommended)
PROXY_URL=https://search.loonylabs.dev

# Option B: Use localhost (requires port mapping)
# Add "ports: - 3000:3000" to proxy service in docker-compose.yml
PROXY_URL=http://localhost:3000

# 3. Run integration tests
npm run test:integration
```

**Test Coverage:**
- ✅ 47+ tests across unit and integration suites
- ✅ Health check endpoints (`/health`, `/healthz`)
- ✅ Search functionality (JSON/HTML formats)
- ✅ Authentication & authorization
- ✅ Error handling (missing params, invalid API keys)
- ✅ Response validation
- ✅ Special characters & unicode support

For detailed testing documentation, see [tests/README.md](tests/README.md).

## 📂 Project Structure

```
searxng-proxy/
├── src/
│   └── index.ts              # Express proxy server with API key auth
├── tests/                    # Test suite
│   ├── unit/                 # Unit tests
│   │   └── api/              # API endpoint unit tests
│   │       ├── health.test.ts
│   │       └── search.test.ts
│   ├── integration/          # Integration tests
│   │   └── searxng-integration.test.ts
│   └── README.md             # Testing documentation
├── searxng/
│   └── settings.yml          # SearXNG configuration
├── cloudflare/
│   ├── config.example.yml    # Cloudflare tunnel template
│   └── README.md             # Cloudflare setup guide
├── docker-compose.yml        # Complete stack (searxng + proxy + cloudflared)
├── Dockerfile                # Proxy service image
├── .env.example              # Environment variables template
├── jest.config.js            # Jest test configuration
├── jest.setup.js             # Jest setup file
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

## 🔒 Security Notes

- **API Key**: Use a strong, randomly generated key (32+ characters)
- **HTTPS Only**: Cloudflare Tunnel provides automatic HTTPS
- **Credentials**: Never commit `.env`, `config.yml`, or `*.json` files
- **Rate Limiting**: Consider adding rate limiting in production
- **Monitoring**: Monitor usage via Cloudflare Analytics
- **Port Exposure**: By default, no ports are exposed to host (secure)

## 🔧 Troubleshooting

### Services won't start

```bash
# Check Docker
docker --version
docker-compose --version

# Check logs
docker-compose logs

# Check specific service
docker-compose logs proxy
docker-compose logs searxng
```

### 401 Unauthorized

- Verify API key in `.env` matches your request header
- Check: `Authorization: Bearer YOUR_API_KEY` (space after "Bearer")
- API key is case-sensitive
- Ensure no extra spaces or newlines in API key

### Cloudflare Tunnel not connecting

```bash
# Check cloudflared logs
docker-compose logs cloudflared

# Verify tunnel configuration
cat cloudflare/config.yml

# Test tunnel status (on Cloudflare dashboard)
# https://one.dash.cloudflare.com/
```

### SearXNG not returning results

```bash
# Check SearXNG logs
docker-compose logs searxng

# Test SearXNG directly (inside Docker network)
docker-compose exec proxy wget -O- "http://searxng:8080/search?q=test&format=json"

# Check if SearXNG is running
docker-compose ps searxng
```

### Integration tests fail with ECONNREFUSED

**Cause**: Proxy port not exposed to host (intentional for security)

**Solutions:**

1. **Use Cloudflare Tunnel (recommended)**:
   ```bash
   # In .env
   PROXY_URL=https://search.yourdomain.com
   ```

2. **Temporarily expose port for testing**:
   ```yaml
   # In docker-compose.yml
   proxy:
     ports:
       - "3000:3000"
   ```
   Then restart: `docker-compose down && docker-compose up -d`

### NPM package installation fails

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Run tests: `npm test`
6. Submit a pull request

For questions or support, please open an issue on GitHub.

---

## 📚 Similar Projects

This project follows the same pattern as:
- [ollama-proxy](https://github.com/loonylabs-dev/ollama-proxy) - Ollama API with authentication and Cloudflare Tunnel

---

## 🔗 Links

- **SearXNG**: https://github.com/searxng/searxng
- **SearXNG Docs**: https://docs.searxng.org
- **Cloudflare Tunnels**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps

---

<div align="center">

**Made with ❤️ by loonylabs-dev**

**Privacy-Respecting Meta-Search API ✅**

</div>

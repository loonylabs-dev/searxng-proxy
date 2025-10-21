# SearXNG Proxy

**Self-hosted meta-search engine with API key authentication and Cloudflare Tunnel exposition**

This project provides a production-ready SearXNG deployment with:
- 🔒 **API Key Authentication** - Secure access control via Bearer tokens
- 🌐 **Cloudflare Tunnel** - Expose securely to the internet without port forwarding
- 🔍 **Multi-Engine Search** - Aggregates results from Google, Bing, DuckDuckGo, Qwant, Yahoo, Brave
- 🐳 **Docker Compose** - Complete stack with SearXNG + Proxy + Cloudflared
- ♾️ **Unlimited Searches** - No rate limits (self-hosted)

---

## Architecture

```
Internet (HTTPS)
    ↓
Cloudflare Tunnel
    ↓
Proxy (Express + API Key Auth)
    ↓
SearXNG (Meta-Search Engine)
```

**Services:**
1. **SearXNG** - Meta-search engine (internal only)
2. **Proxy** - Express server with API key authentication
3. **Cloudflared** - Cloudflare Tunnel client

---

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/loonylabs-dev/searxng-proxy.git
cd searxng-proxy

# Copy environment file
cp .env.example .env

# Edit .env and set your API key
nano .env
```

### 2. Generate API Key

```bash
# Generate a secure API key
openssl rand -base64 32

# Add to .env:
# API_KEY=your_generated_key_here
```

### 3. Configure Cloudflare Tunnel

See [cloudflare/README.md](cloudflare/README.md) for detailed setup instructions.

**Summary:**
```bash
# Login to Cloudflare
cloudflared login

# Create tunnel
cloudflared tunnel create searxng-proxy

# Copy credentials
cp ~/.cloudflared/YOUR-TUNNEL-ID.json ./cloudflare/

# Configure tunnel
cp cloudflare/config.example.yml cloudflare/config.yml
# Edit config.yml with your tunnel ID and domain

# Configure DNS
cloudflared tunnel route dns searxng-proxy search.loonylabs.dev
```

### 4. Start Services

```bash
docker-compose up -d
```

### 5. Verify

```bash
# Check services
docker-compose ps

# Check logs
docker-compose logs -f

# Test local endpoint
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "http://localhost:3000/search?q=test&format=json"

# Test public endpoint (after Cloudflare setup)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://search.loonylabs.dev/search?q=test&format=json"
```

---

## API Usage

### Authentication

All requests require a Bearer token:

```bash
Authorization: Bearer YOUR_API_KEY
```

### Endpoints

#### `GET /search`

Search with SearXNG.

**Parameters:**
- `q` (required) - Search query
- `format` (optional) - Response format: `json` (default) or `html`
- `engines` (optional) - Specific engines to use

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

---

## Configuration

### Environment Variables

Create `.env` from `.env.example`:

```bash
# Required: API key for authentication
API_KEY=your_secret_api_key_here

# SearXNG Configuration
SEARXNG_BASE_URL=http://localhost:8080/
SEARXNG_SECRET_KEY=change-this-secret-key-in-production
```

### SearXNG Settings

Edit `searxng/settings.yml` to customize:
- Search engines
- UI theme
- Rate limiting
- Result formatting
- Language preferences

See [SearXNG Documentation](https://docs.searxng.org) for all options.

---

## Development

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Start SearXNG (Docker)
docker run -d -p 8080:8080 -v ./searxng:/etc/searxng searxng/searxng:latest

# Start proxy (dev mode)
npm run dev
```

### Build TypeScript

```bash
npm run build
npm start
```

### Useful Commands

```bash
# Start services
npm run start:searxng
# or
docker-compose up -d

# Stop services
npm run stop:searxng
# or
docker-compose down

# View logs
npm run logs:searxng
# or
docker-compose logs -f

# Restart services
npm run restart:searxng
# or
docker-compose restart
```

---

## Project Structure

```
searxng-proxy/
├── src/
│   └── index.ts              # Express proxy server with API key auth
├── searxng/
│   └── settings.yml          # SearXNG configuration
├── cloudflare/
│   ├── config.example.yml    # Cloudflare tunnel template
│   └── README.md             # Cloudflare setup guide
├── docker-compose.yml        # Complete stack (searxng + proxy + cloudflared)
├── Dockerfile                # Proxy service image
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md                 # This file
```

---

## Integration Example

### Use in your application

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

---

## Security Notes

- **API Key**: Use a strong, randomly generated key (32+ characters)
- **HTTPS Only**: Cloudflare Tunnel provides automatic HTTPS
- **Credentials**: Never commit `.env`, `config.yml`, or `*.json` files
- **Rate Limiting**: Consider adding rate limiting in production
- **Monitoring**: Monitor usage via Cloudflare Analytics

---

## Troubleshooting

### Services won't start

```bash
# Check Docker
docker --version
docker-compose --version

# Check logs
docker-compose logs
```

### 401 Unauthorized

- Verify API key in `.env` matches your request header
- Check: `Authorization: Bearer YOUR_API_KEY` (space after "Bearer")

### Cloudflare Tunnel not connecting

```bash
# Check cloudflared logs
docker-compose logs cloudflared

# Verify tunnel configuration
cat cloudflare/config.yml

# Test tunnel status (on Cloudflare dashboard)
```

### SearXNG not returning results

```bash
# Check SearXNG logs
docker-compose logs searxng

# Test SearXNG directly (inside Docker network)
docker-compose exec proxy wget -O- "http://searxng:8080/search?q=test&format=json"
```

---

## Similar Projects

This project follows the same pattern as:
- [ollama-proxy](https://github.com/loonylabs-dev/ollama-proxy) - Ollama API with authentication and Cloudflare Tunnel

---

## License

MIT License - see [LICENSE](LICENSE) file

---

## Contributing

Issues and pull requests welcome!

---

## Links

- **SearXNG**: https://github.com/searxng/searxng
- **SearXNG Docs**: https://docs.searxng.org
- **Cloudflare Tunnels**: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps

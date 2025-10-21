# Cloudflare Tunnel Setup

## Prerequisites

1. Cloudflare account
2. Domain configured in Cloudflare
3. `cloudflared` CLI installed locally

## Setup Steps

### 1. Login to Cloudflare

```bash
cloudflared login
```

### 2. Create a new tunnel

```bash
cloudflared tunnel create searxng-proxy
```

This will:
- Create a tunnel with ID (e.g., `abc12345-1234-1234-1234-abc123456789`)
- Generate credentials file: `~/.cloudflared/abc12345-1234-1234-1234-abc123456789.json`

### 3. Copy credentials file

```bash
# Copy the credentials file to this directory
cp ~/.cloudflared/YOUR-TUNNEL-ID.json ./cloudflare/
```

### 4. Configure tunnel

```bash
# Copy example config
cp cloudflare/config.example.yml cloudflare/config.yml

# Edit config.yml
# - Replace `your-tunnel-id-here` with your actual tunnel ID
# - Replace `search.loonylabs.dev` with your domain
```

### 5. Configure DNS

Add a CNAME record in Cloudflare DNS:

```
Type: CNAME
Name: search (or your subdomain)
Target: YOUR-TUNNEL-ID.cfargotunnel.com
Proxy status: Proxied (orange cloud)
```

Or use CLI:

```bash
cloudflared tunnel route dns searxng-proxy search.loonylabs.dev
```

### 6. Start the tunnel

The tunnel will automatically start with `docker-compose up -d`

## Verify Setup

1. Check tunnel status:
   ```bash
   docker-compose logs cloudflared
   ```

2. Test the endpoint:
   ```bash
   curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://search.loonylabs.dev/search?q=test&format=json"
   ```

## Troubleshooting

### Tunnel not connecting

Check logs:
```bash
docker-compose logs cloudflared
```

### DNS not resolving

Wait 1-2 minutes for DNS propagation, then check:
```bash
dig search.loonylabs.dev
nslookup search.loonylabs.dev
```

### 401 Unauthorized

Make sure you're sending the correct API key:
```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
  "https://search.loonylabs.dev/health"
```

## Security Notes

- **NEVER commit** `config.yml` or `*.json` files to git
- Keep your API key secure
- The `.gitignore` is configured to exclude these files
- Only the example config is tracked in git

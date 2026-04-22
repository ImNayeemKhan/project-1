#!/usr/bin/env bash
# Issue Let's Encrypt certs for the given domain using the already-running nginx
# container as the webroot. Run this AFTER your DNS points to this server.
#
# Usage: ./infra/scripts/issue-cert.sh your-domain.com admin@your-domain.com
set -euo pipefail

DOMAIN=${1:-}
EMAIL=${2:-}
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: $0 <domain> <email>" >&2
  exit 1
fi

COMPOSE="docker compose -f $(dirname "$0")/../docker-compose.yml"

# Make sure nginx is up so the ACME HTTP-01 challenge can reach /.well-known/acme-challenge
$COMPOSE up -d nginx

$COMPOSE run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos --no-eff-email \
  --non-interactive

echo ">> Cert issued. Now edit infra/nginx/conf.d/default.conf:"
echo "   - replace 'server_name _;' with 'server_name $DOMAIN;'"
echo "   - uncomment the HTTPS block and the HTTP → HTTPS redirect line"
echo "   - then run: $COMPOSE exec nginx nginx -s reload"

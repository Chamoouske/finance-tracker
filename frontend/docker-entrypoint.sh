#!/bin/sh
set -e

# Default API URL fallback
API_URL="${API_URL:-http://localhost:8080}"

# Replace the __API_URL__ placeholder in index.html with the actual API URL
# This allows runtime configuration of the API endpoint
if [ -f /usr/share/nginx/html/index.html ]; then
    sed -i "s|__API_URL__|${API_URL}|g" /usr/share/nginx/html/index.html
fi

# Replace the __API_URL__ placeholder in nginx.conf as well (for CSP header)
if [ -f /etc/nginx/nginx.conf ]; then
    sed -i "s|__API_URL__|${API_URL}|g" /etc/nginx/nginx.conf
fi

# Start nginx
exec nginx -g 'daemon off;'

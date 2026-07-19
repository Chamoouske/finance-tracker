#!/bin/sh
set -e

# Optional API origin (for example, https://api.example.com).
# Keep empty for same-origin requests; service paths already include /api.
API_URL="${API_URL:-}"

# Replace the __API_URL__ placeholder in index.html with the actual API URL
# This allows runtime configuration of the API endpoint
if [ -f /usr/share/nginx/html/index.html ]; then
    sed -i "s|__API_URL__|${API_URL}|g" /usr/share/nginx/html/index.html
fi

# Start nginx
exec nginx -g 'daemon off;'

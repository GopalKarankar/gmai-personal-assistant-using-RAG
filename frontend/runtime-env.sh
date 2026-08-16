#!/bin/sh
set -eu

cat > /usr/share/nginx/html/runtime-config.js <<EOF
window.__APP_CONFIG__ = window.__APP_CONFIG__ || {};
window.__APP_CONFIG__.VITE_BACKEND_URL = "${VITE_BACKEND_URL:-}";
window.__APP_CONFIG__.VITE_GOOGLE_CLIENT_ID = "${VITE_GOOGLE_CLIENT_ID:-}";
EOF

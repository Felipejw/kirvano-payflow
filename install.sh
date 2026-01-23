#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo " INSTALADOR AUTOMÁTICO FRONT "
echo "=============================="
echo ""

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "❌ Execute como root (sudo ./install.sh)"
  exit 1
fi

read -r -p "Domínio (ex: meusite.com): " DOMAIN
read -r -p "Nome da pasta do projeto (ex: app): " APP_FOLDER
read -r -p "Caminho do arquivo ZIP (ex: /home/ubuntu/gatteflow.zip): " ZIP_PATH

DOMAIN="${DOMAIN// /}"
APP_FOLDER="${APP_FOLDER// /}"

if [[ -z "$DOMAIN" || -z "$APP_FOLDER" || -z "$ZIP_PATH" ]]; then
  echo "❌ Domínio, pasta e ZIP são obrigatórios"
  exit 1
fi

APP_PATH="/var/www/${APP_FOLDER}"

echo ""
echo "=============================="
echo " CONFIGURAÇÃO DO BACKEND (FIXO)"
echo "=============================="

# Backend central fixo (valores públicos para o frontend).
# Pode sobrescrever via variáveis de ambiente, mas o script não pergunta.
BACKEND_URL_DEFAULT="https://gfjsvuoqaheiaddvfrwb.supabase.co"
BACKEND_PUBLISHABLE_KEY_DEFAULT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmanN2dW9xYWhlaWFkZHZmcndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODYyNTIsImV4cCI6MjA4MDc2MjI1Mn0.20nFxYFWynuRr1jMH6AoqK5JmLT-7_ylwVHwg-rEm0w"

BACKEND_URL="${BACKEND_URL:-$BACKEND_URL_DEFAULT}"
BACKEND_PUBLISHABLE_KEY="${BACKEND_PUBLISHABLE_KEY:-$BACKEND_PUBLISHABLE_KEY_DEFAULT}"

echo ">>> Atualizando servidor..."
apt update -y
apt upgrade -y

echo ">>> Instalando dependências..."
apt install -y nginx curl unzip certbot python3-certbot-nginx rsync ca-certificates

echo ">>> Instalando Node.js (NVM + Node 18)..."
export NVM_DIR="${NVM_DIR:-/root/.nvm}"
if [[ ! -d "$NVM_DIR" ]]; then
  curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

# shellcheck disable=SC1090
source "$NVM_DIR/nvm.sh"
nvm install 18
nvm use 18

echo ">>> Verificando ZIP..."
if [[ ! -f "$ZIP_PATH" ]]; then
  echo "❌ ZIP não encontrado em: $ZIP_PATH"
  exit 1
fi

echo ">>> Preparando pasta do projeto..."
rm -rf "$APP_PATH"
mkdir -p "$APP_PATH"

echo ">>> Extraindo ZIP..."
unzip -q "$ZIP_PATH" -d "$APP_PATH"

echo ">>> Ajustando estrutura do projeto..."
SUBDIR="$(find "$APP_PATH" -mindepth 1 -maxdepth 1 -type d | head -n 1 || true)"

if [[ -z "$SUBDIR" || ! -f "$SUBDIR/package.json" ]]; then
  echo "❌ package.json não encontrado após extração"
  exit 1
fi

rsync -a "$SUBDIR"/ "$APP_PATH"/
rm -rf "$SUBDIR"

cd "$APP_PATH"

echo ">>> Criando .env para build..."
cat > .env <<ENVEOF
VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_PUBLISHABLE_KEY="$BACKEND_PUBLISHABLE_KEY"
VITE_SUPABASE_URL="$BACKEND_URL"
VITE_PLATFORM_DOMAINS="$DOMAIN,www.$DOMAIN"
ENVEOF

echo ">>> Instalando dependências do projeto..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo ">>> Gerando build..."
npm run build

echo ">>> Configurando Nginx..."
cat > "/etc/nginx/sites-available/$DOMAIN" <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_PATH/dist;
    index index.html;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 1000;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files \$uri =404;
    }

    location = /index.html {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
    }

    location ~ /\. {
        deny all;
    }
}
EOF

ln -sf "/etc/nginx/sites-available/$DOMAIN" "/etc/nginx/sites-enabled/$DOMAIN"

if [[ -f /etc/nginx/sites-enabled/default ]]; then
  rm -f /etc/nginx/sites-enabled/default
fi

nginx -t
systemctl restart nginx

echo ">>> Instalando SSL (certbot)..."
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
  --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect

echo "=============================="
echo " INSTALAÇÃO FINALIZADA"
echo " https://$DOMAIN"
echo "=============================="

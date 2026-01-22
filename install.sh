#!/bin/bash
set -e

echo "=============================="
echo " INSTALADOR AUTOMÁTICO FRONT "
echo "=============================="

read -p "Domínio (ex: meusite.com): " DOMAIN
read -p "Nome da pasta do projeto (ex: app): " APP_FOLDER
read -p "Nome do arquivo ZIP (ex: gatteflow.zip): " ZIP_FILE

echo ""
echo "=============================="
echo " CONFIGURAÇÃO DO BACKEND "
echo "=============================="


# MODO SEM CHAVES / SEM BUILD NO VPS:
# - NÃO pergunta nada de backend.
# - NÃO roda npm install / npm run build.
# - Espera que o ZIP já contenha o build pronto (pasta dist/).
#
# (Opcional) bootstrap do admin via função do backend (sem service role no VPS)
# Mantemos valores default aqui para funcionar “plug and play”.
BACKEND_URL_DEFAULT="https://gfjsvuoqaheiaddvfrwb.supabase.co"
BACKEND_PUBLISHABLE_KEY_DEFAULT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmanN2dW9xYWhlaWFkZHZmcndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODYyNTIsImV4cCI6MjA4MDc2MjI1Mn0.20nFxYFWynuRr1jMH6AoqK5JmLT-7_ylwVHwg-rEm0w"

BACKEND_URL="${BACKEND_URL:-$BACKEND_URL_DEFAULT}"
BACKEND_PUBLISHABLE_KEY="${BACKEND_PUBLISHABLE_KEY:-$BACKEND_PUBLISHABLE_KEY_DEFAULT}"
BOOTSTRAP_SETUP_TOKEN="${BOOTSTRAP_SETUP_TOKEN:-gateflow_setup_v1}"

echo ""
echo "=============================="
echo " CRIAR ADMIN INICIAL "
echo "=============================="
read -p "Email do admin (ex: admin@seudominio.com): " ADMIN_EMAIL
read -s -p "Senha do admin (mín. 6 caracteres): " ADMIN_PASSWORD
echo ""

ZIP_PATH="/home/administrator/$ZIP_FILE"
APP_PATH="/var/www/$APP_FOLDER"

echo ">>> Atualizando servidor..."
apt update -y && apt upgrade -y

echo ">>> Instalando dependências..."
apt install -y nginx curl unzip certbot python3-certbot-nginx rsync

echo ">>> Verificando ZIP..."
if [ ! -f "$ZIP_PATH" ]; then
  echo "❌ ZIP não encontrado em $ZIP_PATH"
  exit 1
fi

echo ">>> Preparando pasta do projeto..."
rm -rf "$APP_PATH"
mkdir -p "$APP_PATH"

echo ">>> Extraindo ZIP..."
unzip -q "$ZIP_PATH" -d "$APP_PATH"

echo ">>> Ajustando estrutura do projeto..."
SUBDIR=$(find "$APP_PATH" -mindepth 1 -maxdepth 1 -type d | head -n 1)

if [ ! -f "$SUBDIR/package.json" ]; then
  echo "❌ package.json não encontrado após extração"
  exit 1
fi

rsync -a "$SUBDIR"/ "$APP_PATH"/
rm -rf "$SUBDIR"

# Validar se temos dist/
if [ ! -d "$APP_PATH/dist" ]; then
  echo "❌ Build não encontrado: pasta dist/ não existe no ZIP."
  echo "   Gere o build antes de zipar (npm run build) e envie o ZIP com a pasta dist/."
  exit 1
fi

echo ">>> Criando usuário admin no backend (sem chaves no VPS)..."
ADMIN_EMAIL_CLEAN=$(echo "$ADMIN_EMAIL" | tr '[:upper:]' '[:lower:]' | xargs)

if [ -z "$ADMIN_EMAIL_CLEAN" ]; then
  echo "❌ Email do admin inválido"
  exit 1
fi

if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
  echo "❌ A senha do admin deve ter pelo menos 6 caracteres"
  exit 1
fi

BOOTSTRAP_PAYLOAD=$(python3 - <<'PY'
import json, os
email = os.environ.get('ADMIN_EMAIL_CLEAN','')
password = os.environ.get('ADMIN_PASSWORD','')
print(json.dumps({
  "email": email,
  "password": password,
  "full_name": "Admin"
}))
PY
)

BOOTSTRAP_URL="$BACKEND_URL/functions/v1/bootstrap-first-admin"
BOOTSTRAP_RES=$(curl -sS -X POST "$BOOTSTRAP_URL" \
  -H "Content-Type: application/json" \
  -H "apikey: $BACKEND_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $BACKEND_PUBLISHABLE_KEY" \
  -H "x-setup-token: $BOOTSTRAP_SETUP_TOKEN" \
  --data "$BOOTSTRAP_PAYLOAD" || true)

if echo "$BOOTSTRAP_RES" | grep -q '"success"[[:space:]]*:[[:space:]]*true'; then
  echo "✅ Admin preparado: $ADMIN_EMAIL_CLEAN"
else
  # não travar deploy por causa do bootstrap
  echo "⚠️  Não foi possível preparar o admin automaticamente (o site será instalado mesmo assim)."
  echo "   Resposta do backend: $BOOTSTRAP_RES"
fi

echo ">>> Configurando Nginx..."
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    root $APP_PATH/dist;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}
EOF

ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
nginx -t
systemctl restart nginx

echo ">>> Instalando SSL..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN \
  --non-interactive --agree-tos -m admin@$DOMAIN --redirect

echo "=============================="
echo " INSTALAÇÃO FINALIZADA 🎉"
echo " https://$DOMAIN"
echo "=============================="

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

# MODO SEM PERGUNTAS (fixo):
# - NÃO perguntamos credenciais do backend.
# - Usa valores fixos no script, com possibilidade de override via env vars.
#
# IMPORTANTE:
# - Esses valores são sensíveis (especialmente a SERVICE_ROLE_KEY).
# - Se você preferir não deixar a SERVICE_ROLE_KEY no script, rode com:
#   SUPABASE_SERVICE_ROLE_KEY="..." bash install.sh

# === PREENCHA AQUI (valores padrão) ===
SUPABASE_URL_DEFAULT=""
SUPABASE_ANON_KEY_DEFAULT=""
SUPABASE_SERVICE_ROLE_KEY_DEFAULT=""

# Permite override por variáveis de ambiente
SUPABASE_URL="${SUPABASE_URL:-$SUPABASE_URL_DEFAULT}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-$SUPABASE_ANON_KEY_DEFAULT}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$SUPABASE_SERVICE_ROLE_KEY_DEFAULT}"

# Falha cedo e claramente (sem prompts)
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Credenciais do backend não configuradas."
  echo "   Preencha SUPABASE_URL_DEFAULT / SUPABASE_ANON_KEY_DEFAULT / SUPABASE_SERVICE_ROLE_KEY_DEFAULT no install.sh"
  echo "   OU rode exportando as variáveis: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY."
  exit 1
fi

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

echo ">>> Instalando Node.js (NVM)..."
if [ ! -d "$HOME/.nvm" ]; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
fi

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

nvm install 18
nvm use 18

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

cd "$APP_PATH"

echo ">>> Criando arquivo .env..."
cat > .env <<ENVEOF
VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_PUBLISHABLE_KEY="$SUPABASE_ANON_KEY"
VITE_SUPABASE_URL="$SUPABASE_URL"
VITE_PLATFORM_DOMAINS="$DOMAIN,www.$DOMAIN"
ENVEOF

echo ">>> Instalando dependências do projeto..."
npm install

echo ">>> Gerando build..."
npm run build

echo ">>> Criando usuário admin no backend (service role)..."

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Backend URL/keys inválidos"
  exit 1
fi

ADMIN_EMAIL_CLEAN=$(echo "$ADMIN_EMAIL" | tr '[:upper:]' '[:lower:]' | xargs)

if [ -z "$ADMIN_EMAIL_CLEAN" ]; then
  echo "❌ Email do admin inválido"
  exit 1
fi

if [ ${#ADMIN_PASSWORD} -lt 6 ]; then
  echo "❌ A senha do admin deve ter pelo menos 6 caracteres"
  exit 1
fi

CREATE_USER_PAYLOAD=$(python3 - <<'PY'
import json, os
email = os.environ.get('ADMIN_EMAIL_CLEAN','')
password = os.environ.get('ADMIN_PASSWORD','')
print(json.dumps({
  "email": email,
  "password": password,
  "email_confirm": True,
  "user_metadata": {"full_name": "Admin"}
}))
PY
)

CREATE_USER_RES=$(curl -sS -X POST "$SUPABASE_URL/auth/v1/admin/users" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  --data "$CREATE_USER_PAYLOAD" || true)

ADMIN_USER_ID=$(python3 - <<'PY'
import json, os, sys
raw = os.environ.get('CREATE_USER_RES','')
try:
  data = json.loads(raw)
except Exception:
  print('')
  sys.exit(0)

# Expected shape (admin create): {"id": "...", ...}
uid = data.get('id') or (data.get('user') or {}).get('id')
print(uid or '')
PY
)

if [ -z "$ADMIN_USER_ID" ]; then
  # If user already exists, try to find by email via admin list endpoint (safe with service key)
  LIST_RES=$(curl -sS -X GET "$SUPABASE_URL/auth/v1/admin/users?email=$ADMIN_EMAIL_CLEAN" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" || true)

  ADMIN_USER_ID=$(python3 - <<'PY'
import json, os, sys
raw = os.environ.get('LIST_RES','')
try:
  data = json.loads(raw)
except Exception:
  print('')
  sys.exit(0)

# Some backends return {"users": [...]} for list
users = data.get('users') if isinstance(data, dict) else None
if isinstance(users, list) and users:
  print(users[0].get('id') or '')
else:
  print('')
PY
)
fi

if [ -z "$ADMIN_USER_ID" ]; then
  echo "❌ Não foi possível criar/encontrar o usuário admin. Resposta:"
  echo "$CREATE_USER_RES"
  exit 1
fi

# Define role admin (idempotente: ignora duplicado via Prefer/Conflict)
ROLE_RES=$(curl -sS -X POST "$SUPABASE_URL/rest/v1/user_roles" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates,return=representation" \
  --data "{\"user_id\": \"$ADMIN_USER_ID\", \"role\": \"admin\"}" || true)

echo "✅ Admin preparado: $ADMIN_EMAIL_CLEAN"

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

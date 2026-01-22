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


# MODO MULTI-CLIENTE:
# - Pergunta no terminal o backend (URL + chave pública) de cada cliente.
# - Mantém defaults para instalação "plug and play" (basta apertar Enter).
# - O bootstrap/criação automática de admin foi removido (admin será criado manualmente depois).
BACKEND_URL_DEFAULT="https://gfjsvuoqaheiaddvfrwb.supabase.co"
BACKEND_PUBLISHABLE_KEY_DEFAULT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmanN2dW9xYWhlaWFkZHZmcndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODYyNTIsImV4cCI6MjA4MDc2MjI1Mn0.20nFxYFWynuRr1jMH6AoqK5JmLT-7_ylwVHwg-rEm0w"

BACKEND_URL="${BACKEND_URL:-$BACKEND_URL_DEFAULT}"
BACKEND_PUBLISHABLE_KEY="${BACKEND_PUBLISHABLE_KEY:-$BACKEND_PUBLISHABLE_KEY_DEFAULT}"
BOOTSTRAP_SETUP_TOKEN="${BOOTSTRAP_SETUP_TOKEN:-gateflow_setup_v1}"

# Normaliza URL para evitar "//functions" etc.
BACKEND_URL="${BACKEND_URL%/}"

echo ""
echo "=============================="
echo " BACKEND DO CLIENTE (OPCIONAL)"
echo "=============================="
echo "Dica: aperte Enter para usar o padrão (modo plug and play)."
read -p "Backend URL (default: $BACKEND_URL): " BACKEND_URL_INPUT
BACKEND_URL="${BACKEND_URL_INPUT:-$BACKEND_URL}"

read -p "Backend Publishable Key (default: ${BACKEND_PUBLISHABLE_KEY:0:10}...): " BACKEND_PUBLISHABLE_KEY_INPUT
BACKEND_PUBLISHABLE_KEY="${BACKEND_PUBLISHABLE_KEY_INPUT:-$BACKEND_PUBLISHABLE_KEY}"

# Validações simples para evitar configurações inválidas
if [ -z "$BACKEND_URL" ]; then
  echo "❌ Backend URL não pode ser vazio"
  exit 1
fi

if [[ "$BACKEND_URL" != https://* ]]; then
  echo "❌ Backend URL inválida. Use https://..."
  exit 1
fi

if [ -z "$BACKEND_PUBLISHABLE_KEY" ] || [ ${#BACKEND_PUBLISHABLE_KEY} -lt 20 ]; then
  echo "❌ Publishable Key inválida (muito curta ou vazia)"
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
# shellcheck disable=SC1090
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

echo ">>> Criando arquivo .env (automático, sem pedir chaves)..."
cat > .env <<ENVEOF
VITE_SUPABASE_PROJECT_ID=""
VITE_SUPABASE_PUBLISHABLE_KEY="$BACKEND_PUBLISHABLE_KEY"
VITE_SUPABASE_URL="$BACKEND_URL"
VITE_PLATFORM_DOMAINS="$DOMAIN,www.$DOMAIN"
ENVEOF

echo ">>> Instalando dependências do projeto..."
npm install

echo ">>> Gerando build..."
npm run build

echo ">>> Criando usuário admin no backend (sem chaves no VPS)..."
ADMIN_EMAIL_CLEAN=$(echo "$ADMIN_EMAIL" | tr '[:upper:]' '[:lower:]' | xargs)

if [ -z "$ADMIN_EMAIL_CLEAN" ] || [[ "$ADMIN_EMAIL_CLEAN" != *"@"* ]]; then
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
BOOTSTRAP_HTTP_CODE=$(curl -sS -o /tmp/bootstrap_res.json -w "%{http_code}" -X POST "$BOOTSTRAP_URL" \
  -H "Content-Type: application/json" \
  -H "apikey: $BACKEND_PUBLISHABLE_KEY" \
  -H "Authorization: Bearer $BACKEND_PUBLISHABLE_KEY" \
  -H "x-setup-token: $BOOTSTRAP_SETUP_TOKEN" \
  --data "$BOOTSTRAP_PAYLOAD" || true)
BOOTSTRAP_RES=$(cat /tmp/bootstrap_res.json 2>/dev/null || echo "")

if echo "$BOOTSTRAP_RES" | grep -q '"success"[[:space:]]*:[[:space:]]*true'; then
  echo "✅ Admin preparado (via função): $ADMIN_EMAIL_CLEAN"
else
  # Se a função não existir no backend externo, cai para fallback com SERVICE_ROLE_KEY.
  if echo "$BOOTSTRAP_RES" | grep -q '"code"[[:space:]]*:[[:space:]]*"NOT_FOUND"'; then
    echo "⚠️  Função bootstrap-first-admin não encontrada nesse backend. Usando fallback com SERVICE_ROLE_KEY..."
    read -s -p "SERVICE_ROLE_KEY do backend do cliente (não será salva): " SERVICE_ROLE_KEY
    echo ""

    if [ -z "$SERVICE_ROLE_KEY" ] || [ ${#SERVICE_ROLE_KEY} -lt 20 ]; then
      echo "❌ SERVICE_ROLE_KEY inválida (muito curta ou vazia)"
      exit 1
    fi

    AUTH_ADMIN_USERS_URL="$BACKEND_URL/auth/v1/admin/users"

    echo ">>> Procurando usuário existente por email..."
    LIST_HTTP_CODE=$(curl -sS -o /tmp/list_users.json -w "%{http_code}" -X GET "$AUTH_ADMIN_USERS_URL?page=1&per_page=1000" \
      -H "Content-Type: application/json" \
      -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" || true)

    if [ "$LIST_HTTP_CODE" != "200" ]; then
      echo "❌ Falha ao listar usuários (HTTP $LIST_HTTP_CODE)."
      echo "   Resposta: $(cat /tmp/list_users.json 2>/dev/null || true)"
      exit 1
    fi

    USER_ID=$(python3 - <<'PY'
import json

email = ("""${ADMIN_EMAIL_CLEAN}""").strip().lower()

try:
  data = json.load(open('/tmp/list_users.json'))
except Exception:
  print("")
  raise SystemExit(0)

users = data.get('users', []) if isinstance(data, dict) else []
for u in users:
  if (u.get('email') or '').strip().lower() == email:
    print(u.get('id') or "")
    break
PY
)

    if [ -z "$USER_ID" ]; then
      echo ">>> Usuário não existe. Criando via Admin API..."
      CREATE_HTTP_CODE=$(curl -sS -o /tmp/create_user.json -w "%{http_code}" -X POST "$AUTH_ADMIN_USERS_URL" \
        -H "Content-Type: application/json" \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        --data "$BOOTSTRAP_PAYLOAD" || true)

      if [ "$CREATE_HTTP_CODE" != "200" ]; then
        echo "❌ Falha ao criar usuário admin (HTTP $CREATE_HTTP_CODE)."
        echo "   Resposta: $(cat /tmp/create_user.json 2>/dev/null || true)"
        exit 1
      fi

      USER_ID=$(python3 - <<'PY'
import json
try:
  data = json.load(open('/tmp/create_user.json'))
  print(data.get('id') or "")
except Exception:
  print("")
PY
)
    else
      echo ">>> Usuário já existe. Atualizando senha via Admin API..."
      UPDATE_HTTP_CODE=$(curl -sS -o /tmp/update_user.json -w "%{http_code}" -X PUT "$AUTH_ADMIN_USERS_URL/$USER_ID" \
        -H "Content-Type: application/json" \
        -H "apikey: $SERVICE_ROLE_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        --data "{\"password\": \"$ADMIN_PASSWORD\"}" || true)

      if [ "$UPDATE_HTTP_CODE" != "200" ]; then
        echo "❌ Falha ao atualizar senha do admin (HTTP $UPDATE_HTTP_CODE)."
        echo "   Resposta: $(cat /tmp/update_user.json 2>/dev/null || true)"
        exit 1
      fi
    fi

    if [ -z "$USER_ID" ]; then
      echo "❌ Não foi possível determinar o user_id do admin."
      exit 1
    fi

    echo ">>> Garantindo role admin em user_roles..."
    ROLE_HTTP_CODE=$(curl -sS -o /tmp/role_insert.json -w "%{http_code}" -X POST "$BACKEND_URL/rest/v1/user_roles" \
      -H "Content-Type: application/json" \
      -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      -H "Prefer: resolution=merge-duplicates" \
      --data "{\"user_id\":\"$USER_ID\",\"role\":\"admin\"}" || true)

    # PostgREST costuma retornar 201/204 em inserts.
    if [ "$ROLE_HTTP_CODE" != "201" ] && [ "$ROLE_HTTP_CODE" != "204" ] && [ "$ROLE_HTTP_CODE" != "200" ]; then
      echo "❌ Falha ao inserir role admin em user_roles (HTTP $ROLE_HTTP_CODE)."
      echo "   Resposta: $(cat /tmp/role_insert.json 2>/dev/null || true)"
      echo "   (Provável causa: schema do backend do cliente não tem a tabela user_roles compatível.)"
      exit 1
    fi

    echo ">>> (Opcional) garantindo profile mínimo em profiles..."
    PROFILE_HTTP_CODE=$(curl -sS -o /tmp/profile_insert.json -w "%{http_code}" -X POST "$BACKEND_URL/rest/v1/profiles" \
      -H "Content-Type: application/json" \
      -H "apikey: $SERVICE_ROLE_KEY" \
      -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
      -H "Prefer: resolution=merge-duplicates" \
      --data "{\"user_id\":\"$USER_ID\",\"email\":\"$ADMIN_EMAIL_CLEAN\",\"full_name\":\"Admin\"}" || true)

    if [ "$PROFILE_HTTP_CODE" != "201" ] && [ "$PROFILE_HTTP_CODE" != "204" ] && [ "$PROFILE_HTTP_CODE" != "200" ]; then
      echo "⚠️  Não consegui garantir profiles (HTTP $PROFILE_HTTP_CODE). Seguindo mesmo assim."
    fi

    echo "✅ Admin preparado (fallback): $ADMIN_EMAIL_CLEAN"
    unset SERVICE_ROLE_KEY
  else
    echo "❌ Falha ao preparar o admin automaticamente."
    echo "   HTTP: $BOOTSTRAP_HTTP_CODE"
    echo "   Resposta do backend: $BOOTSTRAP_RES"
    exit 1
  fi
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

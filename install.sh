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
# - O admin padrão é provisionado automaticamente via chave de serviço (server-side).
BACKEND_URL_DEFAULT="https://gfjsvuoqaheiaddvfrwb.supabase.co"
BACKEND_PUBLISHABLE_KEY_DEFAULT="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdmanN2dW9xYWhlaWFkZHZmcndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxODYyNTIsImV4cCI6MjA4MDc2MjI1Mn0.20nFxYFWynuRr1jMH6AoqK5JmLT-7_ylwVHwg-rEm0w"

BACKEND_URL="${BACKEND_URL:-$BACKEND_URL_DEFAULT}"
BACKEND_PUBLISHABLE_KEY="${BACKEND_PUBLISHABLE_KEY:-$BACKEND_PUBLISHABLE_KEY_DEFAULT}"
BACKEND_SERVICE_ROLE_KEY="${BACKEND_SERVICE_ROLE_KEY:-}"

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
echo " CHAVE DE SERVIÇO (OBRIGATÓRIO)"
echo "=============================="
echo "Para criar/resetar o admin padrão (admin@admin.com / 123456), o instalador precisa da Service Role Key do backend do cliente."

# Tenta ler automaticamente de /root/gateflow-backend.env (se existir)
BACKEND_ENV_FILE="/root/gateflow-backend.env"
if [ -z "$BACKEND_SERVICE_ROLE_KEY" ] && [ -f "$BACKEND_ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source "$BACKEND_ENV_FILE" || true
  # Suporta nomes comuns
  BACKEND_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-${BACKEND_SERVICE_ROLE_KEY:-}}"
fi

if [ -z "$BACKEND_SERVICE_ROLE_KEY" ]; then
  read -s -p "Service Role Key do backend: " BACKEND_SERVICE_ROLE_KEY
  echo ""
fi

if [ -z "$BACKEND_SERVICE_ROLE_KEY" ] || [ ${#BACKEND_SERVICE_ROLE_KEY} -lt 40 ]; then
  echo "❌ Service Role Key inválida (muito curta ou vazia)"
  exit 1
fi

echo ""
echo "=============================="
echo " SETUP INICIAL "
echo "=============================="
echo "✅ O instalador vai criar/resetar automaticamente: admin@admin.com / 123456"

ZIP_PATH="/home/administrator/$ZIP_FILE"
APP_PATH="/var/www/$APP_FOLDER"

echo ">>> Atualizando servidor..."
apt update -y && apt upgrade -y

echo ">>> Instalando dependências..."
apt install -y nginx curl unzip certbot python3-certbot-nginx rsync python3

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

echo ">>> Provisionando admin padrão (admin@admin.com / 123456)..."

ADMIN_EMAIL="admin@admin.com"
ADMIN_PASSWORD="123456"
ADMIN_FULL_NAME="Admin"

ADMIN_HEADERS=(
  -H "Authorization: Bearer $BACKEND_SERVICE_ROLE_KEY"
  -H "apikey: $BACKEND_SERVICE_ROLE_KEY"
  -H "Content-Type: application/json"
)

create_payload=$(cat <<JSON
{"email":"$ADMIN_EMAIL","password":"$ADMIN_PASSWORD","email_confirm":true,"user_metadata":{"full_name":"$ADMIN_FULL_NAME"}}
JSON
)

create_resp=$(curl -sS -w "\n%{http_code}" -X POST "$BACKEND_URL/auth/v1/admin/users" "${ADMIN_HEADERS[@]}" -d "$create_payload" || true)
create_body=$(echo "$create_resp" | head -n -1)
create_code=$(echo "$create_resp" | tail -n 1)

admin_user_id=""

if [ "$create_code" = "200" ] || [ "$create_code" = "201" ]; then
  admin_user_id=$(python3 - <<PY
import json,sys
data=json.loads(sys.argv[1] or "{}")
print(data.get("id") or data.get("user",{}).get("id") or "")
PY
"$create_body")
else
  # Usuário pode já existir; buscamos pelo email na listagem admin
  users_resp=$(curl -sS -w "\n%{http_code}" -X GET "$BACKEND_URL/auth/v1/admin/users?page=1&per_page=200" "${ADMIN_HEADERS[@]}" || true)
  users_body=$(echo "$users_resp" | head -n -1)
  users_code=$(echo "$users_resp" | tail -n 1)

  if [ "$users_code" != "200" ]; then
    echo "❌ Não consegui listar usuários no backend para localizar o admin."
    echo "HTTP $users_code"
    echo "$users_body"
    exit 1
  fi

  admin_user_id=$(python3 - <<PY
import json,sys
email=sys.argv[2].strip().lower()
obj=json.loads(sys.argv[1])
users=obj.get('users') if isinstance(obj, dict) else obj
if not isinstance(users, list):
  users=[]
for u in users:
  if str(u.get('email','')).strip().lower()==email:
    print(u.get('id',''))
    raise SystemExit(0)
print('')
PY
"$users_body" "$ADMIN_EMAIL")

  if [ -z "$admin_user_id" ]; then
    echo "❌ Admin já existe mas não consegui localizar o user_id por email ($ADMIN_EMAIL)."
    exit 1
  fi

  update_payload=$(cat <<JSON
{"password":"$ADMIN_PASSWORD"}
JSON
)
  update_resp=$(curl -sS -w "\n%{http_code}" -X PUT "$BACKEND_URL/auth/v1/admin/users/$admin_user_id" "${ADMIN_HEADERS[@]}" -d "$update_payload" || true)
  update_body=$(echo "$update_resp" | head -n -1)
  update_code=$(echo "$update_resp" | tail -n 1)

  if [ "$update_code" != "200" ]; then
    echo "❌ Falha ao resetar senha do admin."
    echo "HTTP $update_code"
    echo "$update_body"
    exit 1
  fi
fi

if [ -z "$admin_user_id" ]; then
  echo "❌ Não consegui obter o user_id do admin."
  echo "HTTP $create_code"
  echo "$create_body"
  exit 1
fi

# Garante role 'admin' na tabela user_roles (idempotente)
role_payload=$(cat <<JSON
[{"user_id":"$admin_user_id","role":"admin"}]
JSON
)

role_resp=$(curl -sS -w "\n%{http_code}" -X POST "$BACKEND_URL/rest/v1/user_roles?on_conflict=user_id,role" \
  -H "Authorization: Bearer $BACKEND_SERVICE_ROLE_KEY" \
  -H "apikey: $BACKEND_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: resolution=merge-duplicates" \
  -d "$role_payload" || true)
role_body=$(echo "$role_resp" | head -n -1)
role_code=$(echo "$role_resp" | tail -n 1)

if [ "$role_code" != "201" ] && [ "$role_code" != "200" ] && [ "$role_code" != "204" ]; then
  echo "❌ Falha ao garantir role admin em user_roles."
  echo "HTTP $role_code"
  echo "$role_body"
  exit 1
fi

echo "✅ Admin pronto: $ADMIN_EMAIL / $ADMIN_PASSWORD"

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
echo " LOGIN PADRÃO: admin@admin.com / 123456"
echo "=============================="

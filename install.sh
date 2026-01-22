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
echo "ℹ️  Bootstrap desativado: o admin deverá ser criado manualmente no backend do cliente após a instalação."
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
echo ""
echo "Próximos passos:"
echo "- Crie o usuário admin no backend do cliente (autenticação) e atribua a role/perfil necessário no sistema."
echo "- Garanta que o backend do cliente tenha as tabelas/funções/políticas compatíveis com este sistema."
echo "=============================="

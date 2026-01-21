#!/bin/bash
set -e

echo "=============================="
echo " INSTALADOR AUTOMÁTICO FRONT "
echo "=============================="

read -p "Domínio (ex: meusite.com): " DOMAIN
read -p "Nome da pasta do projeto (ex: app): " APP_FOLDER
read -p "Nome do arquivo ZIP (ex: gatteflow.zip): " ZIP_FILE

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
echo "=============================="

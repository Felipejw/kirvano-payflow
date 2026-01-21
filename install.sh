#!/bin/bash

echo "=============================="
echo " INSTALADOR AUTOMÁTICO FRONT "
echo "=============================="

read -p "Digite o domínio (ex: meusite.com): " DOMAIN
read -p "Digite o nome da pasta do projeto (ex: app): " APP_FOLDER

APP_PATH="/var/www/$APP_FOLDER"

echo ">>> Atualizando servidor..."
apt update && apt upgrade -y

echo ">>> Instalando dependências básicas..."
apt install -y nginx curl unzip certbot python3-certbot-nginx

echo ">>> Instalando Node.js LTS (NVM)..."
if ! command -v nvm &> /dev/null; then
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  source "$NVM_DIR/nvm.sh"
fi

nvm install 18
nvm use 18

echo ">>> Ajustando permissões..."
chown -R root:root $APP_PATH

cd $APP_PATH || exit

echo ">>> Instalando dependências do projeto..."
npm install

echo ">>> Gerando build..."
npm run build

echo ">>> Criando configuração do Nginx..."
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

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

ln -s /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

echo ">>> Instalando SSL (Let's Encrypt)..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN --redirect

echo "=============================="
echo " INSTALAÇÃO FINALIZADA 🎉"
echo " Site no ar: https://$DOMAIN"
echo "=============================="

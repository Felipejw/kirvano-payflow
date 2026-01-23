#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo " ATUALIZADOR AUTOMÁTICO FRONT "
echo "=============================="
echo ""

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo "❌ Execute como root (sudo ./update.sh)"
  exit 1
fi

read -r -p "Nome da pasta do projeto (ex: app): " APP_FOLDER
read -r -p "(Opcional) Caminho do novo ZIP (Enter para manter código atual): " ZIP_PATH

APP_FOLDER="${APP_FOLDER// /}"
if [[ -z "$APP_FOLDER" ]]; then
  echo "❌ Pasta do projeto é obrigatória"
  exit 1
fi

APP_PATH="/var/www/${APP_FOLDER}"
if [[ ! -d "$APP_PATH" ]]; then
  echo "❌ Projeto não encontrado em: $APP_PATH"
  exit 1
fi

echo ">>> Instalando/atualizando dependências do sistema (se necessário)..."
apt update -y
apt install -y nginx curl unzip rsync ca-certificates

echo ">>> Carregando NVM (Node 18)..."
export NVM_DIR="${NVM_DIR:-/root/.nvm}"
if [[ -d "$NVM_DIR" ]]; then
  # shellcheck disable=SC1090
  source "$NVM_DIR/nvm.sh"
  nvm install 18
  nvm use 18
else
  echo "⚠️  NVM não encontrado em $NVM_DIR. Se o build falhar, rode o install.sh novamente."
fi

if [[ -n "${ZIP_PATH// /}" ]]; then
  ZIP_PATH="${ZIP_PATH// /}"
  if [[ ! -f "$ZIP_PATH" ]]; then
    echo "❌ ZIP não encontrado em: $ZIP_PATH"
    exit 1
  fi

  echo ">>> Atualizando código via ZIP..."
  TMP_DIR="$(mktemp -d)"
  unzip -q "$ZIP_PATH" -d "$TMP_DIR"
  SUBDIR="$(find "$TMP_DIR" -mindepth 1 -maxdepth 1 -type d | head -n 1 || true)"
  if [[ -z "$SUBDIR" || ! -f "$SUBDIR/package.json" ]]; then
    echo "❌ package.json não encontrado no ZIP"
    rm -rf "$TMP_DIR"
    exit 1
  fi

  rsync -a --delete "$SUBDIR"/ "$APP_PATH"/
  rm -rf "$TMP_DIR"
fi

cd "$APP_PATH"

echo ">>> Instalando dependências do projeto..."
if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

echo ">>> Gerando build..."
npm run build

echo ">>> Reiniciando Nginx..."
nginx -t
systemctl restart nginx

echo "✅ Atualização concluída."

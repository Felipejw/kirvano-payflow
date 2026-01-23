# Instalação no VPS (Build no servidor)

Este projeto pode ser instalado em um VPS (Ubuntu/Debian) com Nginx + SSL automático.

## Pré-requisitos

1. Um domínio apontando para o IP do seu VPS (A record para `@` e `www`).
2. Acesso root ao servidor (`sudo`).
3. Um arquivo ZIP do projeto (código-fonte), enviado para o VPS.

## Instalar

1. Envie o ZIP para o VPS (ex.: `/home/ubuntu/app.zip`).
2. No repositório/clonado no VPS, rode:

```bash
chmod +x install.sh
sudo ./install.sh
```

O script irá:
- instalar dependências do sistema (nginx, certbot, etc.)
- instalar Node 18 via NVM
- extrair o ZIP para `/var/www/<pasta>`
- criar `.env` com `VITE_PLATFORM_DOMAINS` baseado no seu domínio
- rodar `npm install`/`npm ci` e `npm run build`
- configurar Nginx com SPA routing
- emitir certificado SSL e ativar HTTPS

## Atualizar

Para atualizar o código/build depois:

```bash
chmod +x update.sh
sudo ./update.sh
```

Você pode informar um novo ZIP ou apenas rebuildar o que já está em `/var/www/<pasta>`.

## Problemas comuns

- **Certificado SSL falha**: normalmente é DNS ainda não propagado ou domínio não aponta para o VPS.
- **Build falha por memória**: VPS pequeno pode precisar de swap.
- **Nginx não sobe**: rode `nginx -t` para ver o erro exato e verifique conflitos de server_name.

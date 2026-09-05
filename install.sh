#!/bin/bash

# ==========================================================
# SCRIPT DE INSTALAÇÃO AUTOMÁTICA - INFORLOZZI IPTV GESTOR
# ==========================================================

echo "🚀 Iniciando instalação do Gestor IPTV..."

# 1. Atualizar o sistema
echo "📦 Atualizando pacotes do sistema..."
apt update && apt upgrade -y

# 2. Instalar Node.js (v20) e npm
echo "🟢 Instalando Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 3. Instalar PM2 globalmente
echo "⚙️ Instalando PM2..."
npm install -g pm2

# 4. Instalar dependências do Next.js
echo " Instalando dependências do Node.js..."
npm install

# 5. Criar arquivo .env.local
echo "🔧 Configurando variáveis de ambiente..."
cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_SUPABASE_URL=SUBSTITUA_PELA_SUA_URL_DO_SUPABASE
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUBSTITUA_PELA_CHAVE_ANON_DO_SUPABASE
SUPABASE_SERVICE_ROLE_KEY=SUBSTITUA_PELA_CHAVE_SERVICE_ROLE_DO_SUPABASE
NEXTAUTH_SECRET=uma_chave_secreta_aleatoria_muito_forte_aqui_123456
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENVEOF

echo "⚠️ IMPORTANTE: Edite o arquivo .env.local com suas chaves reais do Supabase!"
echo "Use o comando: nano .env.local"
read -p "Pressione ENTER após editar o arquivo .env.local para continuar..."

# 6. Build do projeto
echo "🏗️ Compilando o projeto (isso pode levar alguns minutos)..."
npm run build

# 7. Iniciar com PM2
echo "🚀 Iniciando a aplicação com PM2..."
pm2 start npm --name "inforlozzi-gestor" -- start

# 8. Configurar PM2 para iniciar no boot do servidor
echo "⚙️ Configurando inicialização automática no boot..."
pm2 startup
pm2 save

echo "✅ INSTALAÇÃO CONCLUÍDA COM SUCESSO!"
echo "🌐 Acesse o sistema em: http://SEU_IP_OU_DOMINIO:3000"
echo "📊 Para ver os logs, use: pm2 logs inforlozzi-gestor"

# 🚀 Inforlozzi Gestor - Sistema de Gestão IPTV

Sistema profissional e automatizado para gestão de clientes IPTV, com geração de cobranças via Mercado Pago (PIX), automação de lembretes via WhatsApp (Evolution API) e dashboard completo.

## 🛠️ Tecnologias
- Next.js 16, Supabase, Evolution API, Mercado Pago, PM2, Nginx.

## ⚙️ Variáveis de Ambiente (.env.local)
Crie um arquivo .env.local com:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- EVOLUTION_API_URL
- EVOLUTION_API_KEY
- EVOLUTION_INSTANCE_NAME
- MERCADOPAGO_ACCESS_TOKEN
- MERCADOPAGO_WEBHOOK_URL
- ADMIN_WHATSAPP_PHONE
- AUTOMATION_SECRET

## 📦 Instalação Rápida
1. git clone https://github.com/Inforlozzi-ai/inforlozzi-gestor.git
2. cd inforlozzi-gestor
3. npm install
4. Configure o .env.local
5. npm run build
6. pm2 start npm --name "inforlozzi-gestor" -- start

## 🔄 Atualização
1. pm2 stop inforlozzi-gestor
2. git pull origin main
3. npm install
4. npm run build
5. pm2 start inforlozzi-gestor

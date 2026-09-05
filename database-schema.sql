-- ==========================================================
-- SCRIPT DE INSTALAÇÃO COMPLETA - INFORLOZZI IPTV GESTOR
-- ==========================================================
-- INSTRUÇÕES:
-- 1. Acesse o painel do Supabase (https://supabase.com/dashboard)
-- 2. Selecione seu projeto.
-- 3. No menu lateral, clique em "SQL Editor".
-- 4. Clique em "+ New query".
-- 5. Cole todo este código e clique em "Run".
-- ==========================================================

-- 1. Tabela de Planos
CREATE TABLE IF NOT EXISTS public.iptv_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabela de Produtos (Painéis, Apps, etc)
CREATE TABLE IF NOT EXISTS public.iptv_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 30,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.iptv_clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  xtream_username TEXT,
  xtream_password TEXT,
  panel_name TEXT,
  plan_id UUID REFERENCES public.iptv_plans(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.iptv_products(id) ON DELETE SET NULL,
  expiration_date TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Configurações de Cobrança e Integrações
CREATE TABLE IF NOT EXISTS public.billing_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT DEFAULT 'Inforlozzi',
  whatsapp_api_url TEXT,
  whatsapp_api_key TEXT,
  whatsapp_instance_name TEXT DEFAULT 'inforlozzi',
  mercado_pago_access_token TEXT,
  mercado_pago_expiration INTEGER DEFAULT 86400,
  notification_image_url TEXT,
  duplicate_check BOOLEAN DEFAULT true,
  days_before INTEGER[] DEFAULT '{3, 1}',
  days_after INTEGER[] DEFAULT '{1}',
  send_on_due_date BOOLEAN DEFAULT true,
  schedule_times TEXT[] DEFAULT '{09:30}',
  template_before TEXT,
  template_on_day TEXT,
  template_after TEXT,
  template_renewal TEXT,
  auto_renew BOOLEAN DEFAULT false,
  grace_period_days INTEGER DEFAULT 3,
  max_reminders INTEGER DEFAULT 3,
  reminder_interval_hours INTEGER DEFAULT 24,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Logs de Envio (Histórico)
CREATE TABLE IF NOT EXISTS public.billing_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES public.iptv_clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  days_offset INTEGER,
  success BOOLEAN DEFAULT false,
  error_message TEXT,
  message_sent TEXT,
  payment_id TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Templates de Mensagem (Avançado)
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================================
-- INSERÇÃO DE DADOS INICIAIS (TEMPLATES OTIMIZADOS)
-- ==========================================================

INSERT INTO public.billing_settings (
  company_name, 
  whatsapp_instance_name,
  template_before,
  template_on_day,
  template_after,
  template_renewal
) VALUES (
  'Inforlozzi',
  'Inforplay',
  'Olá *{{customer_first_name}}*! 👋 Tudo bem?

⏰ Seu plano *{{customer_plan_name}}* vence em *{{customer_days}} dia(s)*!

📅 *Vencimento:* {{customer_duedate}}
💰 *Valor:* {{customer_plan_value}}

━━━━━━━━━━━━━━━━━━
💳 *PAGAMENTO VIA PIX*
━━━━━━━━━━━━━━━━━━

📋 *Copia e Cola:*
{{pix_mercadopago_code}}

━━━━━━━━━━━━━━━━━━

✅ Após o pagamento, seu acesso será renovado automaticamente!

🚀 Dúvidas? Estamos à disposição!
_Inforlozzi IPTV_',

  '🔴 *ATENÇÃO - VENCE HOJE!* 🔴

Olá *{{customer_first_name}}*! ⚠️

Seu plano *{{customer_plan_name}}* vence *HOJE*!

📅 *Vencimento:* {{customer_duedate}}
💰 *Valor:* {{customer_plan_value}}

━━━━━━━━━━━━━━━━━━
💳 *PAGAMENTO VIA PIX*
━━━━━━━━━━━━━━━━━━

 *Copia e Cola:*
{{pix_mercadopago_code}}

━━━━━━━━━━━━━━━━━━

⚡ *Pague agora para não perder o acesso!*

 Obrigado pela preferência!
_Inforlozzi IPTV_',

  '❌ *PLANO VENCIDO* ❌

Olá *{{customer_first_name}}*! 😔

Seu plano *{{customer_plan_name}}* venceu há *{{customer_days}} dia(s)*.

📅 *Vencimento:* {{customer_duedate}}
💰 *Valor:* {{customer_plan_value}}

━━━━━━━━━━━━━━━━━━
💳 *REGULARIZE AGORA*
━━━━━━━━━━━━━━━━━━

📋 *PIX Copia e Cola:*
{{pix_mercadopago_code}}

━━━━━━━━━━━━━━━━━━

🔒 Seu acesso está bloqueado.
✅ Após o pagamento, será reativado imediatamente!

💪 Regularize agora!
_Inforlozzi IPTV_',

  '🎉 *RENOVAÇÃO CONFIRMADA!* 🎉

Olá *{{customer_first_name}}*! ✨

Seu plano *{{customer_plan_name}}* foi renovado com sucesso!

✅ *Pagamento confirmado!*
📅 *Novo vencimento:* {{customer_duedate}}
💰 *Valor pago:* {{customer_plan_value}}

━━━━━━━━━━━━━━━━━━

🚀 Seu acesso continua ativo sem interrupções!

🙏 Muito obrigado pela confiança!
_Inforlozzi IPTV_ 💙'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.message_templates (name, type, content, active) VALUES
('Lembrete 3 dias antes', 'before', 'Olá {nome}! Seu plano IPTV vence em 3 dias. Valor: R$ {valor}. PIX: {pix}', true),
('Lembrete 1 dia antes', 'before', 'Olá {nome}! Seu plano IPTV vence AMANHÃ. Valor: R$ {valor}. PIX: {pix}', true),
('Dia do vencimento', 'on_day', 'Olá {nome}! Seu plano IPTV vence HOJE. Valor: R$ {valor}. PIX: {pix}', true),
('1 dia após vencimento', 'after', 'Olá {nome}! Seu plano IPTV venceu ontem. Regularize para evitar bloqueio. PIX: {pix}', true),
('Boas-vindas', 'welcome', 'Olá {nome}! Bem-vindo à Inforlozzi IPTV. Usuário: {usuario} | Senha: {senha}', true),
('Renovação confirmada', 'renewal', 'Olá {nome}! Renovação confirmada. Novo vencimento: {vencimento}. Obrigado!', true)
ON CONFLICT DO NOTHING;

-- ==========================================================
-- CONFIGURAÇÃO DE SEGURANÇA (RLS - Row Level Security)
-- ==========================================================
ALTER TABLE public.iptv_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iptv_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iptv_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON public.iptv_plans FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.iptv_products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.iptv_clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.billing_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.billing_logs FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.message_templates FOR ALL TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';

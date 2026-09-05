import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para obter a data de hoje no fuso de Brasília (YYYY-MM-DD)
const getTodayBrasilia = () => {
  const now = new Date();
  const brasiliaStr = now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
  const brasiliaDate = new Date(brasiliaStr);
  const year = brasiliaDate.getFullYear();
  const month = String(brasiliaDate.getMonth() + 1).padStart(2, '0');
  const day = String(brasiliaDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para extrair apenas a data (YYYY-MM-DD) de uma string ISO
const extractDate = (dateString: string) => {
  if (!dateString) return null;
  return dateString.substring(0, 10);
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body;

    console.log(`🚀 Iniciando envio tipo: ${type}`);

    // 1. Buscar configurações
    const { data: settings } = await supabase
      .from('billing_settings')
      .select('*')
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 400 });
    }

    console.log(`✅ Configurações carregadas: ${settings.company_name}`);

    // 2. Buscar template correto
    let template = '';
    let daysOffset = 0;

    if (type === 'before') {
      template = settings.template_before || '';
      daysOffset = -3;
    } else if (type === 'on_day') {
      template = settings.template_on_day || '';
      daysOffset = 0;
    } else if (type === 'after') {
      template = settings.template_after || '';
      daysOffset = 1;
    }

    if (!template) {
      console.log(`⚠️ Template ${type} vazio, ignorando...`);
      return NextResponse.json({ success: true, sent: 0, errors: 0, skipped: 0 });
    }

    // 3. Buscar clientes ativos
    const { data: clients } = await supabase
      .from('iptv_clients')
      .select('*, plan:iptv_plans(*), product:iptv_products(*)')
      .eq('active', true);

    if (!clients || clients.length === 0) {
      console.log('👥 Nenhum cliente ativo encontrado');
      return NextResponse.json({ success: true, sent: 0, errors: 0, skipped: 0 });
    }

    console.log(`👥 ${clients.length} clientes ativos encontrados`);

    let sent = 0;
    let errors = 0;
    let skipped = 0;

    const todayBrasilia = getTodayBrasilia();
    console.log(`📅 Data de hoje (Brasília): ${todayBrasilia}`);

    // 4. Processar cada cliente
    for (const client of clients) {
      try {
        if (!client.phone) {
          console.log(`⏭️ ${client.name}: Sem telefone, ignorado`);
          skipped++;
          continue;
        }

        if (!client.expiration_date) {
          console.log(`⏭️ ${client.name}: Sem data de vencimento, ignorado`);
          skipped++;
          continue;
        }

        // Extrair data de vencimento no formato YYYY-MM-DD
        const expDateStr = extractDate(client.expiration_date);
        console.log(` ${client.name}: Vencimento = ${expDateStr}`);

        if (!expDateStr) {
          console.log(`️ ${client.name}: Data inválida, ignorado`);
          skipped++;
          continue;
        }

        // Calcular diferença em dias
        const todayDate = new Date(todayBrasilia + 'T00:00:00');
        const expDate = new Date(expDateStr + 'T00:00:00');
        const diffTime = expDate.getTime() - todayDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        console.log(`📊 ${client.name}: diffDays = ${diffDays}`);

        // Verificar se deve enviar
        let shouldSend = false;
        if (type === 'before' && diffDays > 0 && diffDays <= 3) {
          shouldSend = true;
        } else if (type === 'on_day' && diffDays === 0) {
          shouldSend = true;
        } else if (type === 'after' && diffDays < 0 && diffDays >= -3) {
          shouldSend = true;
        }

        if (!shouldSend) {
          console.log(`⏭️ ${client.name}: Não é o momento para ${type} (diffDays=${diffDays})`);
          skipped++;
          continue;
        }

        // Verificar duplicatas
        if (settings.duplicate_check) {
          const { data: existingLog } = await supabase
            .from('billing_logs')
            .select('id')
            .eq('client_id', client.id)
            .eq('type', type)
            .limit(1);

          if (existingLog && existingLog.length > 0) {
            console.log(`⏭️ Já enviado para ${client.name} (tipo: ${type})`);
            skipped++;
            continue;
          }
        }

        // 5. Gerar PIX via Mercado Pago
        const planValue = parseFloat(client.plan?.price || client.product?.price || 0);
        const accessToken = settings.mercado_pago_access_token;

        let pixCode = '';
        let pixQrCode = '';
        let paymentId = '';
        let ticketUrl = '';
        let pixData: any = null;

        if (accessToken && planValue > 0) {
          console.log(`💳 Gerando PIX para ${client.name} - R$ ${planValue.toFixed(2)}`);

          const externalRef = `iptv-${client.id}-${Date.now()}`;
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

          const pixResponse = await fetch(`${appUrl}/api/payments/create-pix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              access_token: accessToken,
              amount: planValue,
              description: `Renovação ${client.plan?.name || client.product?.name || 'IPTV'} - ${client.name}`,
              external_reference: externalRef,
              payer_email: client.email || 'cliente@iptv.com',
              payer_name: client.name || 'Cliente',
              expiration_seconds: settings.mercado_pago_expiration || 86400
            })
          });

          pixData = await pixResponse.json();

          if (pixData.success) {
            pixCode = pixData.qr_code || '';
            pixQrCode = pixData.qr_code_base64 ? `data:image/png;base64,${pixData.qr_code_base64}` : '';
            paymentId = pixData.payment_id || '';
            ticketUrl = pixData.ticket_url || '';
            console.log(`✅ PIX gerado: ${paymentId}`);
          } else {
            console.error(`❌ Erro PIX para ${client.name}:`, pixData.error);
          }
        }

        // 6. Substituir variáveis no template
        const expDateFormatted = expDate.toLocaleDateString('pt-BR');
        const firstName = client.name?.split(' ')[0] || 'Cliente';

        let message = template
          .replace(/\{\{customer_first_name\}\}/gi, firstName)
          .replace(/\{\{customer_name\}\}/gi, client.name || 'Cliente')
          .replace(/\{\{customer_days\}\}/gi, Math.abs(diffDays).toString())
          .replace(/\{\{customer_duedate\}\}/gi, expDateFormatted)
          .replace(/\{\{customer_duedate_sh\}\}/gi, expDateFormatted)
          .replace(/\{\{customer_plan_value\}\}/gi, `R$ ${planValue.toFixed(2).replace('.', ',')}`)
          .replace(/\{\{customer_plan_name\}\}/gi, client.plan?.name || client.product?.name || 'N/A')
          .replace(/\{\{customer_usuario\}\}/gi, client.xtream_username || 'N/A')
          .replace(/\{\{customer_password\}\}/gi, client.xtream_password || 'N/A')
          .replace(/\{\{customer_email\}\}/gi, client.email || 'N/A')
          .replace(/\{\{customer_phone\}\}/gi, client.phone || 'N/A')
          .replace(/\{\{customer_product_name\}\}/gi, client.panel_name || 'N/A')
          .replace(/\{\{customer_checkout\}\}/gi, ticketUrl)
          .replace(/\{\{company_name\}\}/gi, settings.company_name || 'Inforlozzi')
          .replace(/\{\{pix_mercadopago_code\}\}/gi, pixCode)
          .replace(/\{\{pix_qrcode_url\}\}/gi, pixQrCode);

        // 7. ENVIAR VIA WHATSAPP (EVOLUTION API)
        const apiUrl = settings.whatsapp_api_url;
        const apiKey = settings.whatsapp_api_key;
        const instanceName = settings.whatsapp_instance_name || 'Inforplay';

        if (!apiUrl || !apiKey) {
          console.error(`❌ Evolution API não configurada`);
          errors++;
          continue;
        }

        const cleanPhone = client.phone.replace(/\D/g, '');
        console.log(`📤 Enviando para ${client.name} (${cleanPhone})...`);

        const whatsappResponse = await fetch(`${apiUrl}/message/sendText/${instanceName}`, {
          method: 'POST',
          headers: {
            'apikey': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: message
          })
        });

        const whatsappResult = await whatsappResponse.json();

        if (whatsappResponse.ok) {
          console.log(`✅ Mensagem enviada para ${client.name}`);
          
          await supabase.from('billing_logs').insert({
            client_id: client.id,
            type: type,
            days_offset: daysOffset,
            success: true,
            error_message: null,
            message_sent: message,
            payment_id: paymentId,
            qr_code_base64: pixData?.qr_code_base64 || '',
            ticket_url: ticketUrl
          });

          sent++;
        } else {
          console.error(`❌ Erro ao enviar para ${client.name}:`, whatsappResult);
          
          await supabase.from('billing_logs').insert({
            client_id: client.id,
            type: type,
            days_offset: daysOffset,
            success: false,
            error_message: whatsappResult.message || 'Falha ao enviar WhatsApp',
            message_sent: message,
            payment_id: paymentId,
            qr_code_base64: '',
            ticket_url: ticketUrl
          });

          errors++;
        }

      } catch (err: any) {
        console.error(` Erro crítico para ${client.name}:`, err.message);
        errors++;
      }
    }

    console.log(`\n🎉 Concluído! Enviadas: ${sent} | Erros: ${errors} | Ignoradas: ${skipped}`);

    return NextResponse.json({ 
      success: true, 
      sent, 
      errors,
      skipped
    });
  } catch (error: any) {
    console.error('Erro na automação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

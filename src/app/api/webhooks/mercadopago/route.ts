import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Webhook recebido:', body);

    if (body.type === 'payment') {
      const paymentId = body.data.id;

      // Consultar detalhes do pagamento
      const mpClient = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      });
      const payment = new Payment(mpClient);
      const paymentInfo = await payment.get({ id: paymentId });

      console.log('Status do pagamento:', paymentInfo.status);

      if (paymentInfo.status === 'approved') {
        // Buscar cobrança no banco
        const { data: invoice } = await supabase
          .from('iptv_invoices')
          .select('*, iptv_clients(*)')
          .eq('payment_gateway_id', paymentId.toString())
          .single();

        if (invoice) {
          // Atualizar status da cobrança
          await supabase
            .from('iptv_invoices')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
            })
            .eq('id', invoice.id);

          // Atualizar status do cliente para ativo
          await supabase
            .from('iptv_clients')
            .update({ status: 'active' })
            .eq('id', invoice.client_id);

          console.log(`Pagamento ${paymentId} confirmado para cliente ${invoice.iptv_clients?.name}`);

          // === ENVIAR MENSAGEM NO WHATSAPP DO CLIENTE ===
          if (invoice.iptv_clients?.phone) {
            await sendWhatsAppMessage(
              invoice.iptv_clients.phone,
              invoice.iptv_clients.name,
              invoice.amount
            );
          }

          // === ENVIAR MENSAGEM NO SEU WHATSAPP (ADMIN) ===
          // Substitua pelo SEU número (com DDD, ex: 5511999999999)
          const adminPhone = process.env.ADMIN_WHATSAPP_PHONE || '5511999999999';
          await sendAdminWhatsAppMessage(
            adminPhone,
            invoice.iptv_clients?.name || 'Cliente',
            invoice.amount,
            paymentId.toString()
          );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Função para enviar mensagem de confirmação para o CLIENTE
async function sendWhatsAppMessage(phone: string, clientName: string, amount: string) {
  try {
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'gestor-iptv';
    const message = `✅ *Pagamento Confirmado!*\n\nOlá ${clientName}!\n\nSeu pagamento de R$ ${parseFloat(amount).toFixed(2)} foi confirmado com sucesso.\n\nSeu acesso IPTV está *ATIVO* e funcionando normalmente.\n\nQualquer dúvida, estamos à disposição!\n\nObrigado pela preferência! 🎉`;

    const response = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': process.env.EVOLUTION_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: phone.replace(/\D/g, ''), // Remove caracteres não numéricos
        text: message,
      }),
    });

    const data = await response.json();
    console.log('Mensagem enviada para cliente:', data);
  } catch (error) {
    console.error('Erro ao enviar mensagem para cliente:', error);
  }
}

// Função para enviar mensagem de notificação para o ADMIN (VOCÊ)
async function sendAdminWhatsAppMessage(adminPhone: string, clientName: string, amount: string, paymentId: string) {
  try {
    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'gestor-iptv';
    const message = `💰 *NOVO PAGAMENTO RECEBIDO!*\n\n👤 Cliente: ${clientName}\n Valor: R$ ${parseFloat(amount).toFixed(2)}\n🔖 ID Pagamento: ${paymentId}\n✅ Status: APROVADO\n\nO acesso do cliente foi liberado automaticamente!`;

    const response = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': process.env.EVOLUTION_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        number: adminPhone.replace(/\D/g, ''),
        text: message,
      }),
    });

    const data = await response.json();
    console.log('Mensagem enviada para admin:', data);
  } catch (error) {
    console.error('Erro ao enviar mensagem para admin:', error);
  }
}

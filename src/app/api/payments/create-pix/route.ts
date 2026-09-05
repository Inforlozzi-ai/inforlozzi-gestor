import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { access_token, amount, description, external_reference, payer_email, payer_name, expiration_seconds } = body;

    if (!access_token) {
      return NextResponse.json({ error: 'Access Token não configurado' }, { status: 400 });
    }

    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
    }

    console.log(`💳 Gerando PIX: R$ ${amount} - ${description}`);

    const expirationDate = new Date(Date.now() + (expiration_seconds || 86400) * 1000).toISOString();

    // Montar o payload base
    const payload: any = {
      transaction_amount: parseFloat(amount),
      description: description || 'Renovação IPTV',
      payment_method_id: 'pix',
      payer: {
        email: payer_email || 'cliente@iptv.com',
        first_name: payer_name?.split(' ')[0] || 'Cliente',
        last_name: payer_name?.split(' ').slice(1).join(' ') || 'IPTV'
      },
      external_reference: external_reference || `iptv-${Date.now()}`,
      date_of_expiration: expirationDate
    };

    // Adicionar notification_url APENAS se for uma URL válida
    const webhookUrl = process.env.MERCADO_PAGO_WEBHOOK_URL;
    if (webhookUrl && (webhookUrl.startsWith('http://') || webhookUrl.startsWith('https://'))) {
      payload.notification_url = webhookUrl;
    }

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `iptv-${external_reference || Date.now()}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro Mercado Pago:', data);
      return NextResponse.json({ 
        error: data.message || 'Erro ao gerar pagamento',
        details: data 
      }, { status: 500 });
    }

    const pixData = data.point_of_interaction?.transaction_data || {};

    console.log('✅ PIX gerado com sucesso:', data.id);

    return NextResponse.json({
      success: true,
      payment_id: data.id,
      status: data.status,
      qr_code: pixData.qr_code || '',
      qr_code_base64: pixData.qr_code_base64 || '',
      ticket_url: pixData.ticket_url || ''
    });
  } catch (error: any) {
    console.error('Erro ao criar PIX:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

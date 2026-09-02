import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { clientId, amount, description, dueDate } = await request.json();

    const { data: client, error: clientError } = await supabase
      .from('iptv_clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ success: false, error: 'Cliente nao encontrado' }, { status: 404 });
    }

    const mpClient = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    });
    const payment = new Payment(mpClient);

    const paymentData = {
      transaction_amount: parseFloat(amount),
      description: description || 'Cobranca IPTV',
      payment_method_id: 'pix',
      payer: {
        email: client.email || 'cliente@email.com',
        first_name: client.name.split(' ')[0],
      },
      notification_url: process.env.MERCADOPAGO_WEBHOOK_URL,
    };

    const createdPayment = await payment.create({ body: paymentData });

    const qrBase64 = createdPayment.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCode = createdPayment.point_of_interaction?.transaction_data?.qr_code;

    const { data: invoice } = await supabase
      .from('iptv_invoices')
      .insert({
        client_id: clientId,
        amount: amount,
        due_date: dueDate,
        status: 'pending',
        pix_qr_code: qrBase64,
        pix_payload: qrCode,
        payment_gateway_id: createdPayment.id?.toString(),
        gateway_name: 'mercadopago',
      })
      .select()
      .single();

    return NextResponse.json({
      success: true,
      data: { invoice, qr_code_base64: qrBase64, qr_code: qrCode },
    });
  } catch (error: any) {
    console.error('Erro ao criar cobranca:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

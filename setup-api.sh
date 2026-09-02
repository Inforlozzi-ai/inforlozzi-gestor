#!/bin/bash
set -e

echo "Criando arquivos de API..."

# 1. Clients
cat > src/app/api/clients/route.ts << 'FILEEND'
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('iptv_clients')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('iptv_clients')
      .insert(body)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
FILEEND

# 2. Plans
cat > src/app/api/plans/route.ts << 'FILEEND'
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('iptv_plans')
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data, error } = await supabase
      .from('iptv_plans')
      .insert(body)
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
FILEEND

# 3. Create PIX
cat > src/app/api/payments/create-pix/route.ts << 'FILEEND'
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
FILEEND

# 4. Webhook Mercado Pago
cat > src/app/api/webhooks/mercadopago/route.ts << 'FILEEND'
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

    if (body.type === 'payment') {
      const paymentId = body.data.id;
      const mpClient = new MercadoPagoConfig({
        accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
      });
      const payment = new Payment(mpClient);
      const paymentInfo = await payment.get({ id: paymentId });

      if (paymentInfo.status === 'approved') {
        const { data: invoice } = await supabase
          .from('iptv_invoices')
          .select('*, iptv_clients(*)')
          .eq('payment_gateway_id', paymentId.toString())
          .single();

        if (invoice) {
          await supabase
            .from('iptv_invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString() })
            .eq('id', invoice.id);

          await supabase
            .from('iptv_clients')
            .update({ status: 'active' })
            .eq('id', invoice.client_id);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro no webhook:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
FILEEND

# 5. WhatsApp Create Instance
cat > src/app/api/whatsapp/create-instance/route.ts << 'FILEEND'
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { instanceName } = await request.json();
    const response = await axios.post(
      process.env.EVOLUTION_API_URL + '/instance/create',
      { instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' },
      { headers: { apikey: process.env.EVOLUTION_API_KEY } }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.response?.data || error.message }, { status: 500 });
  }
}
FILEEND

# 6. WhatsApp Get QR Code
cat > src/app/api/whatsapp/get-qrcode/route.ts << 'FILEEND'
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instanceName') || process.env.EVOLUTION_INSTANCE_NAME;
    const response = await axios.get(
      process.env.EVOLUTION_API_URL + '/instance/connect/' + instanceName,
      { headers: { apikey: process.env.EVOLUTION_API_KEY } }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.response?.data || error.message }, { status: 500 });
  }
}
FILEEND

# 7. WhatsApp Send Message
cat > src/app/api/whatsapp/send-message/route.ts << 'FILEEND'
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { instanceName, phone, message } = await request.json();
    const response = await axios.post(
      process.env.EVOLUTION_API_URL + '/message/sendText/' + instanceName,
      { number: phone, text: message },
      { headers: { apikey: process.env.EVOLUTION_API_KEY, 'Content-Type': 'application/json' } }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.response?.data || error.message }, { status: 500 });
  }
}
FILEEND

# 8. WhatsApp Check Status
cat > src/app/api/whatsapp/check-status/route.ts << 'FILEEND'
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instanceName') || process.env.EVOLUTION_INSTANCE_NAME;
    const response = await axios.get(
      process.env.EVOLUTION_API_URL + '/instance/connectionState/' + instanceName,
      { headers: { apikey: process.env.EVOLUTION_API_KEY } }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.response?.data || error.message }, { status: 500 });
  }
}
FILEEND

echo ""
echo "========================================="
echo "  TODOS OS ARQUIVOS CRIADOS COM SUCESSO!"
echo "========================================="
echo ""
find src/app/api -name "*.ts" -type f

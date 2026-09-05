import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Buscar configurações da Evolution API
    const { data: settings } = await supabase
      .from('billing_settings')
      .select('whatsapp_api_url, whatsapp_api_key')
      .limit(1)
      .single();

    if (!settings?.whatsapp_api_url || !settings?.whatsapp_api_key) {
      return NextResponse.json({ 
        success: false, 
        error: 'Evolution API não configurada' 
      }, { status: 400 });
    }

    // Buscar lista de instâncias da Evolution API
    const response = await fetch(`${settings.whatsapp_api_url}/instance/fetchInstances`, {
      headers: { 'apikey': settings.whatsapp_api_key }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        success: false, 
        error: 'Erro ao buscar instâncias' 
      }, { status: 500 });
    }

    const data = await response.json();
    
    // Evolution API retorna array de instâncias ou objeto
    const instances = Array.isArray(data) ? data : (data.instances || []);

    return NextResponse.json({ success: true, data: instances });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { instanceName } = body;

    if (!instanceName) {
      return NextResponse.json({ error: 'Nome da instância obrigatório' }, { status: 400 });
    }

    const { data: settings } = await supabase
      .from('billing_settings')
      .select('whatsapp_api_url, whatsapp_api_key')
      .limit(1)
      .single();

    if (!settings?.whatsapp_api_url || !settings?.whatsapp_api_key) {
      return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 400 });
    }

    // Criar instância na Evolution API
    const response = await fetch(`${settings.whatsapp_api_url}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': settings.whatsapp_api_key
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: errorData.message || 'Erro ao criar instância' }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

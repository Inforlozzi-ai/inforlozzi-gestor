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
      .select('*, plan:iptv_plans(*), product:iptv_products(*)')
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
    const { devices, ...clientData } = body;

    // 1. Inserir cliente
    const { data: client, error: clientError } = await supabase
      .from('iptv_clients')
      .insert(clientData)
      .select()
      .single();

    if (clientError) {
      console.error('Erro ao criar cliente:', clientError);
      return NextResponse.json({ 
        success: false, 
        error: clientError.message 
      }, { status: 500 });
    }

    // 2. Inserir dispositivos (se houver)
    if (devices && devices.length > 0 && client?.id) {
      const devicesToInsert = devices.map((d: any) => ({
        client_id: client.id,
        app_type: d.app_type || null,
        app_url: d.app_url || null,
        mac_address: d.mac_address || null,
        connections: d.connections || 1
      }));

      const { error: devicesError } = await supabase
        .from('client_devices')
        .insert(devicesToInsert);

      if (devicesError) {
        console.error('Erro ao criar dispositivos:', devicesError);
        // Não falha o cliente se só os dispositivos falharem
      }
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    console.error('Erro final:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

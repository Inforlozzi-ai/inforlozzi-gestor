import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    console.log('🔍 Verificando status do WhatsApp...');

    // 1. Buscar configurações
    const { data: settings } = await supabase
      .from('billing_settings')
      .select('*')
      .single();

    if (!settings) {
      return NextResponse.json({ connected: false, error: 'Configurações não encontradas' });
    }

    const apiUrl = settings.whatsapp_api_url || process.env.EVOLUTION_API_URL;
    const apiKey = settings.whatsapp_api_key || process.env.EVOLUTION_API_KEY;
    const instanceName = settings.whatsapp_instance_name || 'inforlozzi';

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ connected: false, error: 'API não configurada' });
    }

    // 2. Tentar múltiplos endpoints para garantir compatibilidade
    let isConnected = false;
    let state = 'unknown';

    // Tentativa 1: connectionState
    try {
      const res1 = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
        headers: { 'apikey': apiKey }
      });
      const data1 = await res1.json();
      console.log('📡 connectionState:', JSON.stringify(data1));

      if (data1?.state === 'open' || data1?.instance?.state === 'open') {
        isConnected = true;
        state = 'open';
      }
    } catch (e) {
      console.log('⚠️ connectionState falhou, tentando próximo endpoint');
    }

    // Tentativa 2: fetchInstances (se a primeira falhar)
    if (!isConnected) {
      try {
        const res2 = await fetch(`${apiUrl}/instance/fetchInstances`, {
          headers: { 'apikey': apiKey }
        });
        const data2 = await res2.json();
        console.log('📡 fetchInstances:', JSON.stringify(data2));

        const instance = Array.isArray(data2) 
          ? data2.find((i: any) => i.instance?.instanceName === instanceName || i.instanceName === instanceName)
          : data2;

        if (instance) {
          const instanceState = instance?.instance?.connectionState?.state || 
                               instance?.connectionState?.state || 
                               instance?.status;
          
          if (instanceState === 'open' || instanceState === 'connected') {
            isConnected = true;
            state = instanceState;
          }
        }
      } catch (e) {
        console.log('⚠️ fetchInstances também falhou');
      }
    }

    // Tentativa 3: instanceInfo (último recurso)
    if (!isConnected) {
      try {
        const res3 = await fetch(`${apiUrl}/instance/instanceInfo/${instanceName}`, {
          headers: { 'apikey': apiKey }
        });
        const data3 = await res3.json();
        console.log('📡 instanceInfo:', JSON.stringify(data3));

        if (data3?.instance?.connectionState?.state === 'open' || data3?.state === 'open') {
          isConnected = true;
          state = 'open';
        }
      } catch (e) {
        console.log('⚠️ instanceInfo também falhou');
      }
    }

    console.log(`✅ Status final: connected=${isConnected}, state=${state}`);

    return NextResponse.json({ 
      connected: isConnected,
      state,
      instanceName
    });

  } catch (error: any) {
    console.error('💥 Erro geral:', error);
    return NextResponse.json({ connected: false, error: error.message });
  }
}

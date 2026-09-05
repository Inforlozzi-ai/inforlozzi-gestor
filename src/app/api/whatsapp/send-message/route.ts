import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📤 Body recebido:', body);
    
    // Aceitar múltiplos nomes de campos para compatibilidade
    const phone = body.clientPhone || body.phone || body.number;
    const message = body.message || body.text;
    const mediaUrl = body.mediaUrl;
    const messageType = body.messageType || 'text';

    console.log('📱 Telefone:', phone);
    console.log('💬 Mensagem:', message?.substring(0, 50) + '...');

    if (!phone || !message) {
      return NextResponse.json({ 
        error: 'Telefone e mensagem são obrigatórios',
        received: { phone: !!phone, message: !!message }
      }, { status: 400 });
    }

    // Buscar configurações do banco (não do .env)
    const { data: settings } = await supabase
      .from('billing_settings')
      .select('*')
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 500 });
    }

    const apiUrl = settings.whatsapp_api_url;
    const apiKey = settings.whatsapp_api_key;
    const instanceName = settings.whatsapp_instance_name || 'Inforplay';

    console.log('🔧 Configurações:', { apiUrl, instanceName, hasKey: !!apiKey });

    if (!apiUrl || !apiKey) {
      return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 500 });
    }

    // Limpar telefone (remover tudo exceto números)
    const cleanPhone = phone.replace(/\D/g, '');
    console.log('📞 Telefone limpo:', cleanPhone);

    // Garantir quebras de linha
    const finalMessage = message.replace(/\\n/g, '\n');

    let endpoint = '';
    let requestBody: any = {};

    if (messageType === 'image' && mediaUrl) {
      endpoint = `${apiUrl}/message/sendMedia/${instanceName}`;
      requestBody = {
        number: cleanPhone,
        mediatype: 'image',
        media: mediaUrl,
        caption: finalMessage
      };
    } else {
      endpoint = `${apiUrl}/message/sendText/${instanceName}`;
      requestBody = {
        number: cleanPhone,
        text: finalMessage
      };
    }

    console.log('🚀 Enviando para:', endpoint);
    console.log('📦 Payload:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'apikey': apiKey, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('📥 Resposta Evolution API:', response.status, responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      console.error('❌ Erro Evolution API:', errorData);
      return NextResponse.json({ 
        error: errorData.message || errorData.error || 'Falha ao enviar',
        details: errorData
      }, { status: response.status });
    }

    const result = JSON.parse(responseText);
    console.log('✅ Mensagem enviada com sucesso:', result);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('💥 Erro inesperado:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

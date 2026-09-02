import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      clientPhone, 
      message, 
      mediaUrl, 
      messageType = 'text', // 'text' ou 'image'
      templateType 
    } = body;

    if (!clientPhone) {
      return NextResponse.json({ error: 'Telefone do cliente é obrigatório' }, { status: 400 });
    }

    // Buscar template se for do tipo template
    let finalMessage = message;
    if (templateType) {
      const { data: template } = await supabase
        .from('iptv_message_templates')
        .select('message')
        .eq('type', templateType)
        .eq('is_active', true)
        .single();

      if (template) {
        finalMessage = template.message;
      }
    }

    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'gestor-iptv';
    const cleanPhone = clientPhone.replace(/\D/g, '');

    // Preparar body da requisição
    let requestBody: any = {
      number: cleanPhone,
    };

    if (messageType === 'image' && mediaUrl) {
      // Enviar mensagem com imagem
      requestBody = {
        ...requestBody,
        mediaUrl: mediaUrl,
        caption: finalMessage || '',
      };
    } else {
      // Enviar mensagem de texto
      requestBody = {
        ...requestBody,
        text: finalMessage,
      };
    }

    // Enviar via Evolution API
    const response = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: {
        'apikey': process.env.EVOLUTION_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erro na Evolution API: ${errorData}`);
    }

    const data = await response.json();

    // Registrar no log
    await supabase.from('iptv_automation_logs').insert({
      client_id: body.clientId || null,
      action_type: 'mensagem_manual',
      status: 'success',
      message_detail: `Mensagem enviada via API - Template: ${templateType || 'personalizada'}`,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Mensagem enviada com sucesso!',
      data 
    });
  } catch (error: any) {
    console.error('Erro ao enviar mensagem:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

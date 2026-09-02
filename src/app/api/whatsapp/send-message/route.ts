import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientPhone, message, mediaUrl, messageType = 'text' } = body;

    if (!clientPhone || !message) {
      return NextResponse.json({ error: 'Telefone e mensagem são obrigatórios' }, { status: 400 });
    }

    // Garante que quebras de linha funcionem
    const finalMessage = message.replace(/\\n/g, '\n');

    const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'gestor-iptv';
    const cleanPhone = clientPhone.replace(/\D/g, '');

    let requestBody: any = { number: cleanPhone };

    if (messageType === 'image' && mediaUrl) {
      requestBody = { ...requestBody, mediaUrl: mediaUrl, caption: finalMessage };
    } else {
      requestBody = { ...requestBody, text: finalMessage };
    }

    const response = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
      method: 'POST',
      headers: { 'apikey': process.env.EVOLUTION_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) throw new Error('Falha ao enviar na Evolution API');

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

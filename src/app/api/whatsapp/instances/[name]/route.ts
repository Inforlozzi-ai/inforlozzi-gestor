import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: Request, { params }: { params: Promise<{ name: string }> }) {
  try {
    const { name } = await params;

    const { data: settings } = await supabase
      .from('billing_settings')
      .select('whatsapp_api_url, whatsapp_api_key')
      .limit(1)
      .single();

    if (!settings?.whatsapp_api_url || !settings?.whatsapp_api_key) {
      return NextResponse.json({ error: 'Evolution API não configurada' }, { status: 400 });
    }

    // Deletar instância da Evolution API
    const response = await fetch(`${settings.whatsapp_api_url}/instance/delete/${name}`, {
      method: 'DELETE',
      headers: { 'apikey': settings.whatsapp_api_key }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao deletar instância' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('billing_settings')
      .select('*')
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Buscar configuração existente
    const { data: existing } = await supabase
      .from('billing_settings')
      .select('id')
      .single();

    let result;

    if (existing?.id) {
      // Atualizar
      const { data, error } = await supabase
        .from('billing_settings')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Criar nova
      const { data, error } = await supabase
        .from('billing_settings')
        .insert(body)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log('✅ Configurações salvas:', result);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('❌ Erro ao salvar configurações:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json({ success: true, data }, {
      headers: { 'Cache-Control': 'no-store, max-age=0, must-revalidate' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log(' Criando plano:', body);
    
    // Converter duração para dias (se for meses, multiplica por 30)
    const durationDays = parseInt(body.duration_days) || 30;
    const durationType = body.duration_type || 'days';
    const finalDays = durationType === 'months' ? durationDays * 30 : durationDays;
    
    const { data, error } = await supabase
      .from('iptv_plans')
      .insert({
        name: body.name,
        price: parseFloat(body.price) || 0,
        duration_days: finalDays
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar plano:', error);
      throw error;
    }
    
    console.log('✅ Plano criado:', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro final:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

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
    console.log(' Criando cliente:', body);
    
    const { name, phone, email, xtream_username, xtream_password, status = 'active', panel_name, devices = [], expiration_date, photo_url, plan_name } = body;

    const { data, error } = await supabase
      .from('iptv_clients')
      .insert({
        name, phone, email, xtream_username, xtream_password, status,
        panel_name, devices, expiration_date, photo_url, plan_name
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao criar:', error);
      throw error;
    }
    
    console.log('✅ Cliente criado:', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro final:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('iptv_products')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

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
    console.log(' Criando produto:', body);
    
    const { data, error } = await supabase
      .from('iptv_products')
      .insert({
        name: body.name,
        description: body.description || '',
        price: parseFloat(body.price) || 0,
        active: body.active !== false
      })
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Produto criado:', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

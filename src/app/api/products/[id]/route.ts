import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { id: productId, created_at, ...dataToSave } = body;
    
    const cleanData: any = {};
    if (dataToSave.name !== undefined) cleanData.name = dataToSave.name;
    if (dataToSave.description !== undefined) cleanData.description = dataToSave.description;
    if (dataToSave.price !== undefined) cleanData.price = parseFloat(dataToSave.price) || 0;
    if (dataToSave.active !== undefined) cleanData.active = dataToSave.active;
    
    const { data, error } = await supabase
      .from('iptv_products')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('iptv_products').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

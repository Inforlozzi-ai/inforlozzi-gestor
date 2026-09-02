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
    
    console.log('📝 Atualizando plano:', id, body);
    
    const { id: planId, created_at, updated_at, ...dataToSave } = body;
    
    const cleanData: any = {};
    if (dataToSave.name !== undefined) cleanData.name = dataToSave.name;
    if (dataToSave.price !== undefined) cleanData.price = parseFloat(dataToSave.price) || 0;
    
    // Converter duração para dias
    if (dataToSave.duration_days !== undefined) {
      const durationDays = parseInt(dataToSave.duration_days) || 30;
      const durationType = dataToSave.duration_type || 'days';
      cleanData.duration_days = durationType === 'months' ? durationDays * 30 : durationDays;
    }
    
    console.log('📦 Dados limpos:', cleanData);
    
    const { data, error } = await supabase
      .from('iptv_plans')
      .update(cleanData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro:', error);
      throw error;
    }

    console.log('✅ Sucesso:', data);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Erro final:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('iptv_plans').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

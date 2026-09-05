import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para normalizar horário para "HH:MM"
const normalizeTime = (time: string) => {
  if (!time) return '09:30';
  return time.length >= 5 ? time.substring(0, 5) : time;
};

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('billing_settings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Erro Supabase GET:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const record = data && data.length > 0 ? data[0] : null;
    
    // Normalizar horários ao retornar
    if (record && Array.isArray(record.schedule_times)) {
      record.schedule_times = record.schedule_times.map(normalizeTime);
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Erro GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📥 Body recebido:', body);

    // Normalizar arrays e horários
    const daysBefore = Array.isArray(body.days_before) ? body.days_before : [3, 1];
    const daysAfter = Array.isArray(body.days_after) ? body.days_after : [1];
    
    let scheduleTimes = Array.isArray(body.schedule_times) ? body.schedule_times : ['09:30'];
    scheduleTimes = scheduleTimes.map(normalizeTime);

    // CORREÇÃO: Incluir TODOS os campos, incluindo WhatsApp e Mercado Pago
    const payload = {
      company_name: body.company_name || 'Inforlozzi',
      duplicate_check: body.duplicate_check ?? true,
      days_before: daysBefore,
      days_after: daysAfter,
      send_on_due_date: body.send_on_due_date ?? true,
      schedule_times: scheduleTimes,
      template_before: body.template_before || '',
      template_on_day: body.template_on_day || '',
      template_after: body.template_after || '',
      template_renewal: body.template_renewal || '',
      
      // Campos do WhatsApp (Evolution API)
      whatsapp_api_url: body.whatsapp_api_url || '',
      whatsapp_api_key: body.whatsapp_api_key || '',
      whatsapp_instance_name: body.whatsapp_instance_name || '',
      
      // Campos do Mercado Pago
      mercado_pago_access_token: body.mercado_pago_access_token || '',
      mercado_pago_expiration: body.mercado_pago_expiration || 86400,
      
      // Outros campos
      notification_image_url: body.notification_image_url || '',
      auto_renew: body.auto_renew ?? false,
      grace_period_days: body.grace_period_days ?? 3,
      max_reminders: body.max_reminders ?? 3,
      reminder_interval_hours: body.reminder_interval_hours ?? 24,
      
      updated_at: new Date().toISOString()
    };

    console.log(' Payload preparado:', payload);

    const { data: existing } = await supabase
      .from('billing_settings')
      .select('id')
      .limit(1);

    let result;

    if (existing && existing.length > 0) {
      console.log('🔄 Atualizando registro existente:', existing[0].id);
      result = await supabase
        .from('billing_settings')
        .update(payload)
        .eq('id', existing[0].id)
        .select()
        .single();
    } else {
      console.log('➕ Criando novo registro');
      result = await supabase
        .from('billing_settings')
        .insert(payload)
        .select()
        .single();
    }

    if (result.error) {
      console.error('❌ Erro ao salvar:', result.error);
      return NextResponse.json({ success: false, error: result.error.message }, { status: 500 });
    }

    console.log('✅ Salvo com sucesso:', result.data);
    return NextResponse.json({ success: true, data: result.data });
  } catch (error: any) {
    console.error('💥 Erro POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

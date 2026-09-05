import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const normalizeTime = (time: string) => time.length >= 5 ? time.substring(0, 5) : time;

export async function GET() {
  try {
    console.log('🤖 Verificando automação de lembretes...');

    const { data: settings } = await supabase
      .from('billing_settings')
      .select('*')
      .limit(1)
      .single();

    if (!settings) {
      return NextResponse.json({ error: 'Configurações não encontradas' }, { status: 400 });
    }

    // Obter horário atual no formato "HH:MM" (Horário de Brasília)
    const now = new Date();
    // Ajustar para UTC-3 (Brasília)
    const brasiliaTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const currentTime = `${String(brasiliaTime.getHours()).padStart(2, '0')}:${String(brasiliaTime.getMinutes()).padStart(2, '0')}`;
    
    // Normalizar horários configurados
    const scheduleTimes = (settings.schedule_times || []).map(normalizeTime);
    
    console.log(`⏰ Horário atual (Brasília): ${currentTime}`);
    console.log(`📋 Horários configurados: ${scheduleTimes.join(', ')}`);

    const shouldRun = scheduleTimes.includes(currentTime);

    if (!shouldRun) {
      console.log(`⏭️ Não é hora de enviar. Aguardando um dos horários: ${scheduleTimes.join(', ')}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Aguardando horário configurado',
        currentTime,
        nextRun: scheduleTimes
      });
    }

    console.log(`✅ Horário de envio atingido! Executando...`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const results: any = { before: 0, on_day: 0, after: 0, errors: 0 };

    const types = ['before', 'on_day', 'after'];

    for (const type of types) {
      try {
        const res = await fetch(`${appUrl}/api/billing/send-now`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type })
        });
        const data = await res.json();
        if (data.success) {
          results[type] = data.sent;
          results.errors += data.errors || 0;
          console.log(`📤 ${type}: ${data.sent} enviadas, ${data.errors} erros`);
        }
      } catch (err: any) {
        console.error(`❌ Erro ao executar ${type}:`, err.message);
        results.errors++;
      }
    }

    console.log('🎉 Automação concluída:', results);
    return NextResponse.json({ success: true, results, executedAt: currentTime });
  } catch (error: any) {
    console.error('Erro na automação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    console.log('🤖 Iniciando automação de cobranças...');

    const { data: invoices, error } = await supabase
      .from('iptv_invoices')
      .select('*, iptv_clients(name, phone)')
      .eq('status', 'pending');

    if (error) {
      console.error('Erro ao buscar cobranças:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!invoices || invoices.length === 0) {
      return NextResponse.json({ success: true, message: 'Nenhuma cobrança pendente encontrada.' });
    }

    let enviados = 0;
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    for (const invoice of invoices) {
      const dueDate = new Date(invoice.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - hoje.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Envia se vencer em até 3 dias, hoje, ou estiver vencido há até 3 dias
      if (diffDays >= -3 && diffDays <= 3) {
        const client = invoice.iptv_clients;
        if (!client?.phone) {
          console.log(`⚠️ Cliente ${client?.name || 'desconhecido'} sem telefone`);
          continue;
        }

        let mensagem = '';
        if (diffDays > 0) {
          mensagem = `⚠️ *Lembrete de Vencimento*\n\nOlá ${client.name}!\n\nSeu plano IPTV vence em *${diffDays} dia(s)* (${dueDate.toLocaleDateString('pt-BR')}).\n\n💰 Valor: R$ ${parseFloat(invoice.amount).toFixed(2)}\n\nEvite o bloqueio do seu acesso!`;
        } else if (diffDays === 0) {
          mensagem = `🚨 *Vence Hoje!*\n\nOlá ${client.name}!\n\nSeu plano IPTV vence *HOJE*.\n\n💰 Valor: R$ ${parseFloat(invoice.amount).toFixed(2)}\n\nRegularize agora para não perder o sinal!`;
        } else {
          mensagem = `🛑 *Acesso Suspenso*\n\nOlá ${client.name}.\n\nSeu plano IPTV está vencido há *${Math.abs(diffDays)} dia(s)*.\n\n💰 Valor em aberto: R$ ${parseFloat(invoice.amount).toFixed(2)}\n\nRegularize agora para reativar seu acesso imediatamente!`;
        }

        const instanceName = process.env.EVOLUTION_INSTANCE_NAME || 'gestor-iptv';
        const cleanPhone = client.phone.replace(/\D/g, '');

        try {
          const response = await fetch(`${process.env.EVOLUTION_API_URL}/message/sendText/${instanceName}`, {
            method: 'POST',
            headers: {
              'apikey': process.env.EVOLUTION_API_KEY!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              number: cleanPhone,
              text: mensagem,
            }),
          });

          if (response.ok) {
            enviados++;
            console.log(`✅ Lembrete enviado para ${client.name}`);
          } else {
            const errData = await response.text();
            console.error(`❌ Erro Evolution API para ${client.name}:`, errData);
          }
        } catch (err) {
          console.error(`❌ Falha ao enviar mensagem para ${client.name}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true, message: `${enviados} lembrete(s) enviado(s) com sucesso!` });
  } catch (error: any) {
    console.error('Erro na automação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clients } = body;

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json({ error: 'Nenhum cliente válido fornecido.' }, { status: 400 });
    }

    // Formatar os dados para o Supabase
    const clientsToInsert = clients.map((c: any) => ({
      name: c.name || c.nome,
      phone: String(c.phone || c.telefone || c.whatsapp).replace(/\D/g, ''),
      email: c.email || '',
      xtream_username: c.xtream_username || c.usuario || '',
      xtream_password: c.xtream_password || c.senha || '',
      status: 'active',
    }));

    // Inserir no banco
    const { data, error } = await supabase
      .from('iptv_clients')
      .insert(clientsToInsert)
      .select();

    if (error) {
      console.error('Erro ao importar:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: `${data.length} clientes importados com sucesso!` 
    });
  } catch (error: any) {
    console.error('Erro na importação:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

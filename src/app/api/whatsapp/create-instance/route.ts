import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { instanceName } = await request.json();
    const response = await axios.post(
      process.env.EVOLUTION_API_URL + '/instance/create',
      { instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' },
      { headers: { apikey: process.env.EVOLUTION_API_KEY } }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.response?.data || error.message }, { status: 500 });
  }
}

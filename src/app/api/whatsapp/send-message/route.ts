import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { instanceName, phone, message } = await request.json();
    const response = await axios.post(
      process.env.EVOLUTION_API_URL + '/message/sendText/' + instanceName,
      { number: phone, text: message },
      { headers: { apikey: process.env.EVOLUTION_API_KEY, 'Content-Type': 'application/json' } }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.response?.data || error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instanceName') || process.env.EVOLUTION_INSTANCE_NAME;
    const response = await axios.get(
      process.env.EVOLUTION_API_URL + '/instance/connect/' + instanceName,
      { headers: { apikey: process.env.EVOLUTION_API_KEY } }
    );
    return NextResponse.json({ success: true, data: response.data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.response?.data || error.message }, { status: 500 });
  }
}

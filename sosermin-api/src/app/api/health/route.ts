import { jsonResponse, optionsResponse } from '@/lib/route';

export async function GET() {
  return jsonResponse({
    ok: true,
    service: 'sosermin-api',
    timestamp: new Date().toISOString(),
  });
}

export async function OPTIONS() {
  return optionsResponse();
}

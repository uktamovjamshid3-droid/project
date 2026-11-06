import {loadCatalog} from '@/lib/server-catalog';
export const runtime='nodejs';
export async function GET() {
 return Response.json(await loadCatalog(),{headers:{'Cache-Control':'no-store'}});
}

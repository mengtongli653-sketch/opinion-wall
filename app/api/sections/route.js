import { NextResponse } from 'next/server';
import { listSections } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/sections — returns the current section list for client pickers.
export async function GET() {
  return NextResponse.json({ sections: listSections() });
}

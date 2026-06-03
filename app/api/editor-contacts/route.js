import { NextResponse } from 'next/server';
import { listEditorContacts } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Public read of the editorial contact list — powers the /letters page.
export async function GET() {
  return NextResponse.json({ contacts: listEditorContacts() });
}

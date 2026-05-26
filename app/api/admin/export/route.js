import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { isAdmin } from '@/lib/auth';
import { readLocaleFromCookies } from '@/lib/i18n';
import { buildExportWorkbook } from '@/lib/export';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!isAdmin()) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  const locale = readLocaleFromCookies(cookies());
  const wb = await buildExportWorkbook({ locale });
  const buffer = await wb.xlsx.writeBuffer();

  const pad = (n) => String(n).padStart(2, '0');
  const now = new Date();
  const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filename = `opinion-wall-export-${stamp}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

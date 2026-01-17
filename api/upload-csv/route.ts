import { NextRequest, NextResponse } from 'next/server';
import { insertReply } from '../../lib/db';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split('\n');
  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

function parseDate(dateStr: string): Date | null {
  // Format: "Sat, Jan 10, 2026" or "Wednesday, Jan 15, 2026"
  const match = dateStr.match(/(\w+),\s*(\w+)\s+(\d+),\s*(\d{4})/);
  if (!match) return null;

  const [, , month, day, year] = match;
  const monthMap: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  return new Date(parseInt(year), monthMap[month], parseInt(day));
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const content = await file.text();
    const rows = parseCSV(content);

    let imported = 0;
    let errors = 0;

    for (const row of rows) {
      const postId = row['Post id'];
      if (!postId) continue;

      const postedAt = parseDate(row['Date']);

      try {
        insertReply({
          post_id: postId,
          posted_at: postedAt?.toISOString() || null,
          reply_text: row['Post text'] || null,
          reply_url: row['Post Link'] || null,
          impressions: parseInt(row['Impressions']) || 0,
          likes: parseInt(row['Likes']) || 0,
          engagements: parseInt(row['Engagements']) || 0,
          bookmarks: parseInt(row['Bookmarks']) || 0,
          replies: parseInt(row['Replies']) || 0,
          reposts: parseInt(row['Reposts'] || row['Shares']) || 0,
          profile_visits: parseInt(row['Profile visits']) || 0
        });
        imported++;
      } catch {
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      errors,
      total: rows.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Upload failed'
    }, { status: 500 });
  }
}

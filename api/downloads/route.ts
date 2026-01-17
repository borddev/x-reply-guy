import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';

export async function GET() {
  try {
    const downloadsDir = path.join(os.homedir(), 'Downloads');
    const files = fs.readdirSync(downloadsDir);

    // Filter for X analytics CSV files and get stats
    const csvFiles = files
      .filter(f => f.endsWith('.csv') && f.includes('account_analytics'))
      .map(f => {
        const filePath = path.join(downloadsDir, f);
        const stats = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stats.size,
          modified: stats.mtime.toISOString()
        };
      })
      .sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
      .slice(0, 5); // Last 5 files

    return NextResponse.json({ files: csvFiles });
  } catch (error) {
    console.error('Error listing downloads:', error);
    return NextResponse.json({ files: [], error: 'Failed to list files' });
  }
}

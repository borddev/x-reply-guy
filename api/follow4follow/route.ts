import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// F4F data is stored locally in JSON files
const DATA_DIR = path.join(process.cwd(), 'automations', 'x-reply-guy');

function readJsonFile(filename: string) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const state = readJsonFile('follow4follow-state.json') || {};
    const sources = readJsonFile('follow4follow-sources.json') || [];

    // Calculate stats
    const users = state.users || {};
    const userList = Object.values(users) as any[];

    const totalFollowing = userList.length;
    const totalFollowBacks = userList.filter((u: any) => u.followedBack).length;
    const followBackRate = totalFollowing > 0
      ? Math.round((totalFollowBacks / totalFollowing) * 100)
      : 0;
    const pendingFollowBacks = totalFollowing - totalFollowBacks;

    // Recent follow backs
    const recentFollowBacks = userList
      .filter((u: any) => u.followedBack && u.followedBackAt)
      .sort((a: any, b: any) => new Date(b.followedBackAt).getTime() - new Date(a.followedBackAt).getTime())
      .slice(0, 10)
      .map((u: any) => ({
        username: u.username,
        source: u.source,
        followedAt: u.followedAt,
        followedBackAt: u.followedBackAt,
        daysToFollowback: u.followedAt && u.followedBackAt
          ? Math.round((new Date(u.followedBackAt).getTime() - new Date(u.followedAt).getTime()) / (1000 * 60 * 60 * 24))
          : null
      }));

    return NextResponse.json({
      stats: {
        totalFollowing,
        totalFollowBacks,
        followBackRate,
        pendingFollowBacks
      },
      sources,
      recentFollowBacks
    });
  } catch (error) {
    console.error('F4F API error:', error);
    return NextResponse.json({
      stats: {},
      sources: [],
      recentFollowBacks: [],
      error: 'Failed to load F4F data'
    });
  }
}

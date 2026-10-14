import { NextResponse } from 'next/server';
import { verifyToken, findUserById, findUserByLeetcodeUsername, updateUserProgress, getAllUsers } from '@/lib/db';
import problemsData from '@/data/problems.json';

const problemsList = problemsData as Array<{ id: number; titleSlug: string }>;
const slugToIdMap = new Map<string, number>();
const idSet = new Set<number>();

for (const p of problemsList) {
  slugToIdMap.set(p.titleSlug, p.id);
  idSet.add(p.id);
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    let userId: string | null = null;

    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        userId = payload.id;
      }
    }

    const body = await req.json().catch(() => ({}));
    const { username, solvedIds, titleSlugs, rawText } = body;

    let targetUser = userId ? findUserById(userId) : null;

    if (!targetUser && username) {
      targetUser = findUserByLeetcodeUsername(username);
    }

    // Fallback: if only one user exists in system and no target specified, assign to that user
    if (!targetUser) {
      const allUsers = getAllUsers();
      if (allUsers.length === 1) {
        targetUser = allUsers[0];
      }
    }

    const solvedSet = new Set<number>(targetUser?.solved || []);
    let newlyFoundCount = 0;

    // 1. Process explicit solvedIds (numeric or string)
    if (Array.isArray(solvedIds)) {
      for (const item of solvedIds) {
        const num = Number(item);
        if (!isNaN(num) && idSet.has(num)) {
          if (!solvedSet.has(num)) {
            solvedSet.add(num);
            newlyFoundCount++;
          }
        }
      }
    }

    // 2. Process title slugs
    if (Array.isArray(titleSlugs)) {
      for (const slug of titleSlugs) {
        const pid = slugToIdMap.get(String(slug).trim().toLowerCase());
        if (pid) {
          if (!solvedSet.has(pid)) {
            solvedSet.add(pid);
            newlyFoundCount++;
          }
        }
      }
    }

    // 3. Process raw pasted text (URLs, slugs, IDs, comma separated)
    if (typeof rawText === 'string' && rawText.trim()) {
      // Find URLs like https://leetcode.com/problems/title-slug/
      const urlRegex = /leetcode\.com\/problems\/([a-z0-9\-]+)/gi;
      let match;
      while ((match = urlRegex.exec(rawText)) !== null) {
        const slug = match[1].toLowerCase();
        const pid = slugToIdMap.get(slug);
        if (pid && !solvedSet.has(pid)) {
          solvedSet.add(pid);
          newlyFoundCount++;
        }
      }

      // Find standalone slugs / numbers split by commas, spaces, newlines
      const tokens = rawText.split(/[\s,;|]+/);
      for (const token of tokens) {
        const clean = token.trim().toLowerCase();
        if (!clean) continue;

        // Is it numeric ID?
        const num = Number(clean);
        if (!isNaN(num) && idSet.has(num)) {
          if (!solvedSet.has(num)) {
            solvedSet.add(num);
            newlyFoundCount++;
          }
          continue;
        }

        // Is it a known slug?
        const pid = slugToIdMap.get(clean);
        if (pid && !solvedSet.has(pid)) {
          solvedSet.add(pid);
          newlyFoundCount++;
        }
      }
    }

    const updatedSolvedList = Array.from(solvedSet);

    if (targetUser) {
      updateUserProgress(targetUser.id, { solved: updatedSolvedList });
    }

    return NextResponse.json(
      {
        success: true,
        user: targetUser ? targetUser.name || targetUser.leetcodeUsername : null,
        newlyFoundCount,
        totalSolvedCount: updatedSolvedList.length,
        solvedIds: updatedSolvedList,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Import failed' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}


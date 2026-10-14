import { NextResponse } from 'next/server';
import { verifyToken, findUserById, updateUserProgress } from '@/lib/db';
import atcoderProblemsData from '@/data/atcoderProblems.json';

const atcoderList = atcoderProblemsData as Array<{ id: string }>;
const validIdSet = new Set<string>();
for (const p of atcoderList) {
  validIdSet.add(p.id);
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    let userId: string | null = null;

    if (token) {
      const payload = verifyToken(token);
      if (payload) userId = payload.id;
    }

    const body = await req.json().catch(() => ({}));
    const { username, currentSolved = [] } = body;

    const trimmedUsername = (username || '').trim();
    if (!trimmedUsername) {
      return NextResponse.json({ error: 'AtCoder username is required' }, { status: 400 });
    }

    // Call Kenkoooo API for submissions
    const kenkooooUrl = `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(
      trimmedUsername
    )}&from_second=0`;

    const res = await fetch(kenkooooUrl, {
      headers: {
        'User-Agent': 'LCLevels-App',
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch submissions for AtCoder user "${trimmedUsername}"` },
        { status: 502 }
      );
    }

    const submissions = await res.json();
    if (!Array.isArray(submissions)) {
      return NextResponse.json({ error: 'Unexpected response from AtCoder API' }, { status: 502 });
    }

    const solvedSet = new Set<string>(currentSolved);
    let newlyFoundCount = 0;

    for (const sub of submissions) {
      if (sub.result === 'AC') {
        const pid = String(sub.problem_id);
        if (validIdSet.has(pid)) {
          if (!solvedSet.has(pid)) {
            solvedSet.add(pid);
            newlyFoundCount++;
          }
        }
      }
    }

    const updatedSolvedList = Array.from(solvedSet);

    // Save to user if logged in
    if (userId) {
      await updateUserProgress(userId, { atcoderSolved: updatedSolvedList });
    }

    return NextResponse.json({
      success: true,
      username: trimmedUsername,
      newlyFoundCount,
      totalContestSolvedCount: updatedSolvedList.length,
      solvedIds: updatedSolvedList,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AtCoder sync failed' }, { status: 500 });
  }
}


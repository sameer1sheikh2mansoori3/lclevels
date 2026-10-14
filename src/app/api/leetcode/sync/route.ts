import { NextResponse } from 'next/server';
import { verifyToken, findUserById, updateUserProgress } from '@/lib/db';
import problemsData from '@/data/problems.json';

const problemsList = problemsData as Array<{ id: number; titleSlug: string }>;
const slugToIdMap = new Map<string, number>();
const idSet = new Set<number>();

for (const p of problemsList) {
  slugToIdMap.set(p.titleSlug, p.id);
  idSet.add(p.id);
}

const RECENT_AC_QUERY = `
  query getRecentAc($username: String!) {
    recentAcSubmissionList(username: $username, limit: 100) {
      id
      title
      titleSlug
      timestamp
    }
    matchedUser(username: $username) {
      username
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`;

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

    const body = await req.json();
    const { username, sessionCookie, currentSolved = [] } = body;

    let targetUsername = (username || '').trim();
    let userRecord = userId ? findUserById(userId) : null;

    if (!targetUsername && userRecord?.leetcodeUsername) {
      targetUsername = userRecord.leetcodeUsername;
    }

    const solvedProblemIds = new Set<number>(currentSolved);
    let newlyFoundCount = 0;
    let syncMode: 'full_session' | 'recent_public' = 'recent_public';
    let totalAcReported = 0;

    // METHOD 1: Full sync using LEETCODE_SESSION cookie (if provided)
    if (sessionCookie && sessionCookie.trim()) {
      try {
        const cookieClean = sessionCookie.trim().replace(/^LEETCODE_SESSION=/i, '');
        const res = await fetch('https://leetcode.com/api/problems/all/', {
          headers: {
            Cookie: `LEETCODE_SESSION=${cookieClean}`,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Referer: 'https://leetcode.com/problemset/all/',
          },
        });

        if (res.ok) {
          const allData = await res.json();
          if (allData?.user_name) {
            targetUsername = allData.user_name;
          }
          totalAcReported = allData?.num_solved || 0;

          if (Array.isArray(allData?.stat_status_pairs)) {
            syncMode = 'full_session';
            for (const item of allData.stat_status_pairs) {
              if (item.status === 'ac') {
                const frontendId = Number(item.stat?.frontend_question_id);
                const titleSlug = item.stat?.question__title_slug;

                const matchedId = idSet.has(frontendId)
                  ? frontendId
                  : slugToIdMap.get(titleSlug);

                if (matchedId) {
                  if (!solvedProblemIds.has(matchedId)) {
                    solvedProblemIds.add(matchedId);
                    newlyFoundCount++;
                  }
                }
              }
            }
          }
        }
      } catch (cookieErr) {
        console.warn('Failed to sync via session cookie, will attempt public GraphQL:', cookieErr);
      }
    }

    // METHOD 2: Public GraphQL recent AC sync (if no cookie or cookie didn't yield all)
    if (syncMode !== 'full_session' && targetUsername) {
      try {
        const gqlRes = await fetch('https://leetcode.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Referer: `https://leetcode.com/u/${targetUsername}/`,
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          body: JSON.stringify({
            query: RECENT_AC_QUERY,
            variables: { username: targetUsername },
          }),
        });

        if (gqlRes.ok) {
          const gqlData = await gqlRes.json();
          const list = gqlData?.data?.recentAcSubmissionList || [];
          const submitStats = gqlData?.data?.matchedUser?.submitStatsGlobal?.acSubmissionNum;
          if (Array.isArray(submitStats)) {
            const allObj = submitStats.find((s: any) => s.difficulty === 'All');
            if (allObj) totalAcReported = allObj.count;
          }

          for (const sub of list) {
            const titleSlug = sub.titleSlug;
            const matchedId = slugToIdMap.get(titleSlug);
            if (matchedId) {
              if (!solvedProblemIds.has(matchedId)) {
                solvedProblemIds.add(matchedId);
                newlyFoundCount++;
              }
            }
          }
        }
      } catch (gqlErr) {
        console.warn('Failed to query public GraphQL recent ACs:', gqlErr);
      }
    }

    const updatedSolvedList = Array.from(solvedProblemIds);

    // Save to user's database record if logged in
    if (userId) {
      updateUserProgress(userId, { solved: updatedSolvedList });
    }

    return NextResponse.json({
      success: true,
      username: targetUsername,
      syncMode,
      totalAcReported,
      newlyFoundCount,
      totalContestSolvedCount: updatedSolvedList.length,
      solvedIds: updatedSolvedList,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Sync failed' }, { status: 500 });
  }
}

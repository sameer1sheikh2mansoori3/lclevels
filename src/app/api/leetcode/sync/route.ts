import { NextResponse } from 'next/server';
import { verifyToken, findUserById, updateUserProgress, getAllUsers, findUserByLeetcodeUsername } from '@/lib/db';
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
    recentAcSubmissionList(username: $username, limit: 20) {
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

    const body = await req.json().catch(() => ({}));
    const { username, sessionCookie, currentSolved = [], solvedIds, rawText } = body;

    let targetUsername = (username || '').trim();
    let userRecord = userId ? await findUserById(userId) : null;

    if (!userRecord && targetUsername) {
      userRecord = await findUserByLeetcodeUsername(targetUsername);
      if (userRecord) userId = userRecord.id;
    }

    if (!userRecord) {
      const all = getAllUsers();
      if (all.length === 1) {
        userRecord = all[0];
        userId = userRecord.id;
      }
    }

    if (!targetUsername && userRecord?.leetcodeUsername) {
      targetUsername = userRecord.leetcodeUsername;
    }

    const solvedProblemIds = new Set<number>(currentSolved);
    // Also include what is currently stored in userRecord
    if (userRecord?.solved) {
      for (const id of userRecord.solved) {
        solvedProblemIds.add(id);
      }
    }

    let newlyFoundCount = 0;
    let syncMode: 'full_session' | 'recent_public' | 'manual_paste' = 'recent_public';
    let totalAcReported = 0;

    // METHOD 1: Direct problem IDs passed
    if (Array.isArray(solvedIds) && solvedIds.length > 0) {
      syncMode = 'manual_paste';
      for (const item of solvedIds) {
        const num = Number(item);
        if (!isNaN(num) && idSet.has(num)) {
          if (!solvedProblemIds.has(num)) {
            solvedProblemIds.add(num);
            newlyFoundCount++;
          }
        }
      }
    }

    // METHOD 2: Raw text / URLs / Slugs pasted
    if (typeof rawText === 'string' && rawText.trim()) {
      syncMode = 'manual_paste';
      const urlRegex = /leetcode\.com\/problems\/([a-z0-9\-]+)/gi;
      let match;
      while ((match = urlRegex.exec(rawText)) !== null) {
        const slug = match[1].toLowerCase();
        const pid = slugToIdMap.get(slug);
        if (pid && !solvedProblemIds.has(pid)) {
          solvedProblemIds.add(pid);
          newlyFoundCount++;
        }
      }

      const tokens = rawText.split(/[\s,;|]+/);
      for (const token of tokens) {
        const clean = token.trim().toLowerCase();
        if (!clean) continue;
        const num = Number(clean);
        if (!isNaN(num) && idSet.has(num)) {
          if (!solvedProblemIds.has(num)) {
            solvedProblemIds.add(num);
            newlyFoundCount++;
          }
          continue;
        }
        const pid = slugToIdMap.get(clean);
        if (pid && !solvedProblemIds.has(pid)) {
          solvedProblemIds.add(pid);
          newlyFoundCount++;
        }
      }
    }

    // METHOD 3: Full sync using LEETCODE_SESSION cookie (if provided)
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
        console.warn('Failed to sync via session cookie:', cookieErr);
      }
    }

    // METHOD 4: Public GraphQL recent AC sync (if no cookie or in addition to handle)
    if (syncMode === 'recent_public' && targetUsername) {
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

    // Save to user's database record if user identified
    if (userId) {
      await updateUserProgress(userId, { solved: updatedSolvedList });
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

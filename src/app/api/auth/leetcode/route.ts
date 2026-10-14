import { NextResponse } from 'next/server';
import { loginOrCreateLeetcodeUser, generateToken } from '@/lib/db';
import problemsData from '@/data/problems.json';

const problemsList = problemsData as Array<{ id: number; titleSlug: string }>;
const slugToIdMap = new Map<string, number>();
for (const p of problemsList) {
  slugToIdMap.set(p.titleSlug, p.id);
}

const LEETCODE_GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql';

const USER_PROFILE_QUERY = `
  query getUserProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        realName
        userAvatar
        ranking
      }
      submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
      badge {
        name
      }
    }
    recentAcSubmissionList(username: $username, limit: 20) {
      id
      title
      titleSlug
      timestamp
    }
  }
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, mergeSolved, mergeStarred, mergeNotes } = body;

    const trimmedUsername = (username || '').trim();
    if (!trimmedUsername) {
      return NextResponse.json({ error: 'LeetCode username is required' }, { status: 400 });
    }

    let realName = trimmedUsername;
    let avatar: string | undefined;
    let rating: number | undefined;
    let badge: string | undefined;
    let ranking: number | undefined;
    const matchedRecentIds: number[] = [];

    // Fetch public profile and recent ACs from LeetCode GraphQL
    try {
      const lcRes = await fetch(LEETCODE_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Referer: 'https://leetcode.com',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          query: USER_PROFILE_QUERY,
          variables: { username: trimmedUsername },
        }),
      });

      if (lcRes.ok) {
        const lcData = await lcRes.json();
        const matched = lcData?.data?.matchedUser;
        if (!matched) {
          return NextResponse.json(
            { error: `No LeetCode profile found for username "${trimmedUsername}". Please verify your handle.` },
            { status: 404 }
          );
        }

        realName = matched.profile?.realName || matched.username;
        avatar = matched.profile?.userAvatar;
        ranking = matched.profile?.ranking;

        const contest = lcData?.data?.userContestRanking;
        if (contest) {
          rating = contest.rating;
          badge = contest.badge?.name;
        }

        // Auto-detect recently solved contest questions
        const recentList = lcData?.data?.recentAcSubmissionList || [];
        for (const sub of recentList) {
          const pid = slugToIdMap.get(sub.titleSlug);
          if (pid) {
            matchedRecentIds.push(pid);
          }
        }
      }
    } catch (networkErr) {
      console.warn('LeetCode GraphQL unreachable directly, falling back to local handle setup:', networkErr);
    }

    const combinedSolved = Array.from(new Set([...(mergeSolved || []), ...matchedRecentIds]));

    const user = loginOrCreateLeetcodeUser({
      username: trimmedUsername,
      password: password ? String(password).trim() : undefined,
      realName,
      avatar,
      rating,
      badge,
      ranking,
      mergeSolved: combinedSolved,
      mergeStarred: mergeStarred || [],
      mergeNotes: mergeNotes || {},
    });

    const token = generateToken(user);

    return NextResponse.json({
      token,
      autoSyncedCount: matchedRecentIds.length,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        solved: user.solved,
        starred: user.starred,
        notes: user.notes,
        leetcodeUsername: user.leetcodeUsername,
        leetcodeRating: user.leetcodeRating,
        leetcodeBadge: user.leetcodeBadge,
        leetcodeAvatar: user.leetcodeAvatar,
        leetcodeRanking: user.leetcodeRanking,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

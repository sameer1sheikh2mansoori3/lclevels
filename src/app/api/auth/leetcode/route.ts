import { NextResponse } from 'next/server';
import { loginOrCreateLeetcodeUser, generateToken } from '@/lib/db';

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
  }
`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, mergeSolved, mergeStarred, mergeNotes } = body;

    const trimmedUsername = (username || '').trim();
    if (!trimmedUsername) {
      return NextResponse.json({ error: 'LeetCode username is required' }, { status: 400 });
    }

    let realName = trimmedUsername;
    let avatar: string | undefined;
    let rating: number | undefined;
    let badge: string | undefined;
    let ranking: number | undefined;

    // Fetch public profile from LeetCode GraphQL
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
      }
    } catch (networkErr) {
      console.warn('LeetCode GraphQL unreachable directly, falling back to local handle setup:', networkErr);
      // Graceful fallback if network sandbox or proxy blocks LeetCode API
    }

    const user = loginOrCreateLeetcodeUser({
      username: trimmedUsername,
      realName,
      avatar,
      rating,
      badge,
      ranking,
      mergeSolved: mergeSolved || [],
      mergeStarred: mergeStarred || [],
      mergeNotes: mergeNotes || {},
    });

    const token = generateToken(user);

    return NextResponse.json({
      token,
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


import { NextResponse } from 'next/server';
import { verifyToken, findUserById } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    const user = findUserById(payload.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
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

